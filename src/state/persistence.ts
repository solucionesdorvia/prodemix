import { normalizeScorePrediction } from "@/domain/prediction";

import { generateInviteCode } from "./invite-code";
import type { PersistedAppState, StoredProde } from "./types";
import { DEFAULT_APP_STATE } from "./types";

function migrateScoreMap(
  raw: Record<string, unknown> | undefined,
): PersistedAppState["predictionMap"] {
  if (!raw || typeof raw !== "object") return {};
  const out: PersistedAppState["predictionMap"] = {};
  for (const [k, v] of Object.entries(raw)) {
    const n = normalizeScorePrediction(v);
    if (n) out[k] = n;
  }
  return out;
}

const STORAGE_KEY = "prodemix:v1:app";

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
    predictionMap: migrateScoreMap(
      partial.predictionMap as Record<string, unknown> | undefined,
    ),
    joinedPublicPoolIds:
      Array.isArray(partial.joinedPublicPoolIds) ?
        partial.joinedPublicPoolIds
      : [],
    publicPoolPredictionMap: migrateScoreMap(
      partial.publicPoolPredictionMap as Record<string, unknown> | undefined,
    ),
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
  const parsed = safeParse(localStorage.getItem(STORAGE_KEY));
  if (!parsed) return DEFAULT_APP_STATE;
  return mergeWithDefaults(parsed);
}

export function savePersistedState(state: PersistedAppState): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    /* quota / private mode */
  }
}
