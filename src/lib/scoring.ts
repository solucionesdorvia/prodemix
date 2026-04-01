/** Inferred match outcome from a scoreline. */
export type MatchOutcome = "home" | "draw" | "away";

export function inferOutcome(homeGoals: number, awayGoals: number): MatchOutcome {
  if (homeGoals > awayGoals) return "home";
  if (homeGoals < awayGoals) return "away";
  return "draw";
}

type ScoreLine = { home: number; away: number };

/** Marcador exacto (pleno). */
export function isExactScoreHit(predicted: ScoreLine, actual: ScoreLine): boolean {
  return predicted.home === actual.home && predicted.away === actual.away;
}

/**
 * Acierto de signo: no es pleno, pero local / empate / visita coincide con el resultado.
 */
export function isCorrectSignHit(predicted: ScoreLine, actual: ScoreLine): boolean {
  if (isExactScoreHit(predicted, actual)) return false;
  return (
    inferOutcome(predicted.home, predicted.away) ===
    inferOutcome(actual.home, actual.away)
  );
}

/**
 * Puntos por un partido:
 * - Pleno: 3
 * - Acierto de signo: 1
 * - Error: 0
 */
export function pointsForSinglePrediction(
  predicted: ScoreLine,
  actual: ScoreLine,
): 0 | 1 | 3 {
  if (isExactScoreHit(predicted, actual)) return 3;
  if (isCorrectSignHit(predicted, actual)) return 1;
  return 0;
}

/** @alias pointsForSinglePrediction */
export const pointsForPrediction = pointsForSinglePrediction;

/** Short labels for UI (match cards, summaries). */
export function outcomeLabelEs(outcome: MatchOutcome): string {
  switch (outcome) {
    case "home":
      return "Gana local";
    case "away":
      return "Gana visitante";
    default:
      return "Empate";
  }
}
