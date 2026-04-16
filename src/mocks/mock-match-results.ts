import type { MatchId } from "@/domain";

import {
  getAdminResultForMatch,
  getAllAdminResultMatchIds,
} from "@/state/admin-prode-storage";
import { loadIngestionResultsOverlay } from "@/state/ingestion-storage";

/**
 * Marcadores del catálogo (MVP). En **modo legacy** (sin sesión) se usan para puntos en cliente.
 * Con **sesión**, el ranking y el admin leen `Match` en Prisma: hay que aplicar estos valores
 * con `POST /api/admin/sync-catalog-results` o volver a correr `npx prisma db seed`.
 * Ingestion overlay y resultados admin en localStorage se fusionan en `getMockResultForMatch`.
 */
export const MOCK_MATCH_RESULTS: Partial<
  Record<MatchId, { home: number; away: number }>
> = {
  /**
   * Primera A · fecha 4 — jugados (Kimberley–Barracas, Pinocho–17 de Agosto, Independiente–Boca
   * postergados en el fixture; sin resultado en catálogo).
   */
  "afa-premio-a-m4-0": { home: 5, away: 2 },
  "afa-premio-a-m4-2": { home: 2, away: 3 },
  "afa-premio-a-m4-3": { home: 3, away: 1 },
  "afa-premio-a-m4-4": { home: 2, away: 10 },
  "afa-premio-a-m4-6": { home: 1, away: 4 },
  "afa-premio-a-m4-7": { home: 1, away: 1 },

  /** Primera B · fecha 4 — todos los partidos. */
  "afa-premio-b-m4-0": { home: 2, away: 0 },
  "afa-premio-b-m4-1": { home: 5, away: 1 },
  "afa-premio-b-m4-2": { home: 2, away: 1 },
  "afa-premio-b-m4-3": { home: 3, away: 4 },
  "afa-premio-b-m4-4": { home: 4, away: 3 },
  "afa-premio-b-m4-5": { home: 8, away: 4 },
  "afa-premio-b-m4-6": { home: 1, away: 3 },
  "afa-premio-b-m4-7": { home: 6, away: 3 },
  "afa-premio-b-m4-8": { home: 5, away: 3 },

  /**
   * Primera C — marcadores alineados a la captura (tercera fecha de la competencia en cancha).
   * En el JSON de fixture corresponden a **fecha 20** (`afa-premio-c-m20-*`), orden local vs visitante.
   */
  "afa-premio-c-m20-0": { home: 0, away: 4 },
  "afa-premio-c-m20-1": { home: 2, away: 5 },
  "afa-premio-c-m20-2": { home: 3, away: 2 },
  "afa-premio-c-m20-3": { home: 3, away: 3 },
  "afa-premio-c-m20-4": { home: 1, away: 4 },
  "afa-premio-c-m20-5": { home: 3, away: 4 },
  "afa-premio-c-m20-6": { home: 1, away: 2 },
  "afa-premio-c-m20-7": { home: 2, away: 4 },
  "afa-premio-c-m20-8": { home: 5, away: 1 },
};

export function getMockResultForMatch(
  matchId: string,
): { home: number; away: number } | undefined {
  if (typeof window !== "undefined") {
    const overlay = loadIngestionResultsOverlay();
    const ing = overlay[matchId];
    if (ing) return ing;
    const admin = getAdminResultForMatch(matchId);
    if (admin) return admin;
  }
  return MOCK_MATCH_RESULTS[matchId];
}

export function getAllScoredMatchIds(): string[] {
  const base = Object.keys(MOCK_MATCH_RESULTS);
  if (typeof window === "undefined") return base;
  const overlay = loadIngestionResultsOverlay();
  return [
    ...new Set([
      ...base,
      ...Object.keys(overlay),
      ...getAllAdminResultMatchIds(),
    ]),
  ];
}
