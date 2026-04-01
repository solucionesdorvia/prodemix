import { generateInviteCode } from "./invite-code";
import type { PersistedAppState, StoredProde } from "./types";
import { DEFAULT_APP_STATE } from "./types";

const STORAGE_KEY = "prodemix:v1:app";
/** Copia de respaldo si el JSON principal se corrompe o falla al leer. */
const BACKUP_KEY = "prodemix:v1:app:backup";

export type PersistFailureReason = "quota" | "unknown";

export type PersistResult =
  | { ok: true }
  | { ok: false; reason: PersistFailureReason };

function safeParse(raw: string | null): PersistedAppState | null {
  if (!raw) return null;
  try {
    const v = JSON.parse(raw) as unknown;
    if (!v || typeof v !== "object") return null;
    return v as PersistedAppState;
  } catch {
    return null;
  }
}

function resolveOnboardingCompleted(
  partial: PersistedAppState,
): string | null {
  if (typeof partial.onboardingCompletedAt === "string") {
    return partial.onboardingCompletedAt;
  }
  const hadProdes = Array.isArray(partial.prodes) && partial.prodes.length > 0;
  const hadFollows =
    Array.isArray(partial.followedTournamentIds) &&
    partial.followedTournamentIds.length > 0;
  if (hadProdes || hadFollows) {
    return "2020-01-01T00:00:00.000Z";
  }
  return null;
}

function mergeWithDefaults(partial: PersistedAppState): PersistedAppState {
  const prodesRaw = Array.isArray(partial.prodes) ? partial.prodes : [];
  const codes = new Set<string>();
  for (const p of prodesRaw) {
    const ic = (p as { inviteCode?: string }).inviteCode;
    if (typeof ic === "string" && ic.trim()) codes.add(ic);
  }
  const prodes: StoredProde[] = prodesRaw.map((p) => {
    const cur = (p as { inviteCode?: string }).inviteCode;
    if (typeof cur === "string" && cur.trim()) {
      return { ...p, inviteCode: cur } as StoredProde;
    }
    const inviteCode = generateInviteCode(codes);
    return { ...p, inviteCode } as StoredProde;
  });

  return {
    onboardingCompletedAt: resolveOnboardingCompleted(partial),
    followedTournamentIds:
      Array.isArray(partial.followedTournamentIds) ?
        partial.followedTournamentIds
      : [],
    prodes,
    predictionMap:
      partial.predictionMap && typeof partial.predictionMap === "object" ?
        partial.predictionMap
      : {},
    joinedPublicPoolIds:
      Array.isArray(partial.joinedPublicPoolIds) ?
        partial.joinedPublicPoolIds
      : [],
    publicPoolPredictionMap:
      partial.publicPoolPredictionMap &&
      typeof partial.publicPoolPredictionMap === "object" ?
        partial.publicPoolPredictionMap
      : {},
    activity: Array.isArray(partial.activity) ? partial.activity : [],
    activityDedupeKeys:
      Array.isArray(partial.activityDedupeKeys) ?
        partial.activityDedupeKeys
      : [],
    activityLastSeenAt:
      typeof partial.activityLastSeenAt === "string" ?
        partial.activityLastSeenAt
      : null,
  };
}

export function loadPersistedState(): PersistedAppState {
  if (typeof window === "undefined") return DEFAULT_APP_STATE;
  const main = safeParse(localStorage.getItem(STORAGE_KEY));
  if (main) return mergeWithDefaults(main);
  const backup = safeParse(localStorage.getItem(BACKUP_KEY));
  if (backup) return mergeWithDefaults(backup);
  return DEFAULT_APP_STATE;
}

/**
 * Persistencia atómica por clave: un solo `setItem` con el estado completo
 * (no hay guardados parciales de pronósticos).
 * Reintenta una vez ante fallos intermitentes del motor de almacenamiento.
 */
export function savePersistedState(state: PersistedAppState): PersistResult {
  if (typeof window === "undefined") return { ok: true };
  const serialized = JSON.stringify(state);
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      localStorage.setItem(STORAGE_KEY, serialized);
      try {
        localStorage.setItem(BACKUP_KEY, serialized);
      } catch {
        /* backup opcional */
      }
      return { ok: true };
    } catch (e) {
      if (attempt === 0) continue;
      if (e instanceof DOMException && e.name === "QuotaExceededError") {
        return { ok: false, reason: "quota" };
      }
      return { ok: false, reason: "unknown" };
    }
  }
  return { ok: false, reason: "unknown" };
}
