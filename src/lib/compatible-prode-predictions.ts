import type { ScorePrediction } from "@/domain";
import { getMockResultForMatch } from "@/mocks/mock-match-results";
import {
  getOfficialProdeListItemById,
  getStoredProdeFromOfficialOrNull,
} from "@/mocks/official-prodes.mock";
import {
  getPredictionsForProde,
  predictionStorageKey,
} from "@/state/selectors";
import type { PersistedAppState, StoredProde } from "@/state/types";

/** Every match in the destination exists in the source (same matchIds by id). */
export function prodesCompatibleForImport(
  destination: StoredProde,
  source: StoredProde,
): boolean {
  if (destination.id === source.id) return false;
  return destination.matchIds.every((id) => source.matchIds.includes(id));
}

export function resolveStoredProdeById(
  prodeId: string,
  state: PersistedAppState,
): StoredProde | null {
  return (
    getStoredProdeFromOfficialOrNull(prodeId) ??
    state.prodes.find((p) => p.id === prodeId) ??
    null
  );
}

/** Prode ids where the user has at least one saved prediction. */
export function getUserProdeIdsWithPredictions(
  userId: string,
  predictionMap: PersistedAppState["predictionMap"],
): string[] {
  const prefix = `${userId}::`;
  const ids = new Set<string>();
  for (const [k, v] of Object.entries(predictionMap)) {
    if (!k.startsWith(prefix) || !v) continue;
    const parts = k.split("::");
    if (parts.length >= 3) ids.add(parts[1]);
  }
  return [...ids];
}

export function formatProdeImportLabel(
  prodeId: string,
  prode: StoredProde,
): string {
  const meta = getOfficialProdeListItemById(prodeId);
  if (meta) {
    const cat =
      meta.category === "elite" ? "Prode Élite" : "Prode Gratis";
    return `${meta.tournamentName} — ${cat}`;
  }
  return prode.name;
}

export type CompatibleImportSource = {
  prodeId: string;
  displayName: string;
  /** Cuántos partidos abiertos del destino tienen marcador en el origen. */
  copyableCount: number;
  /** Partidos abiertos en el destino (sin resultado final). */
  totalUnlockedDest: number;
};

function unlockedMatchIds(matchIds: string[]): string[] {
  return matchIds.filter((id) => !getMockResultForMatch(id));
}

/**
 * Fuentes desde las que se pueden copiar pronósticos al prode actual.
 * Requiere compatibilidad por matchId y al menos un pronóstico copiable.
 */
export function getCompatibleImportSources(
  userId: string,
  destination: StoredProde,
  state: PersistedAppState,
): CompatibleImportSource[] {
  const destUnlocked = unlockedMatchIds(destination.matchIds);
  if (destUnlocked.length === 0) return [];

  const candidateIds = getUserProdeIdsWithPredictions(
    userId,
    state.predictionMap,
  );
  const out: CompatibleImportSource[] = [];

  for (const pid of candidateIds) {
    if (pid === destination.id) continue;
    const source = resolveStoredProdeById(pid, state);
    if (!source) continue;
    if (!prodesCompatibleForImport(destination, source)) continue;

    const sourcePreds = getPredictionsForProde(userId, pid, state.predictionMap);
    let copyable = 0;
    for (const mid of destUnlocked) {
      if (sourcePreds[mid]) copyable += 1;
    }

    if (copyable === 0) continue;

    out.push({
      prodeId: pid,
      displayName: formatProdeImportLabel(pid, source),
      copyableCount: copyable,
      totalUnlockedDest: destUnlocked.length,
    });
  }

  out.sort((a, b) => b.copyableCount - a.copyableCount);
  return out;
}

/** Mapa matchId → score para importar (solo partidos desbloqueados con pred en origen). */
export function buildImportPredictionUpdates(
  userId: string,
  destination: StoredProde,
  sourceProdeId: string,
  state: PersistedAppState,
): Record<string, ScorePrediction> {
  const sourcePreds = getPredictionsForProde(
    userId,
    sourceProdeId,
    state.predictionMap,
  );
  const updates: Record<string, ScorePrediction> = {};
  for (const mid of destination.matchIds) {
    if (getMockResultForMatch(mid)) continue;
    const p = sourcePreds[mid];
    if (p) updates[mid] = p;
  }
  return updates;
}

export function destinationHasUnlockedPredictions(
  userId: string,
  destinationProdeId: string,
  destination: StoredProde,
  predictionMap: PersistedAppState["predictionMap"],
): boolean {
  for (const mid of destination.matchIds) {
    if (getMockResultForMatch(mid)) continue;
    const key = predictionStorageKey(userId, destinationProdeId, mid);
    if (predictionMap[key]) return true;
  }
  return false;
}

/** Limpia pronósticos solo en partidos aún no cerrados. */
export function buildClearUnlockedPredictionsUpdates(
  userId: string,
  destinationProdeId: string,
  destination: StoredProde,
  predictionMap: PersistedAppState["predictionMap"],
): Record<string, ScorePrediction | null> {
  const updates: Record<string, ScorePrediction | null> = {};
  for (const mid of destination.matchIds) {
    if (getMockResultForMatch(mid)) continue;
    const key = predictionStorageKey(userId, destinationProdeId, mid);
    if (predictionMap[key]) updates[mid] = null;
  }
  return updates;
}
