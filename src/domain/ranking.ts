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
  /** Marcador exacto (3 pts cada uno con las reglas actuales) */
  exactScores: number;
  /** Acertaste ganador o empate pero no el marcador exacto (1 pt cada uno) */
  partialHits: number;
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
