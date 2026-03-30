/** Inferred match outcome from a scoreline. */
export type MatchOutcome = "home" | "draw" | "away";

export function inferOutcome(homeGoals: number, awayGoals: number): MatchOutcome {
  if (homeGoals > awayGoals) return "home";
  if (homeGoals < awayGoals) return "away";
  return "draw";
}

/**
 * ProdeMix scoring:
 * - 3 pts exact score
 * - 1 pt correct outcome only
 * - 0 pts otherwise
 *
 * Examples (actual 2-1): 2-1 → 3; 1-0 / 3-2 → 1; 1-1 / 0-2 → 0.
 * Examples (actual 1-1): 1-1 → 3; 0-0 / 2-2 → 1; 1-0 → 0.
 */
export function pointsForPrediction(
  predicted: { home: number; away: number },
  actual: { home: number; away: number },
): 0 | 1 | 3 {
  if (predicted.home === actual.home && predicted.away === actual.away) {
    return 3;
  }
  if (
    inferOutcome(predicted.home, predicted.away) ===
    inferOutcome(actual.home, actual.away)
  ) {
    return 1;
  }
  return 0;
}

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
