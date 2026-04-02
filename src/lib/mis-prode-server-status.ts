import type { ProdeLifecycleStatus } from "@/generated/prisma/client";

export type MisProdeServerKind =
  | "pendiente"
  | "completado"
  | "cerrado"
  | "en_juego"
  | "finalizado";

type ProdeLite = {
  status: ProdeLifecycleStatus;
  closesAt: Date;
};

/**
 * Labels for server-backed Mis Prodes (GET /api/me/prodes).
 */
export function misProdeServerStatus(
  prode: ProdeLite,
  matchCount: number,
  pendingCount: number,
  now: Date,
): { kind: MisProdeServerKind; label: string } {
  if (prode.status === "FINALIZED" || prode.status === "CANCELLED") {
    return { kind: "finalizado", label: "Finalizado" };
  }

  const open = prode.closesAt > now;

  if (open && pendingCount > 0) {
    return { kind: "pendiente", label: "Pendiente" };
  }
  if (open && matchCount > 0 && pendingCount === 0) {
    return { kind: "completado", label: "Completado" };
  }
  if (!open && pendingCount > 0) {
    return { kind: "cerrado", label: "Cerrado" };
  }
  if (!open && pendingCount === 0 && matchCount > 0) {
    return { kind: "en_juego", label: "En juego" };
  }
  return { kind: "en_juego", label: "En juego" };
}
