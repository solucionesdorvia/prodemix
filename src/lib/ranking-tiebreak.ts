import type { ScorePrediction } from "@/domain";

/** ISO timestamp determinístico por bot + partido (desempate sin datos reales). */
export function seedSavedAtForBot(playerId: string, matchId: string): string {
  let h = 0;
  const s = `${playerId}::${matchId}`;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
  const base = Date.UTC(2026, 0, 5, 14, 0, 0, 0);
  return new Date(base + (h % 86_400_000)).toISOString();
}

/**
 * Añade `savedAt` sintético cuando falta (bots / datos legacy) para poder desempatar.
 */
export function withSyntheticSavedAtForPredictions(
  playerId: string,
  preds: Record<string, ScorePrediction | undefined>,
): Record<string, ScorePrediction | undefined> {
  const out: Record<string, ScorePrediction | undefined> = {};
  for (const [mid, v] of Object.entries(preds)) {
    if (!v) continue;
    const existing = (v as { savedAt?: string }).savedAt;
    const savedAt =
      typeof existing === "string" && existing.length > 0 ?
        existing
      : seedSavedAtForBot(playerId, mid);
    out[mid] = { home: v.home, away: v.away, savedAt };
  }
  return out;
}

/**
 * Mínimo `savedAt` entre partidos del scope con pronóstico (primera vez que guardó).
 * Desempate ASC: valor más bajo = guardó antes = mejor posición.
 * Alineado con `lastPredictionSavedAt ASC` cuando se interpreta como “quién registró antes”.
 */
export function lastPredictionSavedAtMsInScope(
  predictions: Record<string, ScorePrediction | undefined>,
  matchIds: string[],
): number {
  let min = Number.MAX_SAFE_INTEGER;
  let any = false;
  for (const mid of matchIds) {
    const pred = predictions[mid];
    if (!pred) continue;
    const s = (pred as { savedAt?: string }).savedAt;
    if (typeof s === "string" && s.length > 0) {
      const t = Date.parse(s);
      if (!Number.isNaN(t)) {
        min = Math.min(min, t);
        any = true;
      }
    }
  }
  if (!any) return Number.MAX_SAFE_INTEGER;
  return min;
}

export type RankingSortScalars = {
  points: number;
  exactScores: number;
  signHits: number;
  lastPredictionSavedAtMs: number;
  displayName: string;
};

/**
 * Orden: pts ↓ → plenos ↓ → aciertos de signo ↓ → marca de guardado más temprana (ASC) → nombre.
 */
export function compareRankingSortScalars(
  a: RankingSortScalars,
  b: RankingSortScalars,
): number {
  if (b.points !== a.points) return b.points - a.points;
  if (b.exactScores !== a.exactScores) return b.exactScores - a.exactScores;
  if (b.signHits !== a.signHits) return b.signHits - a.signHits;
  if (a.lastPredictionSavedAtMs !== b.lastPredictionSavedAtMs) {
    return a.lastPredictionSavedAtMs - b.lastPredictionSavedAtMs;
  }
  return a.displayName.localeCompare(b.displayName, "es");
}
