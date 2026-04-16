import { NextResponse } from "next/server";

import { auth } from "@/auth";
import { apiError } from "@/lib/api-errors";
import { sendEmail } from "@/lib/email/send-email";
import { findProdeByIdOrSlug } from "@/lib/prode-resolve";
import { getPrisma } from "@/lib/prisma";
import { supportContactBodySchema } from "@/lib/validation/support-contact-api";
import { zodToApiError } from "@/lib/validation/zod-to-api";

export const dynamic = "force-dynamic";

function supportInbox(): string {
  return (
    process.env.SUPPORT_INBOX?.trim() ||
    process.env.SUPPORT_EMAIL?.trim() ||
    "hola@prodemix.app"
  );
}

/**
 * Mensaje desde la app: reclamar premio o reportar error (envío por correo al equipo).
 */
export async function POST(req: Request) {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) {
    return apiError(401, "UNAUTHORIZED", "Tenés que iniciar sesión para enviar un mensaje.");
  }

  let json: unknown;
  try {
    json = await req.json();
  } catch {
    return apiError(400, "INVALID_DATA", "Cuerpo JSON inválido.");
  }

  const parsed = supportContactBodySchema.safeParse(json);
  if (!parsed.success) {
    return zodToApiError(parsed.error);
  }

  const { prodeId, kind, message } = parsed.data;
  const prisma = getPrisma();
  const prode = await findProdeByIdOrSlug(prisma, prodeId);
  if (!prode) {
    return apiError(404, "NOT_FOUND", "Prode no encontrado.");
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { email: true, name: true, username: true },
  });
  if (!user) {
    return apiError(404, "NOT_FOUND", "Usuario no encontrado.");
  }

  const kindLabel =
    kind === "prize" ? "Reclamar premio" : "Reportar error";
  const subject = `[Prodemix] ${kindLabel} — ${prode.title}`;

  const text = [
    kindLabel,
    "",
    `Prode: ${prode.title}`,
    `Prode ID: ${prode.id}`,
    `Slug: ${prode.slug}`,
    "",
    `Usuario ID: ${userId}`,
    `Nombre: ${user.name ?? "—"}`,
    `Username: ${user.username ?? "—"}`,
    `Email: ${user.email ?? "—"}`,
    "",
    "Mensaje:",
    message,
  ].join("\n");

  const esc = (s: string) =>
    s
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");
  const html = `<pre style="font-family:system-ui,sans-serif;white-space:pre-wrap">${esc(text)}</pre>`;

  const result = await sendEmail({
    to: supportInbox(),
    subject,
    text,
    html,
  });

  if (!result.sent) {
    return apiError(
      503,
      "SERVICE_UNAVAILABLE",
      result.error ||
        "No pudimos enviar el mensaje. El correo de soporte no está configurado o falló el envío.",
    );
  }

  return NextResponse.json({ ok: true });
}
