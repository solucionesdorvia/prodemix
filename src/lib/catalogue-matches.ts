import type { Match } from "@/domain";

import {
  getTournamentCatalogue,
  getTournamentCatalogueEntryById,
} from "@/mocks/services/tournaments-catalogue.mock";

/** All catalogue matches with tournament label for cards. */
export function getAllCatalogueMatchesWithLabels(): Match[] {
  const out: Match[] = [];
  for (const t of getTournamentCatalogue()) {
    for (const m of t.matches) {
      out.push({
        ...m,
        tournamentLabel: t.name,
      });
    }
  }
  return out;
}

export function findCatalogueMatchById(matchId: string): Match | undefined {
  for (const t of getTournamentCatalogue()) {
    const m = t.matches.find((x) => x.id === matchId);
    if (m) {
      return { ...m, tournamentLabel: t.name };
    }
  }
  return undefined;
}

export function getCatalogueEntryForMatchId(
  matchId: string,
): ReturnType<typeof getTournamentCatalogueEntryById> | undefined {
  for (const t of getTournamentCatalogue()) {
    if (t.matches.some((m) => m.id === matchId)) return t;
  }
  return undefined;
}

export function getMatchIdsForTournament(tournamentId: string): string[] {
  const t = getTournamentCatalogueEntryById(tournamentId);
  return t?.matches.map((m) => m.id) ?? [];
}
