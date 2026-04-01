import type { PredictionOutcome } from "@/generated/prisma/client";
import { prisma } from "@/server/db/prisma";

export type SubmitPredictionItem = {
  matchId: string;
  prediction: PredictionOutcome;
};

export class PredictionError extends Error {
  constructor(
    message: string,
    public readonly code:
      | "NOT_PARTICIPANT"
      | "UNKNOWN_MATCH"
      | "MATCH_LOCKED"
      | "VALIDATION"
  ) {
    super(message);
    this.name = "PredictionError";
  }
}

/**
 * Submits or updates predictions for a user in a prode.
 * Locks per match when `matchDate` has passed (cannot change after kickoff).
 */
export async function submitPredictions(params: {
  userId: string;
  prodeId: string;
  items: SubmitPredictionItem[];
}): Promise<{ count: number }> {
  const { userId, prodeId, items } = params;

  const participant = await prisma.prodeParticipant.findUnique({
    where: { prodeId_userId: { prodeId, userId } },
  });
  if (!participant) {
    throw new PredictionError("User is not a participant in this prode", "NOT_PARTICIPANT");
  }

  const allowedIds = new Set(
    (
      await prisma.prodeMatch.findMany({
        where: { prodeId },
        select: { matchId: true },
      })
    ).map((r) => r.matchId)
  );

  const now = new Date();

  return prisma.$transaction(async (tx) => {
    let count = 0;
    for (const item of items) {
      if (!allowedIds.has(item.matchId)) {
        throw new PredictionError(
          `Match ${item.matchId} is not part of this prode`,
          "UNKNOWN_MATCH"
        );
      }

      const match = await tx.match.findUniqueOrThrow({
        where: { id: item.matchId },
      });

      if (now >= match.matchDate) {
        throw new PredictionError(
          `Predictions are locked for match ${item.matchId}`,
          "MATCH_LOCKED"
        );
      }

      await tx.prediction.upsert({
        where: {
          userId_prodeId_matchId: {
            userId,
            prodeId,
            matchId: item.matchId,
          },
        },
        create: {
          userId,
          prodeId,
          matchId: item.matchId,
          prediction: item.prediction,
        },
        update: {
          prediction: item.prediction,
        },
      });
      count += 1;
    }
    return { count };
  });
}

export async function listPredictionsForUser(prodeId: string, userId: string) {
  return prisma.prediction.findMany({
    where: { prodeId, userId },
    orderBy: { createdAt: "asc" },
  });
}
