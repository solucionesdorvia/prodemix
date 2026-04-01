import type { Match, Matchday, MatchdayStatus } from "@/domain";

import { getMockResultForMatch } from "@/mocks/mock-match-results";

/**
 * Build fecha rows from matches that carry `matchdayId` (sorted by round number).
 */
export function deriveMatchdaysFromMatches(
  tournamentId: string,
  matches: Match[],
): Matchday[] {
  const map = new Map<string, Match[]>();
  for (const m of matches) {
    if (!m.matchdayId) continue;
    if (!map.has(m.matchdayId)) map.set(m.matchdayId, []);
    map.get(m.matchdayId)!.push(m);
  }
  const ids = [...map.keys()].sort((a, b) => {
    const na = parseInt(a.split("-md-").pop() ?? "0", 10);
    const nb = parseInt(b.split("-md-").pop() ?? "0", 10);
    return na - nb;
  });
  const now = Date.now();
  return ids.map((mdId) => {
    const ms = map.get(mdId)!;
    const sorted = [...ms].sort((x, y) =>
      x.startsAt.localeCompare(y.startsAt),
    );
    const first = sorted[0]!;
    const roundNum = parseInt(mdId.split("-md-").pop() ?? "1", 10);
    const closes = new Date(first.startsAt);
    closes.setHours(closes.getHours() - 1);
    const kick = new Date(first.startsAt).getTime();
    const allFinished = sorted.every((x) => !!getMockResultForMatch(x.id));
    const anyStarted = kick <= now;
    let status: MatchdayStatus = "open";
    if (allFinished) status = "completed";
    else if (anyStarted) status = "closed";
    return {
      id: mdId,
      tournamentId,
      name: `Fecha ${roundNum}`,
      roundNumber: roundNum,
      startsAt: first.startsAt,
      closesAt: closes.toISOString(),
      status,
    };
  });
}
