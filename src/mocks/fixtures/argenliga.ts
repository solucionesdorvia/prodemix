import type { Match } from "@/domain";

import roundsZ1 from "./argenliga-zona-1-rounds.json";
import roundsZ2 from "./argenliga-zona-2-rounds.json";

const SLOT_MINUTES = [0, 25, 50, 75, 100, 125, 150, 175, 200];

/** Zona 1 y 2: fixture oficial (planilla Argenliga). */
function fechaStartsAt(fecha: number, slot: number, firstDayOfMonth: number): string {
  const base = new Date(2026, 3, firstDayOfMonth);
  base.setDate(base.getDate() + (fecha - 1) * 7);
  const y = base.getFullYear();
  const mo = String(base.getMonth() + 1).padStart(2, "0");
  const day = String(base.getDate()).padStart(2, "0");
  const totalMin = 18 * 60 + SLOT_MINUTES[slot]!;
  const h = Math.floor(totalMin / 60);
  const min = totalMin % 60;
  return `${y}-${mo}-${day}T${String(h).padStart(2, "0")}:${String(min).padStart(2, "0")}:00-03:00`;
}

function buildMatchesFromRounds(
  tournamentId: string,
  idPrefix: string,
  rounds: [string, string][][],
  firstDayOfMonth: number,
): Match[] {
  const out: Match[] = [];
  for (let f = 0; f < rounds.length; f++) {
    const round = rounds[f]!;
    const matchdayId = `${tournamentId}-md-${String(f + 1).padStart(2, "0")}`;
    for (let m = 0; m < round.length; m++) {
      const [home, away] = round[m]!;
      const fid = String(f + 1).padStart(2, "0");
      const mid = String(m + 1).padStart(2, "0");
      out.push({
        id: `cm-arg-${idPrefix}-f${fid}-m${mid}`,
        tournamentId,
        matchdayId,
        homeTeam: home,
        awayTeam: away,
        startsAt: fechaStartsAt(f + 1, m, firstDayOfMonth),
      });
    }
  }
  return out;
}

export function buildArgenligaZona1Matches(tournamentId: string): Match[] {
  return buildMatchesFromRounds(
    tournamentId,
    "z1",
    roundsZ1 as [string, string][][],
    7,
  );
}

export function buildArgenligaZona2Matches(tournamentId: string): Match[] {
  return buildMatchesFromRounds(
    tournamentId,
    "z2",
    roundsZ2 as [string, string][][],
    8,
  );
}
