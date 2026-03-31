import type { MatchdayId } from "./matchday";
import type { TournamentId } from "./tournament";

export type PublicPoolId = string;

export type PublicPoolType = "public_free" | "public_paid";

export type PublicPoolStatus = "open" | "closed" | "settled";

/**
 * Public prode for one fecha — paid or free, with prize pool metadata.
 */
export interface PublicPool {
  id: PublicPoolId;
  tournamentId: TournamentId;
  matchdayId: MatchdayId;
  type: PublicPoolType;
  /** ARS; 0 for free pools. */
  entryFeeArs: number;
  prizePoolArs: number;
  /** e.g. top 3 — percents should sum ~100. */
  payoutTopN: number;
  payoutPercents: readonly number[];
  participantsCount: number;
  status: PublicPoolStatus;
  closesAt: string;
}
