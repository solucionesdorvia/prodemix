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
  "cm-nu-1": { home: 3, away: 2 },
  "cm-nu-2": { home: 1, away: 0 },
  "cm-ba-1": { home: 2, away: 2 },
  "cm-ba-2": { home: 1, away: 3 },
  "cm-zn-1": { home: 2, away: 0 },
  "cm-zn-2": { home: 1, away: 1 },
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
