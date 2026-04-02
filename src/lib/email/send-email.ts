import nodemailer from "nodemailer";

import { getResendClient } from "@/lib/email/resend";

export type SendEmailResult =
  | { sent: true }
  | { sent: false; error: string };

/**
 * Low-level send: Resend HTTP API if RESEND_API_KEY is set, otherwise Nodemailer + EMAIL_SERVER.
 */
export async function sendEmail(input: {
  to: string;
  subject: string;
  html: string;
  text: string;
}): Promise<SendEmailResult> {
  const from = process.env.EMAIL_FROM?.trim();
  if (!from) {
    return { sent: false, error: "EMAIL_FROM is not configured." };
  }

  const resend = getResendClient();
  if (resend) {
    const result = await resend.emails.send({
      from,
      to: input.to,
      subject: input.subject,
      html: input.html,
      text: input.text,
    });
    if (result.error) {
      return { sent: false, error: result.error.message };
    }
    return { sent: true };
  }

  const serverUrl = process.env.EMAIL_SERVER?.trim();
  if (!serverUrl) {
    return {
      sent: false,
      error:
        "Configure RESEND_API_KEY or EMAIL_SERVER for outbound email.",
    };
  }

  const transport = nodemailer.createTransport(serverUrl);
  try {
    await transport.sendMail({
      from,
      to: input.to,
      subject: input.subject,
      html: input.html,
      text: input.text,
    });
    return { sent: true };
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return { sent: false, error: msg };
  }
}

export function isOutboundEmailConfigured(): boolean {
  return Boolean(
    process.env.EMAIL_FROM?.trim() &&
      (process.env.RESEND_API_KEY?.trim() || process.env.EMAIL_SERVER?.trim()),
  );
}
