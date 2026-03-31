/**
 * Leaderboard row. Computed server-side from predictions + results.
 */
export type RankingTrend = "up" | "down" | "same";

export type RankingScope =
  | "global"
  | "friends"
  | "liga"
  | "tournament"
  /** Leaderboard for one public pool / fecha. */
  | "fecha";

export interface RankingEntry {
  rank: number;
  playerId: string;
  displayName: string;
  points: number;
  /** Full exact-score hits (3 pts each under current rules) */
  exactScores: number;
  /** Outcome-only hits (1 pt each) */
  outcomeOnly: number;
  /**
   * Pronósticos sobre partidos ya jugados (con resultado) en este scope.
   */
  predictionsOnScored?: number;
  streakDays?: number;
  trend?: RankingTrend;
  /** Positive = climbed positions since last visit (mock, local snapshot) */
  rankDelta?: number;
  scope?: RankingScope;
}
