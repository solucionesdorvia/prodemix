import { type Prisma } from "@/generated/prisma/client";
import { prisma } from "@/server/db/prisma";
import { pointsForPrediction } from "@/server/prode/scoring";

/**
 * Recomputes aggregate `Score` rows for a prode from finished matches + predictions.
 * Call after match results change.
 */
export async function recomputeProdeScores(
  prodeId: string,
  tx?: Prisma.TransactionClient
): Promise<void> {
  const db = tx ?? prisma;

  const prodeMatches = await db.prodeMatch.findMany({
    where: { prodeId },
    include: {
      match: true,
    },
  });

  const matchById = new Map(prodeMatches.map((pm) => [pm.matchId, pm.match]));

  const predictions = await db.prediction.findMany({
    where: { prodeId },
  });

  const pointsByUser = new Map<string, number>();

  for (const p of predictions) {
    const m = matchById.get(p.matchId);
    if (
      !m ||
      m.status !== "finished" ||
      m.homeScore === null ||
      m.awayScore === null
    ) {
      continue;
    }
    const pts = pointsForPrediction(p.prediction, m.homeScore, m.awayScore);
    pointsByUser.set(p.userId, (pointsByUser.get(p.userId) ?? 0) + pts);
  }

  const participants = await db.prodeParticipant.findMany({
    where: { prodeId },
    select: { userId: true },
  });

  for (const { userId } of participants) {
    if (!pointsByUser.has(userId)) {
      pointsByUser.set(userId, 0);
    }
  }

  for (const [userId, points] of pointsByUser) {
    await db.score.upsert({
      where: {
        userId_prodeId: { userId, prodeId },
      },
      create: { userId, prodeId, points },
      update: { points },
    });
  }
}
