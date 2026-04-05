import { MOCK_MATCH_RESULTS } from "@/mocks/mock-match-results";
import { getPrisma } from "@/lib/prisma";
import { recalculateProdeLeaderboard } from "@/lib/ranking-compute";

/**
 * Escribe en Prisma los marcadores definidos en `MOCK_MATCH_RESULTS` (catálogo / MVP)
 * y recalcula rankings de los prodes afectados. Idempotente: no toca filas que ya
 * coinciden (evita churn en `updatedAt` y recálculos vacíos).
 */
export async function syncCatalogMockResultsToDb(options?: {
  forceProdeId?: string | null;
}): Promise<{
  updated: number;
  skippedMissing: number;
  affectedProdeIds: string[];
}> {
  const prisma = getPrisma();
  const entries = Object.entries(MOCK_MATCH_RESULTS).filter(
    (e): e is [string, { home: number; away: number }] => e[1] != null,
  );

  const catalogIds = entries.map(([id]) => id);
  const existing = await prisma.match.findMany({
    where: { id: { in: catalogIds } },
    select: { id: true, homeScore: true, awayScore: true, status: true },
  });
  const byId = new Map(existing.map((r) => [r.id, r]));

  const toWrite: { id: string; home: number; away: number }[] = [];
  let skippedMissing = 0;

  for (const [matchId, scores] of entries) {
    const row = byId.get(matchId);
    if (!row) {
      skippedMissing += 1;
      continue;
    }
    if (
      row.homeScore === scores.home &&
      row.awayScore === scores.away &&
      row.status === "FINISHED"
    ) {
      continue;
    }
    toWrite.push({ id: matchId, home: scores.home, away: scores.away });
  }

  if (toWrite.length > 0) {
    await prisma.$transaction(
      toWrite.map((u) =>
        prisma.match.update({
          where: { id: u.id },
          data: {
            homeScore: u.home,
            awayScore: u.away,
            status: "FINISHED",
          },
        }),
      ),
    );
  }

  const changedMatchIds = toWrite.map((u) => u.id);
  const affected = new Set<string>();

  if (changedMatchIds.length > 0) {
    const fromLinks = await prisma.prodeMatch.findMany({
      where: { matchId: { in: changedMatchIds } },
      select: { prodeId: true },
    });
    for (const l of fromLinks) affected.add(l.prodeId);

    const fromPreds = await prisma.prediction.findMany({
      where: { matchId: { in: changedMatchIds } },
      select: { prodeId: true },
    });
    for (const p of fromPreds) affected.add(p.prodeId);
  }

  const force = options?.forceProdeId;
  if (force) affected.add(force);

  for (const pId of affected) {
    await recalculateProdeLeaderboard(pId);
  }

  return {
    updated: changedMatchIds.length,
    skippedMissing,
    affectedProdeIds: [...affected],
  };
}
