import type { TournamentCatalogueEntry } from "@/domain";

import { mergeAdminProdeCatalogue } from "@/mocks/merge-admin-prodes";
import { PRIMERA_TOURNAMENT_CATALOGUE } from "@/mocks/catalog/primera-catalog";
import { mergeTournamentCatalogue } from "@/mocks/merge-ingestion";

/**
 * Data for armar grupos / torneos — mirrors future `GET /tournaments?include=matches`.
 * Solo Primera; fechas en `matchdays`, partidos con `matchdayId`.
 */
export function getTournamentCatalogue(): TournamentCatalogueEntry[] {
  const base = [...TOURNAMENT_CATALOGUE_FIXTURE];
  if (typeof window === "undefined") return mergeAdminProdeCatalogue(base);
  return mergeAdminProdeCatalogue(mergeTournamentCatalogue(base));
}

export function getTournamentCatalogueStatic(): TournamentCatalogueEntry[] {
  return [...TOURNAMENT_CATALOGUE_FIXTURE];
}

export function getTournamentCatalogueEntryById(
  id: string,
): TournamentCatalogueEntry | undefined {
  return getTournamentCatalogue().find((t) => t.id === id);
}

const TOURNAMENT_CATALOGUE_FIXTURE: TournamentCatalogueEntry[] =
  PRIMERA_TOURNAMENT_CATALOGUE;
