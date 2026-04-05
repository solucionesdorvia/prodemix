import { randomBytes } from "node:crypto";

import { NextResponse } from "next/server";

import { getPasswordResetBaseUrl } from "@/lib/auth/public-url";
import { buildPasswordResetEmail } from "@/lib/email/password-reset-mail";
import { sendEmail } from "@/lib/email/send-email";
import { apiError } from "@/lib/api-errors";
import { getClientIpFromHeaders } from "@/lib/client-ip";
import { rateLimit } from "@/lib/rate-limit";
import { rateLimitResponse } from "@/lib/rate-limit-response";
import { logStructured } from "@/lib/observability";
import { getPrisma } from "@/lib/prisma";
import { parseJsonBody } from "@/lib/validation/parse-json";
import { forgotPasswordBodySchema } from "@/lib/validation/password-reset";

export const dynamic = "force-dynamic";

const TOKEN_TTL_MS = 60 * 60 * 1000; // 1 h
const EXPIRES_MINUTES = Math.floor(TOKEN_TTL_MS / 60_000);

/** Solicitud de enlace por email para restablecer contraseña (respuesta uniforme por privacidad). */
export async function POST(req: Request) {
  const ip = getClientIpFromHeaders(req.headers);
  const rl = rateLimit(`auth_forgot:${ip}`, 5, 3_600_000);
  if (!rl.ok) {
    return rateLimitResponse(rl.retryAfterSec);
  }

  const parsed = await parseJsonBody(req, forgotPasswordBodySchema);
  if (!parsed.ok) return parsed.response;

  if (!process.env.DATABASE_URL?.trim()) {
    return apiError(
      503,
      "SERVICE_UNAVAILABLE",
      "Base de datos no configurada en el servidor.",
    );
  }

  const email = parsed.data.email.toLowerCase();

  const prisma = getPrisma();
  const user = await prisma.user.findUnique({
    where: { email },
    select: {
      id: true,
      email: true,
      passwordHash: true,
      bannedAt: true,
    },
  });

  const generic = NextResponse.json({
    ok: true,
    message:
      "Si hay una cuenta con ese correo, te enviamos un enlace para restablecer la contraseña.",
  });

  if (!user?.email || !user.passwordHash || user.bannedAt) {
    return generic;
  }

  await prisma.passwordResetToken.deleteMany({ where: { userId: user.id } });

  const token = randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + TOKEN_TTL_MS);

  await prisma.passwordResetToken.create({
    data: {
      userId: user.id,
      token,
      expiresAt,
    },
  });

  const base = getPasswordResetBaseUrl();
  const resetUrl = `${base}/auth/reset-password?token=${encodeURIComponent(token)}`;
  const { subject, html, text } = buildPasswordResetEmail({
    resetUrl,
    expiresMinutes: EXPIRES_MINUTES,
  });

  const sent = await sendEmail({
    to: user.email,
    subject,
    html,
    text,
  });

  if (!sent.sent) {
    logStructured("auth.password_reset_email_failed", {
      userId: user.id,
      error: sent.error,
    });
  } else {
    logStructured("auth.password_reset_requested", { userId: user.id });
  }

  return generic;
}
