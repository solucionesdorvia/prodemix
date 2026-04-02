export type MatchOutcome = "home" | "away" | "draw";

/** Alias para ranking / servidor. */
export type ResultSign = MatchOutcome;

export function resultSign(homeGoals: number, awayGoals: number): MatchOutcome {
  if (homeGoals > awayGoals) return "home";
  if (awayGoals > homeGoals) return "away";
  return "draw";
}

export function inferOutcome(homeGoals: number, awayGoals: number): MatchOutcome {
  return resultSign(homeGoals, awayGoals);
}

export function outcomeLabelEs(outcome: MatchOutcome): string {
  switch (outcome) {
    case "home":
      return "Local";
    case "away":
      return "Visitante";
    default:
      return "Empate";
  }
}
