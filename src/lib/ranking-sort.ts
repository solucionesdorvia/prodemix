/**
 * Pure leaderboard ordering + dense rank assignment (ties share rank).
 * Used by `recalculateProdeLeaderboard` and unit tests.
 */

export type LeaderboardRowInput = {
  userId: string;
  points: number;
  plenos: number;
  signHits: number;
  minSavedAt: Date | null;
};

export type LeaderboardRowRanked = LeaderboardRowInput & { rankPosition: number };

export function compareLeaderboardRows(
  a: LeaderboardRowInput,
  b: LeaderboardRowInput,
): number {
  if (b.points !== a.points) return b.points - a.points;
  if (b.plenos !== a.plenos) return b.plenos - a.plenos;
  if (b.signHits !== a.signHits) return b.signHits - a.signHits;
  if (a.minSavedAt == null && b.minSavedAt == null) {
    return a.userId.localeCompare(b.userId);
  }
  if (a.minSavedAt == null) return 1;
  if (b.minSavedAt == null) return -1;
  const dt = a.minSavedAt.getTime() - b.minSavedAt.getTime();
  if (dt !== 0) return dt;
  return a.userId.localeCompare(b.userId);
}

/**
 * Sort by rules above, then assign ordinal positions 1…n (siempre distintas).
 * Con puntos empatados, el orden entre iguales queda fijado por `userId`.
 */
export function sortAndAssignRanks(
  rows: LeaderboardRowInput[],
): LeaderboardRowRanked[] {
  const sorted = [...rows].sort(compareLeaderboardRows);
  return sorted.map((r, i) => ({
    ...r,
    rankPosition: i + 1,
  }));
}
