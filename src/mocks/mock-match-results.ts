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
  /** Joma Honor A · fecha 1 (AFA Premio queda sin resultado hasta el partido). */
  "cm-joma-p-f01-m01": { home: 2, away: 1 },
  "cm-joma-p-f01-m02": { home: 1, away: 1 },
  "cm-joma-p-f01-m03": { home: 0, away: 2 },
  "cm-joma-p-f01-m04": { home: 3, away: 2 },
  "cm-joma-p-f01-m05": { home: 1, away: 0 },
  "cm-joma-p-f01-m06": { home: 2, away: 2 },
  "cm-joma-p-f01-m07": { home: 1, away: 3 },
  "cm-joma-p-f01-m08": { home: 2, away: 0 },
  "cm-joma-p-f01-m09": { home: 0, away: 3 },
  "cm-joma-p-f01-m10": { home: 4, away: 4 },
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
