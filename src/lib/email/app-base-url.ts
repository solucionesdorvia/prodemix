/**
 * Public app URL for links in emails (no trailing slash).
 * Order: explicit AUTH_URL → NEXTAUTH_URL → Vercel preview/production URL → localhost.
 */
export function getAppBaseUrl(): string {
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
