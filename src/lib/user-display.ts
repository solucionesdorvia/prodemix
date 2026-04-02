/** Two-letter initials for avatars / ranking chips. */
export function initialsFromDisplayName(name: string): string {
  return name
    .split(/\s+/)
    .map((p) => p[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

/**
 * Iniciales para el saludo del home: una sola palabra (p. ej. handle) → dos caracteres;
 * nombre compuesto → primera letra del primero y del último token.
 */
export function initialsFromGreetingName(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) {
    const w = parts[0]!;
    return w.slice(0, 2).toUpperCase();
  }
  return (parts[0]![0] + parts[parts.length - 1]![0]).toUpperCase();
}
