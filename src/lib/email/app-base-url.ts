/**
 * Public app URL for links in emails (no trailing slash).
 * Order: AUTH_URL → NEXTAUTH_URL → VERCEL_URL → prodemix.app
 *
 * Nunca usa localhost: si la URL explícita es local, o no hay env, los links van al sitio público.
 */
const DEFAULT_PUBLIC_APP_ORIGIN = "https://prodemix.app";

function stripTrailingSlashes(s: string): string {
  return s.replace(/\/+$/, "");
}

function isLocalOrigin(url: string): boolean {
  return /localhost|127\.0\.0\.1/i.test(url);
}

/** Pie de correos transaccionales (sin https://). */
export const EMAIL_BRAND_FOOTER = "prodemix.app";

export function getAppBaseUrl(): string {
  const explicit =
    process.env.AUTH_URL?.trim() || process.env.NEXTAUTH_URL?.trim();
  if (explicit) {
    const u = stripTrailingSlashes(explicit);
    if (isLocalOrigin(u)) return DEFAULT_PUBLIC_APP_ORIGIN;
    return u;
  }

  const vercel = process.env.VERCEL_URL?.trim();
  if (vercel) {
    const host = vercel.replace(/^https?:\/\//, "").replace(/\/+$/, "");
    return `https://${host}`;
  }

  return DEFAULT_PUBLIC_APP_ORIGIN;
}
