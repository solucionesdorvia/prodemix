import {
  PrismaClientInitializationError,
  PrismaClientKnownRequestError,
} from "@prisma/client/runtime/client";
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

function sanitizeForLog(msg: string): string {
  return msg.replace(/postgres(ql)?:\/\/[^\s"'`]+/gi, "[db_url]");
}

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

    if (e instanceof PrismaClientKnownRequestError) {
      const { code } = e;
      if (code === "P2021" || code === "P2022") {
        logStructured("auth.register_failed", {
          prismaCode: code,
          meta: e.meta,
        });
        return apiError(
          503,
          "SERVICE_UNAVAILABLE",
          "No se pudo acceder al esquema de usuarios en la base de datos. Reiniciá el servicio en Railway (las migraciones se aplican al arrancar) o verificá que DATABASE_URL sea la misma base que en Neon.",
        );
      }
      if (code === "P1001" || code === "P1017" || code === "P1000") {
        logStructured("auth.register_failed", { prismaCode: code });
        return apiError(
          503,
          "SERVICE_UNAVAILABLE",
          "No pudimos conectar con la base de datos. Revisá DATABASE_URL y que Neon esté accesible.",
        );
      }
      logStructured("auth.register_failed", { prismaCode: code });
    } else if (e instanceof PrismaClientInitializationError) {
      logStructured("auth.register_failed", {
        kind: "init",
        message: sanitizeForLog(e.message),
      });
      return apiError(
        503,
        "SERVICE_UNAVAILABLE",
        "No pudimos conectar con la base de datos. Revisá DATABASE_URL en el servidor (Neon activo y URL con sslmode=require).",
      );
    } else {
      const msg = e instanceof Error ? sanitizeForLog(e.message) : "unknown";
      const name = e instanceof Error ? e.name : typeof e;
      logStructured("auth.register_failed", { kind: "other", name, message: msg });
    }

    return apiError(
      503,
      "SERVICE_UNAVAILABLE",
      "No se pudo crear la cuenta. Probá de nuevo en unos minutos.",
    );
  }
}
