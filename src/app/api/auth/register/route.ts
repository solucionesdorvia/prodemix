import { PrismaClientKnownRequestError } from "@prisma/client/runtime/client";
import { NextResponse } from "next/server";

import { apiError } from "@/lib/api-errors";
import { hashPassword } from "@/lib/auth/password";
import { getClientIpFromHeaders } from "@/lib/client-ip";
import { rateLimit } from "@/lib/rate-limit";
import { rateLimitResponse } from "@/lib/rate-limit-response";
import { logStructured } from "@/lib/observability";
import { getPrisma } from "@/lib/prisma";
import { parseJsonBody } from "@/lib/validation/parse-json";
import { registerBodySchema } from "@/lib/validation/register";

export const dynamic = "force-dynamic";

/** Registro con email + contraseña (cuenta local). */
export async function POST(req: Request) {
  const ip = getClientIpFromHeaders(req.headers);
  const rl = rateLimit(`auth_register:${ip}`, 10, 3_600_000);
  if (!rl.ok) {
    return rateLimitResponse(rl.retryAfterSec);
  }

  const parsed = await parseJsonBody(req, registerBodySchema);
  if (!parsed.ok) return parsed.response;

  const email = parsed.data.email.toLowerCase();
  const password = parsed.data.password;

  if (!process.env.DATABASE_URL?.trim()) {
    return apiError(
      503,
      "SERVICE_UNAVAILABLE",
      "Base de datos no configurada en el servidor.",
    );
  }

  try {
    const prisma = getPrisma();
    const existing = await prisma.user.findUnique({
      where: { email },
      select: { id: true, passwordHash: true },
    });
    if (existing) {
      return apiError(
        409,
        "CONFLICT",
        "Ya existe una cuenta con ese correo. Iniciá sesión u otro método.",
      );
    }

    const passwordHash = await hashPassword(password);
    await prisma.user.create({
      data: {
        email,
        passwordHash,
        name: email.split("@")[0] ?? "Usuario",
      },
    });

    return NextResponse.json({ ok: true });
  } catch (e) {
    if (e instanceof PrismaClientKnownRequestError && e.code === "P2002") {
      return apiError(
        409,
        "CONFLICT",
        "Ya existe una cuenta con ese correo. Iniciá sesión u otro método.",
      );
    }
    const code =
      e instanceof PrismaClientKnownRequestError ? e.code : "unknown";
    logStructured("auth.register_failed", { prismaCode: code });
    return apiError(
      503,
      "SERVICE_UNAVAILABLE",
      "No se pudo crear la cuenta. Probá de nuevo en unos minutos.",
    );
  }
}
