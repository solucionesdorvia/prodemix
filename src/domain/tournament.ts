/**
 * Tournament / league entity. Ingestion & scraping populate `externalSourceId` + metadata.
 */
export type TournamentId = string;

export type TournamentCategory =
  | "futsal"
  | "futbol-8"
  | "amateur"
  | "barrial"
  | "club-local";

export type TournamentStatus =
  | "scheduled"
  | "in_progress"
  | "finished"
  | "cancelled";

export interface Tournament {
  id: TournamentId;
  name: string;
  shortName: string;
  category: TournamentCategory;
  region?: string | null;
  status?: TournamentStatus;
  /** Stable id from external feed or scraper */
  externalSourceId?: string | null;
  /** Last successful sync from ingestion */
  syncedAt?: string | null;
  createdAt?: string;
}
