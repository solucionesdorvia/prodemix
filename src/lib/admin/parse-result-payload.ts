import type { NextResponse } from "next/server";

import { apiError } from "@/lib/api-errors";

export type AdminResultRow = {
  matchId: string;
  homeScore: number;
  awayScore: number;
};

function isScoreInt(n: unknown): n is number {
  return typeof n === "number" && Number.isInteger(n) && n >= 0 && n <= 99;
}

/**
 * Valida el cuerpo de `POST /api/admin/results` (`results[]`).
 */
export function parseAdminResultsPayload(
  body: unknown,
):
  | { ok: true; results: AdminResultRow[] }
  | { ok: false; response: NextResponse } {
  if (typeof body !== "object" || body === null) {
    return {
      ok: false,
      response: apiError(422, "INVALID_DATA", "Body must be an object."),
    };
  }

  const raw = (body as Record<string, unknown>).results;
  if (!Array.isArray(raw) || raw.length === 0) {
    return {
      ok: false,
      response: apiError(422, "INVALID_DATA", "Expected `results` array."),
    };
  }

  const results: AdminResultRow[] = [];
  for (const row of raw) {
    if (typeof row !== "object" || row === null) {
      return {
        ok: false,
        response: apiError(422, "INVALID_DATA", "Invalid result row."),
      };
    }
    const r = row as Record<string, unknown>;
    if (typeof r.matchId !== "string" || !r.matchId) {
      return {
        ok: false,
        response: apiError(422, "INVALID_DATA", "Each result needs matchId."),
      };
    }
    if (!isScoreInt(r.homeScore) || !isScoreInt(r.awayScore)) {
      return {
        ok: false,
        response: apiError(
          422,
          "INVALID_DATA",
          "Scores must be integers 0–99.",
        ),
      };
    }
    results.push({
      matchId: r.matchId,
      homeScore: r.homeScore,
      awayScore: r.awayScore,
    });
  }

  return { ok: true, results };
}
