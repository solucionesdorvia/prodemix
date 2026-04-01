/**
 * Agrega helpers de alto nivel sobre el scoring de prode (totales, nombres de dominio).
 * La lógica numérica vive en `scoring.ts`; el agregado por fixture en `state/selectors`.
 */

import type { ScorePrediction } from "@/domain";

/** Totales derivados por usuario en un prode (o pool con el mismo criterio). */
export type ProdeScoreTotals = {
  points: number;
  /** Plenos (marcador exacto). */
  plenos: number;
  /** Aciertos de signo sin pleno (1 pt c/u). */
  signHits: number;
  predictionsOnScored: number;
  /** Para desempate: min(primera marca por partido en el scope) — ASC gana. */
  lastPredictionSavedAtMs: number;
};

/** Mapea el breakdown del selector a nombres de producto (plenos / signHits). */
export function totalsFromRankingBreakdown(b: {
  points: number;
  exactScores: number;
  signHits: number;
  predictionsOnScored: number;
  lastPredictionSavedAtMs: number;
}): ProdeScoreTotals {
  return {
    points: b.points,
    plenos: b.exactScores,
    signHits: b.signHits,
    predictionsOnScored: b.predictionsOnScored,
    lastPredictionSavedAtMs: b.lastPredictionSavedAtMs,
  };
}

/** Partidos del prode con pronóstico guardado (para métricas de “completitud”). */
export function countPredictionsFilledInProde(
  predictions: Record<string, ScorePrediction | undefined>,
  matchIds: string[],
): number {
  let n = 0;
  for (const id of matchIds) {
    if (predictions[id]) n += 1;
  }
  return n;
}
