import type { Match, TorneoCategoryFilterId } from "@/domain";

/**
 * Custom tournament loaded via /admin/mock-ingestion — merged into browse + catalogue mocks.
 */
export interface IngestedTournamentRecord {
  id: string;
  name: string;
  shortName: string;
  subtitle: string;
  categoryId: Exclude<TorneoCategoryFilterId, "todos">;
  categoryLabel: string;
  region: string;
  statusLabel: string;
  phaseLabel: string;
  featured: boolean;
  /** Organizer / seed list — informational. */
  teams: string[];
  matches: Match[];
  /** Final scores keyed by match id (subset of matches). */
  results: Record<string, { home: number; away: number }>;
}

export interface IngestionStorage {
  tournaments: IngestedTournamentRecord[];
}

export const DEFAULT_INGESTION: IngestionStorage = {
  tournaments: [],
};
