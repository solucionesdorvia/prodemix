/** Slug URL-safe (sin acentos, minúsculas, guiones). */
export function slugify(input: string): string {
  const s = input
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 96);
  return s || "item";
}
