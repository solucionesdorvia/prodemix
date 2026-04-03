import { NextResponse } from "next/server";

import { apiError } from "@/lib/api-errors";
import { getPrisma } from "@/lib/prisma";
import { findProdeByIdOrSlug } from "@/lib/prode-resolve";
import { requireAdminApi } from "@/lib/require-admin";
import { prodeRouteIdSchema } from "@/lib/validation/prodes-api";
import { zodToApiError } from "@/lib/validation/zod-to-api";

export const dynamic = "force-dynamic";

type MatchSummary = {
  id: string;
  startsAt: string;
  status: string;
  homeScore: number | null;
  awayScore: number | null;
  homeTeam: { name: string };
  awayTeam: { name: string };
};

type PredRow = {
  userId: string;
  user: {
    id: string;
    email: string | null;
    username: string | null;
    name: string | null;
  };
  predictedHomeScore: number;
  predictedAwayScore: number;
  savedAt: string;
  updatedAt: string;
};

/** Todos los pronósticos del prode, agrupados por partido (orden por fecha del partido). */
export async function GET(
  _req: Request,
  context: { params: Promise<{ id: string }> },
) {
  const denied = await requireAdminApi();
  if (denied) return denied;

  const { id: rawId } = await context.params;
  const idParsed = prodeRouteIdSchema.safeParse(rawId);
  if (!idParsed.success) return zodToApiError(idParsed.error);

  const prisma = getPrisma();
  const prode = await findProdeByIdOrSlug(prisma, idParsed.data);
  if (!prode) return apiError(404, "NOT_FOUND", "Prode no encontrado.");

  const links = await prisma.prodeMatch.findMany({
    where: { prodeId: prode.id },
    select: { matchId: true },
  });
  const linkedMatchIds = links.map((l) => l.matchId);

  const catalogueMatches =
    linkedMatchIds.length > 0 ?
      await prisma.match.findMany({
        where: { id: { in: linkedMatchIds } },
        select: {
          id: true,
          startsAt: true,
          status: true,
          homeScore: true,
          awayScore: true,
          homeTeam: { select: { name: true } },
          awayTeam: { select: { name: true } },
        },
      })
    : [];

  const byMatchId = new Map<
    string,
    { match: MatchSummary; predictions: PredRow[] }
  >();

  for (const m of catalogueMatches) {
    byMatchId.set(m.id, {
      match: {
        id: m.id,
        startsAt: m.startsAt.toISOString(),
        status: m.status,
        homeScore: m.homeScore,
        awayScore: m.awayScore,
        homeTeam: m.homeTeam,
        awayTeam: m.awayTeam,
      },
      predictions: [],
    });
  }

  const rows = await prisma.prediction.findMany({
    where: { prodeId: prode.id },
    include: {
      user: {
        select: { id: true, email: true, username: true, name: true },
      },
      match: {
        select: {
          id: true,
          startsAt: true,
          status: true,
          homeScore: true,
          awayScore: true,
          homeTeam: { select: { name: true } },
          awayTeam: { select: { name: true } },
        },
      },
    },
  });

  for (const r of rows) {
    const m = r.match;
    const predRow: PredRow = {
      userId: r.userId,
      user: r.user,
      predictedHomeScore: r.predictedHomeScore,
      predictedAwayScore: r.predictedAwayScore,
      savedAt: r.savedAt.toISOString(),
      updatedAt: r.updatedAt.toISOString(),
    };

    const existing = byMatchId.get(m.id);
    if (existing) {
      existing.predictions.push(predRow);
    } else {
      byMatchId.set(m.id, {
        match: {
          id: m.id,
          startsAt: m.startsAt.toISOString(),
          status: m.status,
          homeScore: m.homeScore,
          awayScore: m.awayScore,
          homeTeam: m.homeTeam,
          awayTeam: m.awayTeam,
        },
        predictions: [predRow],
      });
    }
  }

  const byMatch = [...byMatchId.values()].sort(
    (a, b) =>
      new Date(a.match.startsAt).getTime() -
      new Date(b.match.startsAt).getTime(),
  );

  for (const block of byMatch) {
    block.predictions.sort((a, b) => {
      const ua = a.user.username ?? a.user.email ?? a.user.name ?? "";
      const ub = b.user.username ?? b.user.email ?? b.user.name ?? "";
      return ua.localeCompare(ub, "es");
    });
  }

  return NextResponse.json({
    prodeId: prode.id,
    totalPredictions: rows.length,
    byMatch,
  });
}
