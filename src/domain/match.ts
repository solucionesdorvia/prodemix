import type { TournamentId } from "./tournament";

/**
 * Scheduled match. Results optional until finalized.
 */
export type MatchId = string;

export interface MatchResult {
  homeGoals: number;
  awayGoals: number;
  finalizedAt?: string;
}

export interface Match {
  id: MatchId;
  tournamentId: TournamentId;
  homeTeam: string;
  awayTeam: string;
  /** ISO 8601 kickoff */
  startsAt: string;
  /** Denormalized label for feed cards (until client joins tournament) */
  tournamentLabel?: string;
  /** Filter chips on home (`all` + category ids) */
  tags?: string[];
  result?: MatchResult | null;
}
