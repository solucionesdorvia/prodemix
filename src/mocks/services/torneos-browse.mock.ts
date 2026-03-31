import type { TorneoBrowseItem, TorneoCategoryFilterId } from "@/domain";

import { PRIMERA_BROWSE_ITEMS } from "@/mocks/catalog/primera-catalog";
import { mergeTorneoBrowseItems } from "@/mocks/merge-ingestion";

export function getTorneoBrowseItemsStatic(): TorneoBrowseItem[] {
  return [...TORNEOS_BROWSE_FIXTURE];
}

/** Merges ingested tournaments (localStorage) when running in the browser. */
export function getTorneoBrowseItems(): TorneoBrowseItem[] {
  const base = getTorneoBrowseItemsStatic();
  if (typeof window === "undefined") return base;
  return mergeTorneoBrowseItems(base);
}

export const TORNEOS_CATEGORY_CHIPS: {
  id: TorneoCategoryFilterId;
  label: string;
}[] = [
  { id: "todos", label: "Todos" },
  { id: "futsal", label: "Futsal" },
  { id: "futbol-8", label: "Fútbol 8" },
  { id: "amateur", label: "Amateur" },
  { id: "barrial", label: "Barrial" },
  { id: "club-local", label: "Clubes" },
];

/** Solo competiciones Primera (demo). */
const TORNEOS_BROWSE_FIXTURE: TorneoBrowseItem[] = PRIMERA_BROWSE_ITEMS;
