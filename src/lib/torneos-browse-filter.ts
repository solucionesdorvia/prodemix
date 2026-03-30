import type { TorneoBrowseItem, TorneoCategoryFilterId } from "@/domain";

import { normalizeSearchKey } from "@/lib/string-normalize";
import { getMockResultForMatch } from "@/mocks/mock-match-results";
import { getTournamentCatalogueEntryById } from "@/mocks/services/tournaments-catalogue.mock";

export type TorneoStatusFilter = "all" | "active" | "completed";

/** True when browse card says the competition ended. */
export function isCompletedTorneo(t: TorneoBrowseItem): boolean {
  return /finalizado/i.test(t.statusLabel);
}

/** Catalogue: at least one scheduled match still in the future without result. */
export function hasFutureOpenFixture(tournamentId: string): boolean {
  const t = getTournamentCatalogueEntryById(tournamentId);
  if (!t) return false;
  const now = Date.now();
  for (const m of t.matches) {
    if (getMockResultForMatch(m.id)) continue;
    if (new Date(m.startsAt).getTime() > now) return true;
  }
  return false;
}

export function collectDistinctRegions(items: TorneoBrowseItem[]): string[] {
  return [...new Set(items.map((i) => i.region))].sort((a, b) =>
    a.localeCompare(b, "es"),
  );
}

function matchesSearch(t: TorneoBrowseItem, q: string): boolean {
  if (!q.trim()) return true;
  const x = normalizeSearchKey(q);
  return (
    normalizeSearchKey(t.name).includes(x) ||
    normalizeSearchKey(t.subtitle).includes(x) ||
    normalizeSearchKey(t.region).includes(x) ||
    normalizeSearchKey(t.categoryLabel).includes(x) ||
    normalizeSearchKey(t.phaseLabel).includes(x)
  );
}

export function filterTorneoBrowseItems(
  items: TorneoBrowseItem[],
  opts: {
    category: TorneoCategoryFilterId;
    query: string;
    region: string;
    status: TorneoStatusFilter;
    upcomingOnly: boolean;
    followedOnly: boolean;
    followedIds: Set<string>;
  },
): TorneoBrowseItem[] {
  return items.filter((t) => {
    if (opts.category !== "todos" && t.categoryId !== opts.category) {
      return false;
    }
    if (!matchesSearch(t, opts.query)) return false;
    if (opts.region !== "all" && t.region !== opts.region) return false;
    if (opts.followedOnly && !opts.followedIds.has(t.id)) return false;
    if (opts.status === "active" && isCompletedTorneo(t)) return false;
    if (opts.status === "completed" && !isCompletedTorneo(t)) return false;
    if (opts.upcomingOnly && !hasFutureOpenFixture(t.id)) return false;
    return true;
  });
}

export function getBrowseCategoryForTournament(
  tournamentId: string,
  browseItems: TorneoBrowseItem[],
): TorneoCategoryFilterId | null {
  const row = browseItems.find((b) => b.id === tournamentId);
  return row ? row.categoryId : null;
}
