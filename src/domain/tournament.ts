/**
 * Tournament / league entity. Ingestion & scraping populate `externalSourceId` + metadata.
 */
export type TournamentId = string;

/** Top division only in current product scope. */
export type TournamentDivision = "primera";

export type TournamentCategory = "futsal";

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
