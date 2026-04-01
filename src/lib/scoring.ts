import type { ScorePrediction } from "@/domain/prediction";

/**
 * Internal band for comparing two scorelines (who’s ahead / draw).
 * Used only for partial-credit scoring, not for 1X2 UI.
 */
export type MatchOutcome = "home" | "draw" | "away";

export function inferOutcome(homeGoals: number, awayGoals: number): MatchOutcome {
  if (homeGoals > awayGoals) return "home";
  if (homeGoals < awayGoals) return "away";
  return "draw";
}

/**
 * ProdeMix scoring (frontend + mock results, marcador exacto):
 * - 3 pts: pleno (marcador predicho = resultado final)
 * - 1 pt: ganador o empate acertado, pero no el marcador exacto
 * - 0 pts: resto
 *
 * Ej. resultado real 2-1: 2-1 → 3; 1-0 / 3-2 → 1; 1-1 / 0-2 → 0.
 * Ej. resultado 1-1: 1-1 → 3; 0-0 / 2-2 → 1; 1-0 → 0.
 */
export function pointsForPrediction(
  predicted: ScorePrediction,
  actual: { home: number; away: number },
): 0 | 1 | 3 {
  const ph = predicted.predictedHomeScore;
  const pa = predicted.predictedAwayScore;
  if (ph === actual.home && pa === actual.away) {
    return 3;
  }
  if (inferOutcome(ph, pa) === inferOutcome(actual.home, actual.away)) {
    return 1;
  }
  return 0;
}
