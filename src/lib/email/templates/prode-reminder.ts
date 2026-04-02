import {
  EMAIL_BRAND_FOOTER,
  getAppBaseUrl,
} from "@/lib/email/app-base-url";
import {
  emailHtmlDocument,
  escapeHtml,
} from "@/lib/email/templates/layout";

export function buildProdeClosingReminderContent(input: {
  prodeTitle: string;
  prodeSlug: string;
  closesAt: Date;
  incomplete: boolean;
}): { subject: string; html: string; text: string } {
  const base = getAppBaseUrl();
  const ctaUrl = `${base}/prodes/${encodeURIComponent(input.prodeSlug)}`;
  const closeLabel = input.closesAt.toLocaleString("es-AR", {
    weekday: "long",
    day: "numeric",
    month: "long",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "America/Argentina/Buenos_Aires",
  });

  const subject = `${EMAIL_BRAND_FOOTER} — aviso de cierre: ${input.prodeTitle}`;

  const detail = input.incomplete
    ? "La fecha está por cerrar y todavía no cargaste todos tus pronósticos. Entrá y dejalos listos antes de que cierre el prode."
    : "Ya cargaste tus pronósticos; igual podés revisarlos o ajustar algo hasta el cierre.";

  const text = [
    `El cierre del prode «${input.prodeTitle}» está previsto para ${closeLabel} (hora Argentina).`,
    "",
    detail,
    "",
    "Acceso:",
    ctaUrl,
    "",
    EMAIL_BRAND_FOOTER,
  ].join("\n");

  const inner = `
<p style="margin:0 0 12px;font-size:14px;font-weight:600;color:#171717;">${escapeHtml(input.prodeTitle)}</p>
<p style="margin:0 0 16px;color:#404040;">Cierre previsto: ${escapeHtml(closeLabel)} (Argentina).</p>
<p style="margin:0 0 20px;">${escapeHtml(detail)}</p>
<p style="margin:0 0 24px;">
  <a href="${escapeHtml(ctaUrl)}" style="display:inline-block;padding:10px 18px;background:#171717;color:#ffffff;text-decoration:none;border-radius:6px;font-weight:600;">Abrir prode</a>
</p>
<p style="margin:0;font-size:12px;color:#737373;">${escapeHtml(EMAIL_BRAND_FOOTER)}</p>
`;

  const html = emailHtmlDocument(inner);

  return { subject, html, text };
}
