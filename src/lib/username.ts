const USERNAME_RE = /^[a-z0-9_]{3,30}$/;

/**
 * Convierte a handle guardable: minúsculas, sin tildes (NFD), ñ→n, espacios→`_`,
 * y elimina lo que no sea `[a-z0-9_]`.
 */
export function normalizeUsername(raw: string): string {
  const lower = raw.trim().toLowerCase();
  const noMarks = lower.normalize("NFD").replace(/\p{M}/gu, "");
  const spaced = noMarks.replace(/\s+/g, "_").replace(/ñ/g, "n");
  return spaced.replace(/[^a-z0-9_]/g, "");
}

/** Returns error message in Spanish or null if valid. */
export function validateUsernameFormat(normalized: string): string | null {
  if (normalized.length < 3 || normalized.length > 30) {
    return "Entre 3 y 30 caracteres.";
  }
  if (!USERNAME_RE.test(normalized)) {
    return "Solo letras minúsculas, números y guión bajo (_).";
  }
  return null;
}
