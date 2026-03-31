import type { Match } from "@/domain";

import rounds from "./joma-honor-a-apertura-rounds.json";

/** Kickoff spacing within each fecha (from 18:00 ART). */
const SLOT_MINUTES = [0, 25, 50, 75, 100, 125, 150, 175, 200];

/** Primera fecha base: 30 mar 2026 (documento fixture); una fecha por semana. */
function fechaStartsAt(fecha: number, slot: number): string {
  const base = new Date(2026, 2, 30);
  base.setDate(base.getDate() + (fecha - 1) * 7);
  const y = base.getFullYear();
  const mo = String(base.getMonth() + 1).padStart(2, "0");
  const day = String(base.getDate()).padStart(2, "0");
  const totalMin = 18 * 60 + SLOT_MINUTES[slot]!;
  const h = Math.floor(totalMin / 60);
  const min = totalMin % 60;
  return `${y}-${mo}-${day}T${String(h).padStart(2, "0")}:${String(min).padStart(2, "0")}:00-03:00`;
}

/** Fixture Liga Honor A (Apertura) — Primera. */
export function buildJomaHonorAMatches(tournamentId: string): Match[] {
  const prefix = "cm-joma-p";
  const out: Match[] = [];
  const data = rounds as [string, string][][];
  for (let f = 0; f < data.length; f++) {
    const round = data[f]!;
    const matchdayId = `${tournamentId}-md-${String(f + 1).padStart(2, "0")}`;
    for (let m = 0; m < round.length; m++) {
      const [home, away] = round[m]!;
      const fid = String(f + 1).padStart(2, "0");
      const mid = String(m + 1).padStart(2, "0");
      out.push({
        id: `${prefix}-f${fid}-m${mid}`,
        tournamentId,
        matchdayId,
        homeTeam: home,
        awayTeam: away,
        startsAt: fechaStartsAt(f + 1, m),
      });
    }
  }
  return out;
}
