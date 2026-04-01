import type { Match, TournamentCatalogueEntry } from "@/domain";
import type { Matchday } from "@/domain/matchday";

import { loadAdminProdeStorage } from "@/state/admin-prode-storage";
import type { AdminProdeRecord } from "@/state/admin-prode-types";

function matchdayForRecord(r: AdminProdeRecord): Matchday {
  const mdId = `admin-md-${r.id}`;
  const firstKick = r.matches[0]?.startsAt ?? r.deadlineAt;
  const status =
    r.status === "finalized" ? "completed"
    : r.status === "closed" ? "closed"
    : "open";
  return {
    id: mdId,
    tournamentId: r.syntheticTournamentId,
    name: r.fechaLabel,
    roundNumber: 1,
    startsAt: firstKick,
    closesAt: r.deadlineAt,
    status,
  };
}

function recordToCatalogueEntry(r: AdminProdeRecord): TournamentCatalogueEntry {
  const md = matchdayForRecord(r);
  const matches: Match[] = r.matches.map((m) => ({
    id: m.id,
    tournamentId: r.syntheticTournamentId,
    matchdayId: md.id,
    homeTeam: m.homeTeam,
    awayTeam: m.awayTeam,
    startsAt: m.startsAt,
    tournamentLabel: `AFA ${r.afaBand} · ${r.fechaLabel} · ${r.tier}`,
  }));
  return {
    id: r.syntheticTournamentId,
    name: `AFA ${r.afaBand} — ${r.name}`,
    shortName: `AFA ${r.afaBand}`,
    division: "primera",
    matchdays: [md],
    matches,
  };
}

/** Antepone torneos sintéticos definidos en el panel admin al catálogo. */
export function mergeAdminProdeCatalogue(
  entries: TournamentCatalogueEntry[],
): TournamentCatalogueEntry[] {
  const { prodes } = loadAdminProdeStorage();
  const extra = prodes.map(recordToCatalogueEntry);
  return [...extra, ...entries];
}
