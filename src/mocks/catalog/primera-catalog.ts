import type {
  Match,
  PublicPool,
  TorneoBrowseItem,
  TorneoCategoryFilterId,
  TournamentCatalogueEntry,
} from "@/domain";

import { buildArgenligaZona1Matches, buildArgenligaZona2Matches } from "@/mocks/fixtures/argenliga";
import { buildJomaHonorAMatches } from "@/mocks/fixtures/joma-honor-a-apertura";
import { buildPlaPremioMatches } from "@/mocks/fixtures/plp-afa-premio";

import { deriveMatchdaysFromMatches } from "./matchdays";
import { buildPublicPoolsForMatchdays } from "./public-pools";

function labelMatches(matches: Match[], tournamentLabel: string): Match[] {
  return matches.map((m) => ({ ...m, tournamentLabel }));
}

function entry(
  e: Omit<TournamentCatalogueEntry, "division" | "matchdays"> & {
    matches: Match[];
  },
): TournamentCatalogueEntry {
  const matchdays = deriveMatchdaysFromMatches(e.id, e.matches);
  return {
    ...e,
    division: "primera",
    matchdays,
    matches: e.matches,
  };
}

const AFA_PREMIO_A = "afa-premio-a";
const AFA_PREMIO_B = "afa-premio-b";
const AFA_PREMIO_C = "afa-premio-c";

function ligaNunezMatches(): Match[] {
  const tid = "liga-nunez-cl";
  const md1 = `${tid}-md-01`;
  return [
    {
      id: "cm-nu-1",
      tournamentId: tid,
      matchdayId: md1,
      homeTeam: "Deportivo Núñez",
      awayTeam: "Atlético Colegiales",
      startsAt: "2026-03-30T21:00:00-03:00",
    },
    {
      id: "cm-nu-2",
      tournamentId: tid,
      matchdayId: md1,
      homeTeam: "Universitario La Plata",
      awayTeam: "Náutico Hacoaj",
      startsAt: "2026-04-02T19:45:00-03:00",
    },
  ];
}

function barrialMatches(): Match[] {
  const tid = "barrial-caba-cab";
  const md = `${tid}-md-01`;
  return [
    {
      id: "cm-ba-1",
      tournamentId: tid,
      matchdayId: md,
      homeTeam: "Unión Caballito",
      awayTeam: "San Lorenzo del Barrio",
      startsAt: "2026-03-31T20:15:00-03:00",
    },
    {
      id: "cm-ba-2",
      tournamentId: tid,
      matchdayId: md,
      homeTeam: "Parque Chacabuco",
      awayTeam: "All Boys del Sur",
      startsAt: "2026-04-02T21:30:00-03:00",
    },
  ];
}

function copaZnMatches(): Match[] {
  const tid = "copa-zn-primera";
  const md = `${tid}-md-01`;
  return [
    {
      id: "cm-zn-1",
      tournamentId: tid,
      matchdayId: md,
      homeTeam: "Villa Martelli FC",
      awayTeam: "Tigre Norte",
      startsAt: "2026-04-01T18:45:00-03:00",
    },
    {
      id: "cm-zn-2",
      tournamentId: tid,
      matchdayId: md,
      homeTeam: "Defensores de Vicente López",
      awayTeam: "Central Ballester",
      startsAt: "2026-04-03T16:00:00-03:00",
    },
  ];
}

const JOMA_ID = "joma-honor-a-primera";
const ARG1 = "argenliga-zona-1";
const ARG2 = "argenliga-zona-2";

export const PRIMERA_TOURNAMENT_CATALOGUE: TournamentCatalogueEntry[] = [
  entry({
    id: AFA_PREMIO_A,
    name: "AFA Futsal · Primera A · Premio",
    shortName: "Premio · A",
    matches: labelMatches(
      buildPlaPremioMatches("a", AFA_PREMIO_A),
      "AFA Futsal · Primera A · Premio",
    ),
  }),
  entry({
    id: AFA_PREMIO_B,
    name: "AFA Futsal · Primera B · Premio",
    shortName: "Premio · B",
    matches: labelMatches(
      buildPlaPremioMatches("b", AFA_PREMIO_B),
      "AFA Futsal · Primera B · Premio",
    ),
  }),
  entry({
    id: AFA_PREMIO_C,
    name: "AFA Futsal · Primera C · Premio",
    shortName: "Premio · C",
    matches: labelMatches(
      buildPlaPremioMatches("c", AFA_PREMIO_C),
      "AFA Futsal · Primera C · Premio",
    ),
  }),
  entry({
    id: JOMA_ID,
    name: "Torneo Joma · Liga Honor A · Primera",
    shortName: "Joma Honor A",
    matches: labelMatches(
      buildJomaHonorAMatches(JOMA_ID),
      "Torneo Joma · Liga Honor A · Primera",
    ),
  }),
  entry({
    id: ARG1,
    name: "Argenliga · Zona 1 · Primera",
    shortName: "Argenliga Z1",
    matches: labelMatches(
      buildArgenligaZona1Matches(ARG1),
      "Argenliga · Zona 1",
    ),
  }),
  entry({
    id: ARG2,
    name: "Argenliga · Zona 2 · Primera",
    shortName: "Argenliga Z2",
    matches: labelMatches(
      buildArgenligaZona2Matches(ARG2),
      "Argenliga · Zona 2",
    ),
  }),
  entry({
    id: "liga-nunez-cl",
    name: "Liga Núñez · Primera",
    shortName: "Liga Núñez",
    matches: labelMatches(ligaNunezMatches(), "Liga Núñez · Primera"),
  }),
  entry({
    id: "barrial-caba-cab",
    name: "Torneo Barrial Caballito · Primera",
    shortName: "Barrial Caballito",
    matches: labelMatches(barrialMatches(), "Torneo Barrial Caballito · Primera"),
  }),
  entry({
    id: "copa-zn-primera",
    name: "Copa Zona Norte · Primera",
    shortName: "Copa Zona Norte",
    matches: labelMatches(copaZnMatches(), "Copa Zona Norte · Primera"),
  }),
];

export const PRIMERA_PUBLIC_POOLS: PublicPool[] =
  PRIMERA_TOURNAMENT_CATALOGUE.flatMap((t) =>
    buildPublicPoolsForMatchdays(t.id, t.matchdays),
  );

function categoryForTournament(
  id: string,
): { categoryId: Exclude<TorneoCategoryFilterId, "todos">; categoryLabel: string } {
  if (id === JOMA_ID || id.startsWith("argenliga-") || id.startsWith("afa-premio-")) {
    return { categoryId: "futsal", categoryLabel: "Futsal" };
  }
  if (id === "liga-nunez-cl") {
    return { categoryId: "club-local", categoryLabel: "Clubes" };
  }
  if (id === "barrial-caba-cab") {
    return { categoryId: "barrial", categoryLabel: "Barrial" };
  }
  return { categoryId: "amateur", categoryLabel: "Amateur" };
}

function uniqueTeams(matches: Match[]): number {
  const s = new Set<string>();
  for (const m of matches) {
    s.add(m.homeTeam);
    s.add(m.awayTeam);
  }
  return s.size;
}

function browseItemFromEntry(t: TournamentCatalogueEntry): TorneoBrowseItem {
  const { categoryId, categoryLabel } = categoryForTournament(t.id);
  const open =
    t.matchdays.find((m) => m.status === "open") ?? t.matchdays[0];
  const currentLabel = open?.name ?? "Fecha";
  const played = t.matches.filter((m) => m.matchdayId === open?.id).length;
  const premio = t.id.startsWith("afa-premio-");
  return {
    id: t.id,
    name: t.name,
    subtitle: premio
      ? `Primera · ${currentLabel} · Premio en efectivo`
      : `Primera · ${currentLabel}`,
    categoryId,
    categoryLabel,
    region:
      premio ? "AFA · Nacional"
      : t.id === JOMA_ID ? "AFA · Liga Honor"
      : t.id.startsWith("argenliga-") ? "AMBA · Argenliga"
      : t.id === "liga-nunez-cl" ? "CABA · Núñez"
      : t.id === "barrial-caba-cab" ? "CABA · Caballito"
      : "GBA · Zona Norte",
    statusLabel: "En curso",
    phaseLabel: `${currentLabel} · ${played} partidos`,
    teamsCount: uniqueTeams(t.matches),
    featured: premio,
    promoBadge: premio ? "Premio" : undefined,
  };
}

/** Browse cards — solo Primera. */
export const PRIMERA_BROWSE_ITEMS: TorneoBrowseItem[] =
  PRIMERA_TOURNAMENT_CATALOGUE.map(browseItemFromEntry);

export function getPublicPoolById(id: string): PublicPool | undefined {
  return PRIMERA_PUBLIC_POOLS.find((p) => p.id === id);
}

export function getPublicPoolsForTournament(
  tournamentId: string,
): PublicPool[] {
  return PRIMERA_PUBLIC_POOLS.filter((p) => p.tournamentId === tournamentId);
}

export function getPublicPoolForMatchday(
  tournamentId: string,
  matchdayId: string,
): PublicPool | undefined {
  return PRIMERA_PUBLIC_POOLS.find(
    (p) => p.tournamentId === tournamentId && p.matchdayId === matchdayId,
  );
}

export function getMatchIdsForMatchday(
  tournamentId: string,
  matchdayId: string,
): string[] {
  const t = PRIMERA_TOURNAMENT_CATALOGUE.find((x) => x.id === tournamentId);
  if (!t) return [];
  return t.matches
    .filter((m) => m.matchdayId === matchdayId)
    .map((m) => m.id);
}

/** Human-readable label for selects and headers (tournament short name + fecha name). */
export function formatPublicPoolLabel(pool: PublicPool): string {
  const t = PRIMERA_TOURNAMENT_CATALOGUE.find((x) => x.id === pool.tournamentId);
  const md = t?.matchdays.find((m) => m.id === pool.matchdayId);
  const tName = t?.shortName ?? pool.tournamentId;
  const fecha = md?.name ?? "Fecha";
  return `${tName} · ${fecha}`;
}
