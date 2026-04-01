import type { MatchId } from "@/domain";

import {
  getAdminResultForMatch,
  getAllAdminResultMatchIds,
} from "@/state/admin-prode-storage";
import { loadIngestionResultsOverlay } from "@/state/ingestion-storage";

/**
 * Mock finalized scores for catalogue matches — used for MVP scoring & rankings.
 * Replace with API results later. Ingestion overlay merges on top (see /admin/mock-ingestion).
 */
export const MOCK_MATCH_RESULTS: Record<
  MatchId,
  { home: number; away: number }
> = {
  /** Primera A · fecha 1 (coincide con fixture PLP). */
  "afa-premio-a-m1-0": { home: 1, away: 2 },
  "afa-premio-a-m1-1": { home: 1, away: 4 },
  "afa-premio-a-m1-2": { home: 2, away: 1 },
  "afa-premio-a-m1-3": { home: 4, away: 3 },
  "afa-premio-a-m1-4": { home: 2, away: 4 },
  "afa-premio-a-m1-5": { home: 3, away: 3 },
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
