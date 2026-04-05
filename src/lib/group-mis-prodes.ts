import type { MisProdeServerKind } from "@/lib/mis-prode-server-status";

export type MisProdePhase = "upcoming" | "live" | "done";

/**
 * Agrupa participaciones según estado real del servidor (sin inventar fechas).
 * - upcoming: todavía podés cargar o completar pronósticos antes del cierre.
 * - live: cerró la carga; se computan resultados y ranking.
 * - done: prode finalizado o cancelado.
 */
export function groupMisProdeRowsByPhase<
  T extends { status: { kind: MisProdeServerKind } },
>(rows: T[]): Record<MisProdePhase, T[]> {
  const upcoming: T[] = [];
  const live: T[] = [];
  const done: T[] = [];
  for (const row of rows) {
    const k = row.status.kind;
    if (k === "finalizado") {
      done.push(row);
    } else if (k === "pendiente" || k === "completado") {
      upcoming.push(row);
    } else {
      live.push(row);
    }
  }
  return { upcoming, live, done };
}
