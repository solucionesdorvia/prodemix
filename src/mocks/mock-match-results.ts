import type { MatchId } from "@/domain";

import {
  getAdminResultForMatch,
  getAllAdminResultMatchIds,
} from "@/state/admin-prode-storage";
import { loadIngestionResultsOverlay } from "@/state/ingestion-storage";

/**
 * Mock finalized scores for catalogue matches — used for MVP scoring & rankings.
 * AFA Premio: carga manual / API. Ingestion overlay merges on top (see /admin/mock-ingestion).
 */
export const MOCK_MATCH_RESULTS: Partial<
  Record<MatchId, { home: number; away: number }>
> = {
  /** Primera A · fecha 3 — resultados cargados a mano (partidos jugados). */
  "afa-premio-a-m3-0": { home: 6, away: 1 },
  "afa-premio-a-m3-1": { home: 2, away: 5 },
  "afa-premio-a-m3-2": { home: 3, away: 2 },
  "afa-premio-a-m3-3": { home: 0, away: 1 },
  "afa-premio-a-m3-4": { home: 3, away: 2 },
  "afa-premio-a-m3-5": { home: 2, away: 5 },
  "afa-premio-a-m3-6": { home: 3, away: 1 },

  /** Primera B · fecha 3 — resultados cargados a mano. */
  "afa-premio-b-m3-0": { home: 4, away: 5 },
  "afa-premio-b-m3-1": { home: 1, away: 5 },
  "afa-premio-b-m3-2": { home: 2, away: 0 },
  "afa-premio-b-m3-3": { home: 7, away: 2 },

  /** Primera C · fecha 2 — resultados cargados a mano. */
  "afa-premio-c-m2-0": { home: 1, away: 1 },
  "afa-premio-c-m2-1": { home: 3, away: 5 },
  "afa-premio-c-m2-2": { home: 0, away: 6 },
  "afa-premio-c-m2-3": { home: 5, away: 2 },
  "afa-premio-c-m2-4": { home: 1, away: 3 },
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
