import type { AdminProdeRecord, AdminProdeStorage } from "./admin-prode-types";

export const ADMIN_PRODE_STORAGE_KEY = "prodemix:v1:admin-prodes";

const STORAGE_KEY = ADMIN_PRODE_STORAGE_KEY;

export const ADMIN_PRODE_UPDATED_EVENT = "prodemix-admin-prode-updated";

const EMPTY: AdminProdeStorage = { prodes: [] };

function safeParse(raw: string | null): AdminProdeStorage | null {
  if (!raw) return null;
  try {
    const v = JSON.parse(raw) as unknown;
    if (!v || typeof v !== "object") return null;
    return v as AdminProdeStorage;
  } catch {
    return null;
  }
}

export function loadAdminProdeStorage(): AdminProdeStorage {
  if (typeof window === "undefined") return EMPTY;
  const p = safeParse(localStorage.getItem(STORAGE_KEY));
  if (!p || !Array.isArray(p.prodes)) return EMPTY;
  return { prodes: p.prodes };
}

export function saveAdminProdeStorage(next: AdminProdeStorage): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    window.dispatchEvent(new Event(ADMIN_PRODE_UPDATED_EVENT));
  } catch {
    /* quota */
  }
}

export function upsertAdminProdeRecord(
  storage: AdminProdeStorage,
  record: AdminProdeRecord,
): AdminProdeStorage {
  const rest = storage.prodes.filter((p) => p.id !== record.id);
  return { prodes: [...rest, record] };
}

export function removeAdminProdeRecord(
  storage: AdminProdeStorage,
  prodeId: string,
): AdminProdeStorage {
  return { prodes: storage.prodes.filter((p) => p.id !== prodeId) };
}

export function getAdminProdeByProdeId(
  prodeId: string,
): AdminProdeRecord | undefined {
  return loadAdminProdeStorage().prodes.find((p) => p.id === prodeId);
}

/** Resultado final para un partido (capa admin). */
export function getAdminResultForMatch(
  matchId: string,
): { home: number; away: number } | undefined {
  for (const p of loadAdminProdeStorage().prodes) {
    const r = p.results[matchId];
    if (r) return r;
  }
  return undefined;
}

export function getAllAdminResultMatchIds(): string[] {
  const ids = new Set<string>();
  for (const p of loadAdminProdeStorage().prodes) {
    for (const k of Object.keys(p.results)) ids.add(k);
  }
  return [...ids];
}
