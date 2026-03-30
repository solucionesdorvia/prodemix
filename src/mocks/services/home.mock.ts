import type { HomeStatsSnapshot } from "@/domain";

export function getHomeStatsSnapshot(): HomeStatsSnapshot {
  return { ...HOME_STATS_FIXTURE };
}

const HOME_STATS_FIXTURE: HomeStatsSnapshot = {
  weekPoints: 44,
  exactScores: 7,
  weekRank: 3,
  pendingMarkers: 7,
};
