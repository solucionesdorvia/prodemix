/**
 * URL pública para compartir invitación (cliente y servidor).
 * Preferí NEXT_PUBLIC_APP_URL en producción; si no, AUTH_URL.
 */
export function getReferralShareBaseUrl(): string {
  const pub = process.env.NEXT_PUBLIC_APP_URL?.trim();
  if (pub) return pub.replace(/\/+$/, "");
  const auth = process.env.AUTH_URL?.trim() || process.env.NEXTAUTH_URL?.trim();
  if (auth) return auth.replace(/\/+$/, "");
  const vercel = process.env.VERCEL_URL?.trim();
  if (vercel) return `https://${vercel.replace(/^https?:\/\//, "").replace(/\/+$/, "")}`;
  return "https://prodemix.app";
}

export function buildReferralShareUrl(referralCode: string): string {
  const base = getReferralShareBaseUrl();
  const url = new URL(base);
  url.searchParams.set("ref", referralCode);
  return url.toString();
}
