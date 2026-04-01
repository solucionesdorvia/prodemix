import type { Match } from "@/domain";

/**
 * Horarios reales: `src/data/afa-premio-kickoffs-2026.json` (clave `afa-premio-*-m{fecha}-{slot}`, ISO con offset AR).
 * Primera A y B · fecha 3 (abr 2026); Primera C · fecha 2 (mismo fin de semana): horarios [Segundo Palo](https://www.segundopalo.com).
 * Calendario: Primera A y B desde fecha 3; Primera C desde fecha 2.
 */
import afaKickoffs from "@/data/afa-premio-kickoffs-2026.json";
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

/** Primera fecha incluida en el prode (fechas anteriores ya jugadas). */
const START_FECHA: Record<"a" | "b" | "c", number> = {
  /** Segundopalo: jornada 3 en adelante */
  a: 3,
  b: 3,
  /** Segundopalo: desde fecha 2 */
  c: 2,
};

const kickoffOverrides = afaKickoffs as {
  overrides: Record<string, string>;
};

/**
 * Primer partido de la primera fecha incluida: próximo sábado 14:00 AR.
 * Cada fecha oficial siguiente +7 días; entre partidos +35 min (placeholder si no hay override).
 */
function computedKickoffMs(
  fecha: number,
  slot: number,
  startFecha: number,
  firstIncludedFechaBaseMs: number,
): number {
  const weekIndex = fecha - startFecha;
  return (
    firstIncludedFechaBaseMs +
    weekIndex * 7 * 24 * 60 * 60 * 1000 +
    slot * 35 * 60 * 1000
  );
}

function resolveStartsAt(
  tournamentId: string,
  fecha: number,
  slot: number,
  startFecha: number,
  firstIncludedFechaBaseMs: number,
): string {
  const key = `${tournamentId}-m${fecha}-${slot}`;
  const o = kickoffOverrides.overrides[key];
  if (o) return new Date(o).toISOString();
  return new Date(
    computedKickoffMs(fecha, slot, startFecha, firstIncludedFechaBaseMs),
  ).toISOString();
}

/**
 * Fixture AFA desde JSON local (equipos alineados al calendario).
 * Rango activo: Primera A y B desde fecha 3; Primera C desde fecha 2 (Segundopalo).
 * Horarios: `afa-premio-kickoffs-2026.json` o placeholder sábado 14:00 + semanas + 35 min.
 */
export function buildPlaPremioMatches(
  division: "a" | "b" | "c",
  tournamentId: string,
): Match[] {
  const doc = plpDoc(division);
  const map = mapFor(division);
  const startFecha = START_FECHA[division];
  const label =
    division === "a"
      ? "AFA Futsal · Primera A · Premio"
      : division === "b"
        ? "AFA Futsal · Primera B · Premio"
        : "AFA Futsal · Primera C · Premio";

  const firstIncludedFechaBaseMs = getNextSaturday14BuenosAires().getTime();

  const out: Match[] = [];
  for (const round of doc.rounds) {
    const fecha = round.fecha;
    if (fecha < startFecha) continue;
    const md = `${tournamentId}-md-${String(fecha).padStart(2, "0")}`;
    round.matches.forEach((m, slot) => {
      out.push({
        id: `${tournamentId}-m${fecha}-${slot}`,
        tournamentId,
        matchdayId: md,
        homeTeam: mapTeam(m.homeTeam, map),
        awayTeam: mapTeam(m.awayTeam, map),
        startsAt: resolveStartsAt(
          tournamentId,
          fecha,
          slot,
          startFecha,
          firstIncludedFechaBaseMs,
        ),
        tournamentLabel: label,
      });
    });
  }
  return out;
}
