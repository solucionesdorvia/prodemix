/**
 * UI / API DTOs that compose entities or add presentation-only fields.
 * Keep separate from core entities to ease mapping when backend ships.
 */

import type { Match } from "./match";

/** Home dashboard quick stats */
export interface HomeStatsSnapshot {
  weekPoints: number;
  exactScores: number;
  weekRank: number;
  pendingMarkers: number;
}

/** Profile screen */
export interface ProfileSnapshot {
  displayName: string;
  handle: string;
  totalPoints: number;
  exactHitsTotal: number;
  activeProdes: number;
  followedTournaments: { id: string; shortName: string }[];
}

export type ActivityKind =
  | "prediction"
  | "prode"
  | "ranking"
  | "follow"
  | "points";

export interface ActivityEntry {
  id: string;
  title: string;
  detail: string;
  timeLabel: string;
  kind: ActivityKind;
}

/** Torneos browse / marketing cards */
export type TorneoCategoryFilterId =
  | "todos"
  | "futsal"
  | "futbol-8"
  | "amateur"
  | "barrial"
  | "club-local";

export interface TorneoBrowseItem {
  id: string;
  name: string;
  subtitle: string;
  categoryId: Exclude<TorneoCategoryFilterId, "todos">;
  categoryLabel: string;
  region: string;
  statusLabel: string;
  phaseLabel: string;
  teamsCount: number;
  featured: boolean;
}

/** Crear prode: tournament block with embedded matches from catalogue */
export interface TournamentCatalogueEntry {
  id: string;
  name: string;
  shortName: string;
  matches: Match[];
}

/** Tournament detail page (browse + fixture + table preview). */
export interface TournamentMatchRow {
  id: string;
  homeTeam: string;
  awayTeam: string;
  startsAt: string;
}

export interface TournamentResultRow {
  id: string;
  homeTeam: string;
  awayTeam: string;
  homeGoals: number;
  awayGoals: number;
}

export interface TournamentStandingRow {
  rank: number;
  team: string;
  pj: number;
  pts: number;
}

export interface TournamentDetailStats {
  totalMatches: number;
  playedMatches: number;
  upcomingMatches: number;
}

export interface TournamentActivityNote {
  id: string;
  title: string;
  detail: string;
  timeLabel: string;
}

/**
 * Composes browse metadata with mock fixture/table copy for the detail screen.
 */
export interface TournamentDetailView {
  browse: TorneoBrowseItem;
  /** Usually same as `browse.phaseLabel` — current round / fecha. */
  jornadaLabel: string;
  stats: TournamentDetailStats;
  nextMatches: TournamentMatchRow[];
  recentResults: TournamentResultRow[];
  standingsPreview: TournamentStandingRow[];
  featuredTeams: string[];
  activityNotes: TournamentActivityNote[];
}
