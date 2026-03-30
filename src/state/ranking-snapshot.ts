import type { RankingEntry, RankingTrend } from "@/domain";

const STORAGE_KEY = "prodemix:v1:ranking-ranks";

type Store = {
  v: 1;
  /** scopeKey → playerId → last saved rank (1-based) */
  byScope: Record<string, Record<string, number>>;
};

const EMPTY: Store = { v: 1, byScope: {} };

function safeParse(raw: string | null): Store | null {
  if (!raw) return null;
  try {
    const v = JSON.parse(raw) as unknown;
    if (!v || typeof v !== "object") return null;
    const o = v as Store;
    if (o.v !== 1 || !o.byScope || typeof o.byScope !== "object") return null;
    return o;
  } catch {
    return null;
  }
}

function loadStore(): Store {
  if (typeof window === "undefined") return EMPTY;
  return safeParse(localStorage.getItem(STORAGE_KEY)) ?? EMPTY;
}

function saveStore(store: Store): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
  } catch {
    /* quota */
  }
}

/**
 * Compares current ranks to last visit (same device). Positive rankDelta = climbed.
 */
export function mergeRankDeltas(
  entries: RankingEntry[],
  scopeKey: string,
): RankingEntry[] {
  const prev = loadStore().byScope[scopeKey];
  if (!prev) {
    return entries.map((e) => ({
      ...e,
      rankDelta: 0,
      trend: "same" as RankingTrend,
    }));
  }
  return entries.map((e) => {
    const was = prev[e.playerId];
    if (was === undefined) {
      return { ...e, rankDelta: 0, trend: "same" as RankingTrend };
    }
    const delta = was - e.rank;
    const trend: RankingTrend =
      delta > 0 ? "up" : delta < 0 ? "down" : "same";
    return { ...e, rankDelta: delta, trend };
  });
}

/** Persist ranks after viewing so next visit can show movement. */
export function persistScopeRanks(scopeKey: string, entries: RankingEntry[]) {
  const store = loadStore();
  const nextRanks = Object.fromEntries(
    entries.map((e) => [e.playerId, e.rank]),
  );
  saveStore({
    ...store,
    byScope: { ...store.byScope, [scopeKey]: nextRanks },
  });
}
