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

/** AFA Premio en código: no se pisan con ingestión (evita duplicados y catálogo roto). */
function staticCatalogueIds(ids: { id: string }[]): Set<string> {
  return new Set(ids.map((x) => x.id));
}

/** Torneos estáticos primero; ingestión solo para IDs que no existan. */
export function mergeTorneoBrowseItems(
  staticItems: TorneoBrowseItem[],
): TorneoBrowseItem[] {
  const ing = loadIngestionStorage();
  const taken = staticCatalogueIds(staticItems);
  const extra = ing.tournaments
    .filter((r) => !taken.has(r.id))
    .map(toBrowseItem);
  return [...staticItems, ...extra];
}

export function mergeTournamentCatalogue(
  staticEntries: TournamentCatalogueEntry[],
): TournamentCatalogueEntry[] {
  const ing = loadIngestionStorage();
  const taken = staticCatalogueIds(staticEntries);
  const extra = ing.tournaments
    .filter((r) => !taken.has(r.id))
    .map(toCatalogueEntry);
  return [...staticEntries, ...extra];
}

export function findIngestedTournament(
  id: string,
): IngestedTournamentRecord | undefined {
  return loadIngestionStorage().tournaments.find((t) => t.id === id);
}
