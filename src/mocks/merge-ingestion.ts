import type { TorneoBrowseItem } from "@/domain";
import type { TournamentCatalogueEntry } from "@/domain";

import { loadIngestionStorage } from "@/state/ingestion-storage";
import type { IngestedTournamentRecord } from "@/state/ingestion-types";

function toBrowseItem(r: IngestedTournamentRecord): TorneoBrowseItem {
  const teamSet = new Set(r.teams);
  for (const m of r.matches) {
    teamSet.add(m.homeTeam);
    teamSet.add(m.awayTeam);
  }
  return {
    id: r.id,
    name: r.name,
    subtitle: r.subtitle,
    categoryId: r.categoryId,
    categoryLabel: r.categoryLabel,
    region: r.region,
    statusLabel: r.statusLabel,
    phaseLabel: r.phaseLabel,
    teamsCount: teamSet.size,
    featured: r.featured,
  };
}

function toCatalogueEntry(r: IngestedTournamentRecord): TournamentCatalogueEntry {
  const matches = r.matches.map((m) => ({
    ...m,
    tournamentId: r.id,
  }));
  return {
    id: r.id,
    name: r.name,
    shortName: r.shortName,
    division: "primera",
    matchdays: [],
    matches,
  };
}

/** Ingested tournaments first, then static fixture. */
export function mergeTorneoBrowseItems(
  staticItems: TorneoBrowseItem[],
): TorneoBrowseItem[] {
  const ing = loadIngestionStorage();
  const extra = ing.tournaments.map(toBrowseItem);
  return [...extra, ...staticItems];
}

export function mergeTournamentCatalogue(
  staticEntries: TournamentCatalogueEntry[],
): TournamentCatalogueEntry[] {
  const ing = loadIngestionStorage();
  const extra = ing.tournaments.map(toCatalogueEntry);
  return [...extra, ...staticEntries];
}

export function findIngestedTournament(
  id: string,
): IngestedTournamentRecord | undefined {
  return loadIngestionStorage().tournaments.find((t) => t.id === id);
}
