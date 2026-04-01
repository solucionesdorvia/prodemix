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
  /** Plenos (marcador exacto, 3 pts c/u). */
  exactScores: number;
  /** Aciertos de signo sin pleno (1 pt c/u). */
  signHits: number;
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
