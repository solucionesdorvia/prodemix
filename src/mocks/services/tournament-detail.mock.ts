import type {
  TorneoBrowseItem,
  TournamentActivityNote,
  TournamentDetailView,
  TournamentMatchRow,
  TournamentResultRow,
  TournamentStandingRow,
} from "@/domain";

import { getMockResultForMatch } from "@/mocks/mock-match-results";
import {
  getTorneoBrowseItems,
} from "@/mocks/services/torneos-browse.mock";
import {
  getPublicPoolForMatchday,
} from "@/mocks/catalog/primera-catalog";
import {
  getTournamentCatalogueEntryById,
} from "@/mocks/services/tournaments-catalogue.mock";

function hash(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
  return h;
}

function uniqueTeamsFromRows(
  rows: { homeTeam: string; awayTeam: string }[],
): string[] {
  const set = new Set<string>();
  for (const r of rows) {
    set.add(r.homeTeam);
    set.add(r.awayTeam);
  }
  return [...set].sort((a, b) => a.localeCompare(b, "es"));
}

function buildStandingsFromTeams(teams: string[]): TournamentStandingRow[] {
  const base = [32, 29, 27, 24, 22, 20, 18, 16];
  return teams.slice(0, 8).map((team, i) => ({
    rank: i + 1,
    team,
    pj: 6 + (i % 3),
    pts: base[i] ?? 15 - i,
  }));
}

function activityForCatalogue(id: string): TournamentActivityNote[] {
  const notes: Record<string, TournamentActivityNote[]> = {
    "joma-honor-a-primera": [
      {
        id: "a1",
        title: "Liga Honor A · Primera",
        detail: "Fixture Apertura 2026 cargado en ProdeMix.",
        timeLabel: "Hoy",
      },
    ],
    "argenliga-zona-1": [
      {
        id: "a1",
        title: "Argenliga Zona 1",
        detail: "Fixture según planilla oficial (16 equipos).",
        timeLabel: "Hoy",
      },
    ],
    "argenliga-zona-2": [
      {
        id: "a1",
        title: "Argenliga Zona 2",
        detail: "Fixture oficial · 15 fechas · 16 equipos.",
        timeLabel: "Hoy",
      },
    ],
    "afa-premio-a": [
      {
        id: "a1",
        title: "Pozo · Primera A",
        detail: "Pool público con premio en efectivo por fecha.",
        timeLabel: "Hoy",
      },
    ],
    "afa-premio-b": [
      {
        id: "a1",
        title: "Pozo · Primera B",
        detail: "Fixture 34 fechas · pozo por jornada.",
        timeLabel: "Hoy",
      },
    ],
    "afa-premio-c": [
      {
        id: "a1",
        title: "Pozo · Primera C",
        detail: "Competencia nacional · premio por fecha.",
        timeLabel: "Hoy",
      },
    ],
  };
  return notes[id] ?? [
    {
      id: "a1",
      title: "Novedades del torneo",
      detail: "Seguí el fixture desde ProdeMix.",
      timeLabel: "Hoy",
    },
  ];
}

function buildFromCatalogue(browse: TorneoBrowseItem): TournamentDetailView {
  const cat = getTournamentCatalogueEntryById(browse.id)!;
  const next: TournamentMatchRow[] = [];
  const recent: TournamentResultRow[] = [];

  for (const m of cat.matches) {
    const res = getMockResultForMatch(m.id);
    if (res) {
      recent.push({
        id: m.id,
        homeTeam: m.homeTeam,
        awayTeam: m.awayTeam,
        homeGoals: res.home,
        awayGoals: res.away,
      });
    } else {
      next.push({
        id: m.id,
        homeTeam: m.homeTeam,
        awayTeam: m.awayTeam,
        startsAt: m.startsAt,
      });
    }
  }

  next.sort((a, b) => a.startsAt.localeCompare(b.startsAt));

  const allRows = [...cat.matches.map((m) => ({
    homeTeam: m.homeTeam,
    awayTeam: m.awayTeam,
  }))];
  const teams = uniqueTeamsFromRows(allRows);
  const featured = teams.slice(0, 4);
  const standings = buildStandingsFromTeams(teams);

  const total = cat.matches.length;
  const played = recent.length;
  const upcoming = next.length;

  const openMd =
    cat.matchdays.find((d) => d.status === "open") ?? cat.matchdays[0] ?? null;
  const featuredPool =
    openMd ?
      getPublicPoolForMatchday(cat.id, openMd.id) ?? null
    : null;

  return {
    browse,
    jornadaLabel: openMd?.name ?? browse.phaseLabel,
    matchdays: cat.matchdays,
    featuredPublicPool: featuredPool,
    stats: {
      totalMatches: total,
      playedMatches: played,
      upcomingMatches: upcoming,
    },
    nextMatches: next,
    recentResults: recent,
    standingsPreview: standings,
    featuredTeams: featured,
    activityNotes: activityForCatalogue(browse.id),
  };
}

const SYNTH_TEAMS = [
  "Deportivo Norte",
  "Sportivo Sur",
  "Atlético Central",
  "Unión Oeste",
  "Racing del Barrio",
  "San Martín FC",
  "Los Andes",
  "Kimberley Sur",
];

function syntheticTeam(id: string, index: number): string {
  const h = hash(`${id}-${index}`);
  return SYNTH_TEAMS[h % SYNTH_TEAMS.length]!;
}

function buildSynthetic(browse: TorneoBrowseItem): TournamentDetailView {
  const h = hash(browse.id);
  const total = browse.teamsCount > 0 ? Math.min(Math.max(8, browse.teamsCount + 4), 24) : 10;
  const played = Math.min(Math.floor(total * 0.42) + (h % 3), total - 1);
  const upcoming = Math.max(1, total - played);

  const next: TournamentMatchRow[] = [];
  const recent: TournamentResultRow[] = [];

  for (let i = 0; i < 2; i++) {
    const day = 30 + i + (h % 5);
    next.push({
      id: `syn-n-${browse.id}-${i}`,
      homeTeam: syntheticTeam(browse.id, i * 2),
      awayTeam: syntheticTeam(browse.id, i * 2 + 1),
      startsAt: `2026-04-${String(day).padStart(2, "0")}T${18 + i}:00:00-03:00`,
    });
  }

  for (let i = 0; i < 2; i++) {
    const hg = (h + i * 3) % 4;
    const ag = (h + i * 2) % 3;
    recent.push({
      id: `syn-r-${browse.id}-${i}`,
      homeTeam: syntheticTeam(browse.id, 10 + i),
      awayTeam: syntheticTeam(browse.id, 11 + i),
      homeGoals: hg,
      awayGoals: ag,
    });
  }

  const teams = [
    syntheticTeam(browse.id, 20),
    syntheticTeam(browse.id, 21),
    syntheticTeam(browse.id, 22),
    syntheticTeam(browse.id, 23),
    syntheticTeam(browse.id, 24),
  ];

  return {
    browse,
    jornadaLabel: browse.phaseLabel,
    matchdays: [],
    featuredPublicPool: null,
    stats: {
      totalMatches: total,
      playedMatches: played,
      upcomingMatches: upcoming,
    },
    nextMatches: next,
    recentResults: recent,
    standingsPreview: buildStandingsFromTeams(teams),
    featuredTeams: teams.slice(0, 4),
    activityNotes: [
      {
        id: "syn-a1",
        title: "Fixture regional",
        detail: `${browse.region} · ${browse.subtitle}`,
        timeLabel: "Reciente",
      },
      {
        id: "syn-a2",
        title: "Seguí el torneo",
        detail: "Sumalo a un prode y cargá marcadores.",
        timeLabel: "Hoy",
      },
    ],
  };
}

export function getTournamentDetailById(
  id: string,
): TournamentDetailView | null {
  const browse = getTorneoBrowseItems().find((t) => t.id === id);
  if (!browse) return null;
  const catalogue = getTournamentCatalogueEntryById(id);
  if (catalogue) return buildFromCatalogue(browse);
  return buildSynthetic(browse);
}
