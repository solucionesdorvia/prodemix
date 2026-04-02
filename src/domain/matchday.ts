import type { TournamentId } from "./tournament";

export type MatchdayId = string;

export type MatchdayStatus =
  | "upcoming"
  | "open"
  | "closed"
  | "completed";

/**
 * A fecha / jornada within a tournament. Matches reference `matchdayId`.
 */
export interface Matchday {
  id: MatchdayId;
  tournamentId: TournamentId;
  name: string;
  roundNumber: number;
  /** First kickoff in this fecha (ISO). */
  startsAt: string;
  /** Cierre de pronósticos para la fecha (ISO) — 3 h antes del primer partido. */
  closesAt: string;
  status: MatchdayStatus;
}
