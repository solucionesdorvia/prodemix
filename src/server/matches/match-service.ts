import { prisma } from "@/server/db/prisma";
import { recomputeProdeScores } from "@/server/prode/score-recompute";

export class MatchServiceError extends Error {
  constructor(message: string, public readonly code: "NOT_FOUND" | "VALIDATION") {
    super(message);
    this.name = "MatchServiceError";
  }
}

export async function updateMatchScore(params: {
  matchId: string;
  homeScore: number;
  awayScore: number;
  status?: "scheduled" | "finished";
}) {
  const { matchId, homeScore, awayScore } = params;
  const status = params.status ?? "finished";

  if (homeScore < 0 || awayScore < 0) {
    throw new MatchServiceError("Scores must be non-negative", "VALIDATION");
  }

  const match = await prisma.match.findUnique({ where: { id: matchId } });
  if (!match) {
    throw new MatchServiceError("Match not found", "NOT_FOUND");
  }

  await prisma.$transaction(async (tx) => {
    await tx.match.update({
      where: { id: matchId },
      data: {
        homeScore,
        awayScore,
        status,
      },
    });

    const prodeLinks = await tx.prodeMatch.findMany({
      where: { matchId },
      select: { prodeId: true },
    });

    for (const { prodeId } of prodeLinks) {
      await recomputeProdeScores(prodeId, tx);
    }
  });

  return prisma.match.findUniqueOrThrow({
    where: { id: matchId },
    include: {
      homeTeam: true,
      awayTeam: true,
      tournament: true,
    },
  });
}
