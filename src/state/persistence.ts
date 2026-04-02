import { generateInviteCode } from "./invite-code";
import { defaultUserProfileFromMock } from "./user-profile";
import type { PersistedAppState, StoredProde } from "./types";
import { DEFAULT_APP_STATE } from "./types";

/** Datos por usuario (id de Auth.js). Migración: se lee una vez la clave legacy sin sufijo. */
const LEGACY_STORAGE_KEY = "prodemix:v1:app";
const LEGACY_BACKUP_KEY = "prodemix:v1:app:backup";

function storageKey(userId: string): string {
  return `prodemix:v1:app:${userId}`;
}

function backupKey(userId: string): string {
  return `prodemix:v1:app:${userId}:backup`;
}

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

  const baseProfile = defaultUserProfileFromMock();
  const up = partial.userProfile;
  const userProfile =
    up &&
    typeof up === "object" &&
    typeof (up as { username?: unknown }).username === "string" &&
    typeof (up as { displayName?: unknown }).displayName === "string" ?
      {
        username: String((up as { username: string }).username),
        displayName: String((up as { displayName: string }).displayName),
        avatarUrl:
          (up as { avatarUrl?: string | null }).avatarUrl === null ||
          typeof (up as { avatarUrl?: unknown }).avatarUrl === "string" ?
            ((up as { avatarUrl: string | null }).avatarUrl ?? null)
          : baseProfile.avatarUrl,
      }
    : null;

  const np = partial.notificationPreferences;
  const notificationPreferences = {
    matchReminders:
      typeof np?.matchReminders === "boolean" ?
        np.matchReminders
      : DEFAULT_APP_STATE.notificationPreferences.matchReminders,
    prodeDeadlineAlerts:
      typeof np?.prodeDeadlineAlerts === "boolean" ?
        np.prodeDeadlineAlerts
      : DEFAULT_APP_STATE.notificationPreferences.prodeDeadlineAlerts,
  };

  return {
    onboardingCompletedAt: resolveOnboardingCompleted(partial),
    userProfile,
    notificationPreferences,
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

export function loadPersistedState(userId: string): PersistedAppState {
  if (typeof window === "undefined") return DEFAULT_APP_STATE;
  const key = storageKey(userId);
  const main = safeParse(localStorage.getItem(key));
  if (main) return mergeWithDefaults(main);
  const bk = safeParse(localStorage.getItem(backupKey(userId)));
  if (bk) return mergeWithDefaults(bk);
  const legacyMain = safeParse(localStorage.getItem(LEGACY_STORAGE_KEY));
  if (legacyMain) {
    const merged = mergeWithDefaults(legacyMain);
    try {
      localStorage.setItem(key, JSON.stringify(merged));
    } catch {
      /* ignore */
    }
    return merged;
  }
  const legacyBackup = safeParse(localStorage.getItem(LEGACY_BACKUP_KEY));
  if (legacyBackup) return mergeWithDefaults(legacyBackup);
  return DEFAULT_APP_STATE;
}

/**
 * Persistencia atómica por clave: un solo `setItem` con el estado completo
 * (no hay guardados parciales de pronósticos).
 * Reintenta una vez ante fallos intermitentes del motor de almacenamiento.
 */
export function savePersistedState(
  state: PersistedAppState,
  userId: string,
): PersistResult {
  if (typeof window === "undefined") return { ok: true };
  const serialized = JSON.stringify(state);
  const key = storageKey(userId);
  const bk = backupKey(userId);
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      localStorage.setItem(key, serialized);
      try {
        localStorage.setItem(bk, serialized);
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
