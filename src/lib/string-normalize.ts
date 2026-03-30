/**
 * Accent-insensitive search key (Spanish UI).
 * Use for filtering lists by user-typed queries.
 */
export function normalizeSearchKey(s: string): string {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}
