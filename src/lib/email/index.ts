export { getResendClient, isResendConfigured } from "./resend";
export { sendEmail, isOutboundEmailConfigured } from "./send-email";
export type { SendEmailResult } from "./send-email";
export { sendProdeClosingReminderEmail } from "./send-prode-reminder";
export { runClosingReminders } from "./reminders/run-closing-reminders";
export type { ClosingReminderRunResult } from "./reminders/run-closing-reminders";
export { emailHtmlDocument, escapeHtml } from "./templates/layout";
