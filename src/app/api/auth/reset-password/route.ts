import { NextResponse } from "next/server";

import { hashPassword } from "@/lib/auth/password";
import { apiError } from "@/lib/api-errors";
import { getClientIpFromHeaders } from "@/lib/client-ip";
import { rateLimit } from "@/lib/rate-limit";
import { rateLimitResponse } from "@/lib/rate-limit-response";
import { logStructured } from "@/lib/observability";
import { getPrisma } from "@/lib/prisma";
import { parseJsonBody } from "@/lib/validation/parse-json";
import { resetPasswordBodySchema } from "@/lib/validation/password-reset";

export const dynamic = "force-dynamic";

/** Restablece contraseña con token válido del correo. */
export async function POST(req: Request) {
  const ip = getClientIpFromHeaders(req.headers);
  const rl = rateLimit(`auth_reset:${ip}`, 15, 3_600_000);
  if (!rl.ok) {
    return rateLimitResponse(rl.retryAfterSec);
  }

  const parsed = await parseJsonBody(req, resetPasswordBodySchema);
  if (!parsed.ok) return parsed.response;

  if (!process.env.DATABASE_URL?.trim()) {
    return apiError(
      503,
      "SERVICE_UNAVAILABLE",
      "Base de datos no configurada en el servidor.",
    );
  }

  const { token, password } = parsed.data;

  const prisma = getPrisma();
  const row = await prisma.passwordResetToken.findUnique({
    where: { token },
    select: { id: true, userId: true, expiresAt: true },
  });

  if (!row || row.expiresAt < new Date()) {
    return apiError(
      400,
      "INVALID_DATA",
      "El enlace expiró o no es válido. Pedí uno nuevo desde «Olvidé mi contraseña».",
    );
  }

  const passwordHash = await hashPassword(password);

  await prisma.$transaction([
    prisma.user.update({
      where: { id: row.userId },
      data: { passwordHash },
    }),
    prisma.passwordResetToken.delete({ where: { id: row.id } }),
    prisma.session.deleteMany({ where: { userId: row.userId } }),
  ]);

  logStructured("auth.password_reset_completed", { userId: row.userId });

  return NextResponse.json({
    ok: true,
    message: "Contraseña actualizada. Podés iniciar sesión con la nueva.",
  });
}
