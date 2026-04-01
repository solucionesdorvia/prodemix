import type { MatchId } from "./match";
import type { ProdeId } from "./prode";
import type { UserId } from "./user";

export type PredictionId = string;

/**
 * Exact-score prediction. Persists per user × match (optionally scoped to a prode).
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

/**
 * Marcador exacto por partido (cliente / persistencia local).
 * El scoring puede otorgar puntos parciales si el ganador o el empate coinciden sin pleno.
 */
export type ScorePrediction = {
  predictedHomeScore: number;
  predictedAwayScore: number;
};

/** Human-readable scoreline for activity rows and summaries. */
export function formatScorePredictionLine(p: ScorePrediction): string {
  return `${p.predictedHomeScore}-${p.predictedAwayScore}`;
}

/**
 * Normalizes persisted shapes: legacy `{ home, away }` → canonical `ScorePrediction`.
 */
export function normalizeScorePrediction(raw: unknown): ScorePrediction | null {
  if (!raw || typeof raw !== "object") return null;
  const o = raw as Record<string, unknown>;
  if (
    typeof o.predictedHomeScore === "number" &&
    typeof o.predictedAwayScore === "number") {
    return {
      predictedHomeScore: o.predictedHomeScore,
      predictedAwayScore: o.predictedAwayScore,
    };
  }
  if (typeof o.home === "number" && typeof o.away === "number") {
    return { predictedHomeScore: o.home, predictedAwayScore: o.away };
  }
  return null;
}
