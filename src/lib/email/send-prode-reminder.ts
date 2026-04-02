import { buildProdeClosingReminderContent } from "@/lib/email/templates/prode-reminder";
import { sendEmail, type SendEmailResult } from "@/lib/email/send-email";

export async function sendProdeClosingReminderEmail(input: {
  to: string;
  prodeTitle: string;
  prodeSlug: string;
  closesAt: Date;
  incomplete: boolean;
}): Promise<SendEmailResult> {
  const { subject, html, text } = buildProdeClosingReminderContent({
    prodeTitle: input.prodeTitle,
    prodeSlug: input.prodeSlug,
    closesAt: input.closesAt,
    incomplete: input.incomplete,
  });
  return sendEmail({ to: input.to, subject, html, text });
}
