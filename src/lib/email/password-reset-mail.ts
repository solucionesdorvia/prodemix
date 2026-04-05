import { EMAIL_BRAND_FOOTER } from "@/lib/email/app-base-url";

export function buildPasswordResetEmail(input: {
  resetUrl: string;
  /** Minutos hasta expiración (mostrar en texto). */
  expiresMinutes: number;
}): { subject: string; html: string; text: string } {
  const subject = "Restablecer contraseña — ProdeMix";
  const text = [
    "Recibimos una solicitud para restablecer la contraseña de tu cuenta en ProdeMix.",
    "",
    `Abrí este enlace (válido ${input.expiresMinutes} minutos):`,
    input.resetUrl,
    "",
    "Si no pediste esto, ignorá este correo.",
    "",
    `— ${EMAIL_BRAND_FOOTER}`,
  ].join("\n");

  const html = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8" /></head>
<body style="font-family:system-ui,sans-serif;line-height:1.5;color:#0f172a;max-width:480px;margin:0;padding:24px;">
  <p>Recibimos una solicitud para restablecer la contraseña de tu cuenta en <strong>ProdeMix</strong>.</p>
  <p>
    <a href="${escapeHtml(input.resetUrl)}" style="display:inline-block;background:#1d4ed8;color:#fff;text-decoration:none;padding:12px 20px;border-radius:10px;font-weight:600;">
      Restablecer contraseña
    </a>
  </p>
  <p style="font-size:13px;color:#64748b;">El enlace vence en ${input.expiresMinutes} minutos. Si no pediste esto, ignorá este correo.</p>
  <p style="font-size:12px;color:#94a3b8;">— ${escapeHtml(EMAIL_BRAND_FOOTER)}</p>
</body>
</html>`.trim();

  return { subject, html, text };
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
