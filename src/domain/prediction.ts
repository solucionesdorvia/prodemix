import type { MatchId } from "./match";
import type { ProdeId } from "./prode";
import type { UserId } from "./user";

export type PredictionId = string;

/**
 * Exact-score prediction. Persists per user × match (optionally scoped to prode).
 */
export interface Prediction {
  id: PredictionId;
  userId: UserId;
  matchId: MatchId;
  /** When null, prediction is outside a specific prode (e.g. global pick) */
  prodeId?: ProdeId | null;
  homeGoals: number;
  awayGoals: number;
  submittedAt: string;
  updatedAt?: string;
}

/** Inline score for forms (no id yet). */
export type ScorePrediction = {
  home: number;
  away: number;
};
