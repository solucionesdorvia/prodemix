import { getPrisma } from "@/lib/prisma";
import {
  type LeaderboardRowInput,
  sortAndAssignRanks,
} from "@/lib/ranking-sort";
import { scorePrediction } from "@/lib/scoring";

/**
 * Recomputes ProdeLeaderboardEntry for a prode from Match results + Predictions.
 * Sort: points desc, plenos desc, signHits desc, min(prediction.savedAt) asc (earlier is better).
 * Only users with JOINED ProdeEntry are ranked (others’ predictions are ignored).
 *
 * Puntos: se calculan con `Prediction` + `Match` (marcador oficial). Si faltan filas en
 * `ProdeMatch` pero hay pronósticos guardados para ese `matchId`, igual se puntúa
 * (union de partidos vinculados y partidos con pronósticos en el prode).
 */
export async function recalculateProdeLeaderboard(prodeId: string): Promise<void> {
  const prisma = getPrisma();

  const prodeMatchRows = await prisma.prodeMatch.findMany({
    where: { prodeId },
    select: { matchId: true },
  });
  const fromLinks = new Set(prodeMatchRows.map((r) => r.matchId));

  const participants = await prisma.prodeEntry.findMany({
    where: { prodeId, status: "JOINED" },
    select: { userId: true },
  });
  const participantIds = new Set(participants.map((p) => p.userId));

  const predictions = await prisma.prediction.findMany({
    where: { prodeId },
    include: {
      match: {
        select: { id: true, homeScore: true, awayScore: true },
      },
    },
  });

  const allowedMatchIds = new Set(fromLinks);
  for (const p of predictions) {
    allowedMatchIds.add(p.matchId);
  }

  const byUser = new Map<
    string,
    { points: number; plenos: number; signHits: number; minSavedAt: Date | null }
  >();

  for (const uid of participantIds) {
    byUser.set(uid, { points: 0, plenos: 0, signHits: 0, minSavedAt: null });
  }

  for (const p of predictions) {
    if (!participantIds.has(p.userId)) continue;
    if (!allowedMatchIds.has(p.matchId)) continue;

    const m = p.match;
    if (m.homeScore == null || m.awayScore == null) continue;

    const row = byUser.get(p.userId)!;
    const r = scorePrediction(
      p.predictedHomeScore,
      p.predictedAwayScore,
      m.homeScore,
      m.awayScore,
    );
    row.points += r.points;
    if (r.pleno) row.plenos += 1;
    if (r.signHit) row.signHits += 1;

    if (!row.minSavedAt || p.savedAt < row.minSavedAt) {
      row.minSavedAt = p.savedAt;
    }
  }

  const inputs: LeaderboardRowInput[] = [...byUser.entries()].map(
    ([userId, v]) => ({
      userId,
      points: v.points,
      plenos: v.plenos,
      signHits: v.signHits,
      minSavedAt: v.minSavedAt,
    }),
  );

  const rows = sortAndAssignRanks(inputs);

  const now = new Date();

  await prisma.$transaction(async (tx) => {
    if (rows.length === 0) {
      await tx.prodeLeaderboardEntry.deleteMany({ where: { prodeId } });
      return;
    }

    const keep = new Set(rows.map((r) => r.userId));
    await tx.prodeLeaderboardEntry.deleteMany({
      where: {
        prodeId,
        userId: { notIn: [...keep] },
      },
    });

    for (const row of rows) {
      await tx.prodeLeaderboardEntry.upsert({
        where: {
          prodeId_userId: { prodeId, userId: row.userId },
        },
        create: {
          prodeId,
          userId: row.userId,
          points: row.points,
          plenos: row.plenos,
          signHits: row.signHits,
          rankPosition: row.rankPosition,
          computedAt: now,
        },
        update: {
          points: row.points,
          plenos: row.plenos,
          signHits: row.signHits,
          rankPosition: row.rankPosition,
          computedAt: now,
        },
      });
    }
  });
}
