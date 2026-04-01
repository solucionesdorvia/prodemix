/**
 * Prodes gestionados desde el panel admin (localStorage).
 * No requiere deploy para crear fixture, resultados y estado.
 */

export type AdminAfaBand = "A" | "B" | "C";

export type AdminProdeTier = "gratis" | "elite";

export type AdminProdeStatus = "open" | "closed" | "finalized";

export interface AdminProdeMatch {
  id: string;
  homeTeam: string;
  awayTeam: string;
  /** ISO 8601 */
  startsAt: string;
}

export interface AdminProdeRecord {
  id: string;
  name: string;
  createdAt: string;
  /** Mismo id que va en StoredProde.tournamentIds[0] */
  syntheticTournamentId: string;
  afaBand: AdminAfaBand;
  fechaLabel: string;
  tier: AdminProdeTier;
  /** Cierre de pronósticos (ISO 8601) */
  deadlineAt: string;
  status: AdminProdeStatus;
  matches: AdminProdeMatch[];
  /** Resultados finales por match id */
  results: Record<string, { home: number; away: number }>;
}

export interface AdminProdeStorage {
  prodes: AdminProdeRecord[];
}
