import type { TournamentCatalogueEntry } from "@/domain";

import { buildJomaHonorAMatches } from "@/mocks/fixtures/joma-honor-a-apertura";
import { mergeTournamentCatalogue } from "@/mocks/merge-ingestion";

/**
 * Data for “crear prode” — mirrors future `GET /tournaments?include=matches`.
 * Tournament ids align with `torneos-browse` so follows + crear share one id space.
 * Ingested tournaments (localStorage) are merged in the browser.
 */
export function getTournamentCatalogue(): TournamentCatalogueEntry[] {
  const base = [...TOURNAMENT_CATALOGUE_FIXTURE];
  if (typeof window === "undefined") return base;
  return mergeTournamentCatalogue(base);
}

export function getTournamentCatalogueStatic(): TournamentCatalogueEntry[] {
  return [...TOURNAMENT_CATALOGUE_FIXTURE];
}

export function getTournamentCatalogueEntryById(
  id: string,
): TournamentCatalogueEntry | undefined {
  return getTournamentCatalogue().find((t) => t.id === id);
}

const TOURNAMENT_CATALOGUE_FIXTURE: TournamentCatalogueEntry[] = [
  {
    id: "joma-honor-a-primera",
    name: "Torneo Joma · Liga Honor A · Primera",
    shortName: "Joma Honor A",
    matches: buildJomaHonorAMatches("joma-honor-a-primera", "p"),
  },
  {
    id: "joma-honor-a-tercera",
    name: "Torneo Joma · Liga Honor A · Tercera",
    shortName: "Joma Honor A",
    matches: buildJomaHonorAMatches("joma-honor-a-tercera", "t"),
  },
  {
    id: "afa-futsal-a",
    name: "AFA Futsal · Primera A",
    shortName: "AFA Futsal",
    matches: [
      {
        id: "cm-afa-1",
        tournamentId: "afa-futsal-a",
        homeTeam: "Boca Juniors",
        awayTeam: "Racing Club",
        startsAt: "2026-03-30T19:30:00-03:00",
      },
      {
        id: "cm-afa-2",
        tournamentId: "afa-futsal-a",
        homeTeam: "San Lorenzo",
        awayTeam: "River Plate",
        startsAt: "2026-03-30T21:15:00-03:00",
      },
      {
        id: "cm-afa-3",
        tournamentId: "afa-futsal-a",
        homeTeam: "Estrella de Boedo",
        awayTeam: "Kimberley",
        startsAt: "2026-04-01T20:00:00-03:00",
      },
    ],
  },
  {
    id: "liga-nunez-cl",
    name: "Liga Núñez · Clausura",
    shortName: "Liga Núñez",
    matches: [
      {
        id: "cm-nu-1",
        tournamentId: "liga-nunez-cl",
        homeTeam: "Deportivo Núñez",
        awayTeam: "Atlético Colegiales",
        startsAt: "2026-03-30T21:00:00-03:00",
      },
      {
        id: "cm-nu-2",
        tournamentId: "liga-nunez-cl",
        homeTeam: "Universitario La Plata",
        awayTeam: "Náutico Hacoaj",
        startsAt: "2026-04-02T19:45:00-03:00",
      },
    ],
  },
  {
    id: "barrial-caba-cab",
    name: "Torneo Barrial Caballito",
    shortName: "Barrial Caballito",
    matches: [
      {
        id: "cm-ba-1",
        tournamentId: "barrial-caba-cab",
        homeTeam: "Unión Caballito",
        awayTeam: "San Lorenzo del Barrio",
        startsAt: "2026-03-31T20:15:00-03:00",
      },
      {
        id: "cm-ba-2",
        tournamentId: "barrial-caba-cab",
        homeTeam: "Parque Chacabuco",
        awayTeam: "All Boys del Sur",
        startsAt: "2026-04-02T21:30:00-03:00",
      },
    ],
  },
  {
    id: "copa-zn-f2",
    name: "Copa Zona Norte · Fase 2",
    shortName: "Copa Zona Norte",
    matches: [
      {
        id: "cm-zn-1",
        tournamentId: "copa-zn-f2",
        homeTeam: "Villa Martelli FC",
        awayTeam: "Tigre Norte",
        startsAt: "2026-04-01T18:45:00-03:00",
      },
      {
        id: "cm-zn-2",
        tournamentId: "copa-zn-f2",
        homeTeam: "Defensores de Vicente López",
        awayTeam: "Central Ballester",
        startsAt: "2026-04-03T16:00:00-03:00",
      },
    ],
  },
  {
    id: "f8-pilar",
    name: "Liga Fútbol 8 · Pilar",
    shortName: "Fútbol 8 Pilar",
    matches: [
      {
        id: "cm-f8-1",
        tournamentId: "f8-pilar",
        homeTeam: "Los Robles",
        awayTeam: "El Nacional Pilar",
        startsAt: "2026-04-01T22:00:00-03:00",
      },
    ],
  },
];
