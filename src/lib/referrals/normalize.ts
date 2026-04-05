/**
 * Normaliza código de invitación desde URL o cookie (Edge-safe, sin node:crypto).
 */
export function normalizeReferralCode(raw: string | null | undefined): string | null {
  if (raw == null) return null;
  const s = raw.trim().toUpperCase();
  if (s.length < 4 || s.length > 16) return null;
  if (!/^[A-Z0-9]+$/.test(s)) return null;
  return s;
}
