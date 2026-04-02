import { Resend } from "resend";

let resend: Resend | null = null;

/** Returns a singleton Resend client, or null if `RESEND_API_KEY` is not set. */
export function getResendClient(): Resend | null {
  const key = process.env.RESEND_API_KEY?.trim();
  if (!key) return null;
  if (!resend) resend = new Resend(key);
  return resend;
}

export function isResendConfigured(): boolean {
  return Boolean(process.env.RESEND_API_KEY?.trim());
}
