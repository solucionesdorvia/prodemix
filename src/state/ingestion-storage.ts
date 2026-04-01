import type { IngestionStorage } from "./ingestion-types";
import { DEFAULT_INGESTION } from "./ingestion-types";

export const INGESTION_STORAGE_KEY = "prodemix:v1:ingestion";

const STORAGE_KEY = INGESTION_STORAGE_KEY;

export const INGESTION_UPDATED_EVENT = "prodemix-ingestion-updated";

function safeParse(raw: string | null): IngestionStorage | null {
  if (!raw) return null;
  try {
    const v = JSON.parse(raw) as unknown;
    if (!v || typeof v !== "object") return null;
    return v as IngestionStorage;
  } catch {
    return null;
  }
}

function mergeDefaults(partial: IngestionStorage): IngestionStorage {
  return {
    tournaments: Array.isArray(partial.tournaments) ? partial.tournaments : [],
  };
}

export function loadIngestionStorage(): IngestionStorage {
  if (typeof window === "undefined") return DEFAULT_INGESTION;
  const parsed = safeParse(localStorage.getItem(STORAGE_KEY));
  if (!parsed) return DEFAULT_INGESTION;
  return mergeDefaults(parsed);
}

export function saveIngestionStorage(state: IngestionStorage): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    window.dispatchEvent(new Event(INGESTION_UPDATED_EVENT));
  } catch {
    /* quota */
  }
}

/** Flatten all ingested match results into one lookup (client-only). */
export function loadIngestionResultsOverlay(): Record<
  string,
  { home: number; away: number }
> {
  const ing = loadIngestionStorage();
  const out: Record<string, { home: number; away: number }> = {};
  for (const t of ing.tournaments) {
    Object.assign(out, t.results);
  }
  return out;
}
