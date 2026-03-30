import type { Match } from "@/domain";

import { normalizeSearchKey } from "@/lib/string-normalize";

export type MatchDatePreset = "all" | "today" | "week";

export function matchPassesTeamQuery(m: Match, q: string): boolean {
  if (!q.trim()) return true;
  const n = normalizeSearchKey(q);
  return (
    normalizeSearchKey(m.homeTeam).includes(n) ||
    normalizeSearchKey(m.awayTeam).includes(n)
  );
}

export function matchPassesDatePreset(
  m: Match,
  preset: MatchDatePreset,
): boolean {
  if (preset === "all") return true;
  if (preset === "today") {
    const ref = new Date();
    const d = new Date(m.startsAt);
    return (
      d.getFullYear() === ref.getFullYear() &&
      d.getMonth() === ref.getMonth() &&
      d.getDate() === ref.getDate()
    );
  }
  const start = new Date(m.startsAt).getTime();
  const now = Date.now();
  const weekEnd = now + 7 * 86400000;
  return start >= now && start <= weekEnd;
}
