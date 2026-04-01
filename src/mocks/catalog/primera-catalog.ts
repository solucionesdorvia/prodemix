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
];

export const PRIMERA_PUBLIC_POOLS: PublicPool[] =
  PRIMERA_TOURNAMENT_CATALOGUE.flatMap((t) =>
    buildPublicPoolsForMatchdays(t.id, t.matchdays),
  );

function categoryForTournament(): {
  categoryId: Exclude<TorneoCategoryFilterId, "todos">;
  categoryLabel: string;
} {
  return { categoryId: "futsal", categoryLabel: "Futsal" };
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
  const { categoryId, categoryLabel } = categoryForTournament();
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
      : "Futsal",
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
