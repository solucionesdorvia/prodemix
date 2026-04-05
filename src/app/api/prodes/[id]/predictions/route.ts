import { NextResponse } from "next/server";

import { auth } from "@/auth";
import { logStructured } from "@/lib/observability";
import { apiError } from "@/lib/api-errors";
import { getClientIpFromHeaders } from "@/lib/client-ip";
import { rateLimit } from "@/lib/rate-limit";
import { rateLimitResponse } from "@/lib/rate-limit-response";
import { assertCanViewProde, canSubmitPredictions } from "@/lib/prode-access";
import { getPrisma } from "@/lib/prisma";
import { recalculateProdeLeaderboard } from "@/lib/ranking-compute";
import { findProdeByIdOrSlug } from "@/lib/prode-resolve";
import { parseJsonBody } from "@/lib/validation/parse-json";
import {
  predictionsPostBodySchema,
  prodeRouteIdSchema,
} from "@/lib/validation/prodes-api";
import { zodToApiError } from "@/lib/validation/zod-to-api";

export const dynamic = "force-dynamic";

/** Current user’s saved predictions for this prode (read-only mirror for clients). */
export async function GET(
  _req: Request,
  context: { params: Promise<{ id: string }> },
) {
  const { id: rawId } = await context.params;
  const idParsed = prodeRouteIdSchema.safeParse(rawId);
  if (!idParsed.success) {
    return zodToApiError(idParsed.error);
  }
  const id = idParsed.data;

  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) {
    return apiError(401, "UNAUTHORIZED", "Authentication required.");
  }

  const prisma = getPrisma();
  const prode = await findProdeByIdOrSlug(prisma, id);
  if (!prode) {
    return apiError(404, "NOT_FOUND", "Prode not found.");
  }

  const access = await assertCanViewProde(userId, prode);
  if (!access.ok) return access.response;

  const rows = await prisma.prediction.findMany({
    where: { userId, prodeId: prode.id },
    select: {
      matchId: true,
      predictedHomeScore: true,
      predictedAwayScore: true,
      savedAt: true,
    },
  });

  return NextResponse.json({
    predictions: rows.map((r) => ({
      matchId: r.matchId,
      home: r.predictedHomeScore,
      away: r.predictedAwayScore,
      savedAt: r.savedAt.toISOString(),
    })),
  });
}

export async function POST(
  req: Request,
  context: { params: Promise<{ id: string }> },
) {
  const { id: rawId } = await context.params;
  const idParsed = prodeRouteIdSchema.safeParse(rawId);
  if (!idParsed.success) {
    return zodToApiError(idParsed.error);
  }
  const id = idParsed.data;

  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) {
    return apiError(401, "UNAUTHORIZED", "Authentication required.");
  }

  const ip = getClientIpFromHeaders(req.headers);
  const rl = rateLimit(`pred_user:${userId}:${ip}`, 90, 60_000);
  if (!rl.ok) {
    return rateLimitResponse(rl.retryAfterSec);
  }

  const bodyResult = await parseJsonBody(req, predictionsPostBodySchema);
  if (!bodyResult.ok) {
    return bodyResult.response;
  }
  const parsed = bodyResult.data;

  const prisma = getPrisma();
  const prode = await findProdeByIdOrSlug(prisma, id);
  if (!prode) {
    return apiError(404, "NOT_FOUND", "Prode not found.");
  }

  const access = await assertCanViewProde(userId, prode);
  if (!access.ok) return access.response;

  const now = new Date();
  if (!canSubmitPredictions(prode, now)) {
    return apiError(
      403,
      "PREDICTION_WINDOW_CLOSED",
      "Predictions are closed for this prode.",
    );
  }

  const entry = await prisma.prodeEntry.findUnique({
    where: {
      userId_prodeId: { userId, prodeId: prode.id },
    },
  });
  if (!entry || entry.status !== "JOINED") {
    return apiError(
      403,
      "NOT_PARTICIPATING",
      "Join this prode before submitting predictions.",
    );
  }

  const allowedIds = new Set(
    (
      await prisma.prodeMatch.findMany({
        where: { prodeId: prode.id },
        select: { matchId: true },
      })
    ).map((r) => r.matchId),
  );

  for (const p of parsed.predictions) {
    if (!allowedIds.has(p.matchId)) {
      return apiError(
        422,
        "INVALID_DATA",
        `Match ${p.matchId} is not part of this prode.`,
      );
    }
  }

  const ts = new Date();
  await prisma.$transaction(
    parsed.predictions.map((item) =>
      prisma.prediction.upsert({
        where: {
          userId_prodeId_matchId: {
            userId,
            prodeId: prode.id,
            matchId: item.matchId,
          },
        },
        create: {
          userId,
          prodeId: prode.id,
          matchId: item.matchId,
          predictedHomeScore: item.predictedHomeScore,
          predictedAwayScore: item.predictedAwayScore,
          savedAt: ts,
        },
        update: {
          predictedHomeScore: item.predictedHomeScore,
          predictedAwayScore: item.predictedAwayScore,
          savedAt: ts,
        },
      }),
    ),
  );

  logStructured("predictions.saved", {
    prodeId: prode.id,
    matchCount: parsed.predictions.length,
  });

  await recalculateProdeLeaderboard(prode.id);

  return NextResponse.json({ ok: true, saved: parsed.predictions.length });
}
