import type { PredictionOutcome } from "@/generated/prisma/client";

/** 1X2 outcome from final scores. */
export function outcomeFromScores(homeScore: number, awayScore: number): PredictionOutcome {
  if (homeScore > awayScore) return "HOME";
  if (homeScore < awayScore) return "AWAY";
  return "DRAW";
}

export const POINTS_EXACT_OUTCOME = 3;

export function pointsForPrediction(
  predicted: PredictionOutcome,
  homeScore: number,
  awayScore: number
): number {
  return predicted === outcomeFromScores(homeScore, awayScore) ? POINTS_EXACT_OUTCOME : 0;
}
