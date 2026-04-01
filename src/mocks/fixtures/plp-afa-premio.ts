import type { Match } from "@/domain";

import { getNextSaturday14BuenosAires } from "@/lib/next-saturday-ar";

import plpA from "@/data/plp-primera-a-fixture-2026.json";
import plpB from "@/data/plp-primera-b-fixture-2026.json";
import plpC from "@/data/plp-primera-c-fixture-2026.json";

type PlpRound = {
  fecha: number;
  matches: {
    homeTeam: string;
    awayTeam: string;
  }[];
};

type PlpFile = { rounds: PlpRound[] };

/** PLP (tabla) → nombre canónico en app (`afa-futsal-teams`). */
const MAP_A: Record<string, string> = {
  "America del Sud": "América del Sud",
  "Barracas Ctral": "Barracas Central",
  Boca: "Boca Juniors",
  "Est Porteño": "Estudiantes Porteño",
  Ferro: "Ferro Carril Oeste",
  "J. Newbery": "Jorge Newbery",
  Newells: "Newell's",
  Racing: "Racing Club",
  River: "River Plate",
  "San Lorenzo": "San Lorenzo",
};

const MAP_B: Record<string, string> = {
  "Argentinos Jrs": "Argentinos Juniors",
  "Gimnasia LP.": "Gimnasia LP",
  Metalurgico: "Metalúrgico",
  "Nva. Chicago": "Nueva Chicago",
  Pacifico: "Pacífico",
  "Velez Sarsfield": "Vélez Sarsfield",
};

const MAP_C: Record<string, string> = {
  "Dep Merlo": "Deportivo Merlo",
  "Dep Moron": "Deportivo Morón",
  "Juv Tapiales": "Juventud Tapiales",
};

function mapTeam(
  plp: string,
  map: Record<string, string>,
): string {
  const t = plp.trim();
  if (map[t]) return map[t];
  if (t.endsWith("LP.")) return "Gimnasia LP";
  return t;
}

function plpDoc(division: "a" | "b" | "c"): PlpFile {
  const d =
    division === "a" ? plpA
    : division === "b" ? plpB
    : plpC;
  return d as PlpFile;
}

function mapFor(division: "a" | "b" | "c"): Record<string, string> {
  if (division === "a") return MAP_A;
  if (division === "b") return MAP_B;
  return MAP_C;
}

/**
 * Fecha 1 arranca el próximo sábado 14:00 AR; cada fecha siguiente +7 días; 35 min entre partidos.
 * (Cuando haya scrapeo oficial, las fechas/horas vendrán del feed.)
 */
function startsAtIso(
  fecha: number,
  slot: number,
  fecha1FirstKickMs: number,
): string {
  const ms =
    fecha1FirstKickMs +
    (fecha - 1) * 7 * 24 * 60 * 60 * 1000 +
    slot * 35 * 60 * 1000;
  return new Date(ms).toISOString();
}

/**
 * Fixture completo AFA (34 fechas) desde JSON Paren La Pelota.
 */
export function buildPlaPremioMatches(
  division: "a" | "b" | "c",
  tournamentId: string,
): Match[] {
  const doc = plpDoc(division);
  const map = mapFor(division);
  const label =
    division === "a"
      ? "AFA Futsal · Primera A · Premio"
      : division === "b"
        ? "AFA Futsal · Primera B · Premio"
        : "AFA Futsal · Primera C · Premio";

  const fecha1FirstKickMs = getNextSaturday14BuenosAires().getTime();

  const out: Match[] = [];
  for (const round of doc.rounds) {
    const fecha = round.fecha;
    const md = `${tournamentId}-md-${String(fecha).padStart(2, "0")}`;
    round.matches.forEach((m, slot) => {
      out.push({
        id: `${tournamentId}-m${fecha}-${slot}`,
        tournamentId,
        matchdayId: md,
        homeTeam: mapTeam(m.homeTeam, map),
        awayTeam: mapTeam(m.awayTeam, map),
        startsAt: startsAtIso(fecha, slot, fecha1FirstKickMs),
        tournamentLabel: label,
      });
    });
  }
  return out;
}
