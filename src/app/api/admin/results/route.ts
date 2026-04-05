import { NextResponse } from "next/server";

import { logStructured } from "@/lib/observability";
import { parseAdminResultsPayload } from "@/lib/admin/parse-result-payload";
import { apiError } from "@/lib/api-errors";
import { getPrisma } from "@/lib/prisma";
import { recalculateProdeLeaderboard } from "@/lib/ranking-compute";
import { requireAdminApi } from "@/lib/require-admin";

export const dynamic = "force-dynamic";

/** Carga marcadores oficiales en `Match` y recalcula rankings de prodes afectados. */
export async function POST(req: Request) {
  const denied = await requireAdminApi();
  if (denied) return denied;

  const url = new URL(req.url);
  /** Prode elegido en admin: recalcular siempre, aunque falle el vínculo ProdeMatch. */
  const forceProdeId = url.searchParams.get("prodeId");

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return apiError(400, "INVALID_DATA", "Invalid JSON body.");
  }

  const parsed = parseAdminResultsPayload(body);
  if (!parsed.ok) {
    return parsed.response;
  }
  const results = parsed.results;

  const prisma = getPrisma();
  const affectedProdeIds = new Set<string>();

  for (const r of results) {
    const exists = await prisma.match.findUnique({
      where: { id: r.matchId },
      select: { id: true },
    });
    if (!exists) {
      return apiError(404, "NOT_FOUND", `Match not found: ${r.matchId}`);
    }
  }

  await prisma.$transaction(
    results.map((r) =>
      prisma.match.update({
        where: { id: r.matchId },
        data: {
          homeScore: r.homeScore,
          awayScore: r.awayScore,
          status: "FINISHED",
        },
      }),
    ),
  );

  const matchIds = results.map((r) => r.matchId);
  const links = await prisma.prodeMatch.findMany({
    where: { matchId: { in: matchIds } },
    select: { prodeId: true },
  });
  for (const l of links) {
    affectedProdeIds.add(l.prodeId);
  }

  for (const pId of affectedProdeIds) {
    await recalculateProdeLeaderboard(pId);
  }

  if (forceProdeId && !affectedProdeIds.has(forceProdeId)) {
    await recalculateProdeLeaderboard(forceProdeId);
    affectedProdeIds.add(forceProdeId);
  }

  logStructured("admin.results_updated", {
    matchCount: results.length,
    affectedProdeCount: affectedProdeIds.size,
    forceProdeId: forceProdeId ?? undefined,
  });

  return NextResponse.json({
    ok: true,
    updated: results.length,
    affectedProdeIds: [...affectedProdeIds],
  });
}
