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
  if (a.minSavedAt == null && b.minSavedAt == null) return 0;
  if (a.minSavedAt == null) return 1;
  if (b.minSavedAt == null) return -1;
  return a.minSavedAt.getTime() - b.minSavedAt.getTime();
}

/** Sort by rules above, then assign dense ranks (1,2,2,3 for ties on all tie-breakers). */
export function sortAndAssignRanks(
  rows: LeaderboardRowInput[],
): LeaderboardRowRanked[] {
  const sorted = [...rows].sort(compareLeaderboardRows);
  const out: LeaderboardRowRanked[] = sorted.map((r) => ({
    ...r,
    rankPosition: 0,
  }));
  let rank = 1;
  for (let i = 0; i < out.length; i++) {
    const cur = out[i]!;
    if (i > 0) {
      const prev = out[i - 1]!;
      const sameRank =
        prev.points === cur.points &&
        prev.plenos === cur.plenos &&
        prev.signHits === cur.signHits &&
        (prev.minSavedAt?.getTime() ?? -1) === (cur.minSavedAt?.getTime() ?? -1);
      if (!sameRank) rank = i + 1;
    }
    cur.rankPosition = rank;
  }
  return out;
}
