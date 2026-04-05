/**
 * URL base para enlaces de recuperación de contraseña (incluye localhost en dev si AUTH_URL lo define).
 */
export function getPasswordResetBaseUrl(): string {
  const explicit =
    process.env.AUTH_URL?.trim() || process.env.NEXTAUTH_URL?.trim();
  if (explicit) return explicit.replace(/\/+$/, "");
  const vercel = process.env.VERCEL_URL?.trim();
  if (vercel) {
    const host = vercel.replace(/^https?:\/\//, "").replace(/\/+$/, "");
    return `https://${host}`;
  }
  return "http://localhost:3000";
}
