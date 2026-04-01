import type { PersistedAppState, StoredProde } from "@/state/types";
import { isAdminProdePredictionsLocked } from "@/lib/admin-prode-guard";
import { isPredictionDeadlineOpen } from "@/lib/datetime";
import { findCatalogueMatchById } from "@/lib/catalogue-matches";
import { getMockResultForMatch } from "@/mocks/mock-match-results";
import { getTournamentCatalogueEntryById } from "@/mocks/services/tournaments-catalogue.mock";
import { getAdminProdeByProdeId } from "@/state/admin-prode-storage";
import { predictionStorageKey } from "@/state/selectors";

export type MisProdeStatusKind =
  | "pendiente"
  | "completado"
  | "en_juego"
  | "finalizado";

export function getProdeTournamentLabel(prode: StoredProde): string {
  const parts = prode.tournamentIds.map((tid) => {
    const t = getTournamentCatalogueEntryById(tid);
    return t?.shortName ?? t?.name ?? tid;
  });
  return parts.length > 0 ? parts.join(" · ") : "Torneo";
}

export function countPendingProdePredictions(
  prode: StoredProde,
  userId: string,
  state: PersistedAppState,
): number {
  let n = 0;
  for (const matchId of prode.matchIds) {
    const key = predictionStorageKey(userId, prode.id, matchId);
    if (!state.predictionMap[key]) n += 1;
  }
  return n;
}

/** Hay al menos un partido sin pronóstico y todavía se puede cargar (kickoff futuro, sin resultado). */
export function canPredictAnyProdeMatch(
  prode: StoredProde,
  userId: string,
  state: PersistedAppState,
): boolean {
  if (isAdminProdePredictionsLocked(prode.id)) return false;
  for (const matchId of prode.matchIds) {
    const key = predictionStorageKey(userId, prode.id, matchId);
    if (state.predictionMap[key]) continue;
    if (getMockResultForMatch(matchId)) continue;
    const m = findCatalogueMatchById(matchId);
    if (!m) continue;
    if (isPredictionDeadlineOpen(m.startsAt)) return true;
  }
  return false;
}

function allProdeMatchesHaveResult(prode: StoredProde): boolean {
  if (prode.matchIds.length === 0) return false;
  return prode.matchIds.every((mid) => getMockResultForMatch(mid));
}

/**
 * Indicador de estado para listados (home, perfil).
 * - Pendiente: faltan pronósticos y todavía podés cargar.
 * - Completado: cargaste todos los marcadores; esperando resultados.
 * - En juego: competencia en curso (cerraste pronósticos o no podés más, pero no terminó).
 * - Finalizado: prode terminado (admin o todos los resultados cargados).
 */
export function getMisProdeStatus(
  prode: StoredProde,
  userId: string,
  state: PersistedAppState,
): { kind: MisProdeStatusKind; label: string } {
  const admin = getAdminProdeByProdeId(prode.id);
  const pending = countPendingProdePredictions(prode, userId, state);
  const canPredict = canPredictAnyProdeMatch(prode, userId, state);
  const allResults = allProdeMatchesHaveResult(prode);

  if (admin?.status === "finalized" || allResults) {
    return { kind: "finalizado", label: "Finalizado" };
  }
  if (pending > 0 && canPredict) {
    return { kind: "pendiente", label: "Pendiente" };
  }
  if (pending === 0) {
    return { kind: "completado", label: "Completado" };
  }
  return { kind: "en_juego", label: "En juego" };
}
