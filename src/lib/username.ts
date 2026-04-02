const USERNAME_RE = /^[a-z0-9_]{3,30}$/;

export function normalizeUsername(raw: string): string {
  return raw.trim().toLowerCase();
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
