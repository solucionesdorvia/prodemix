import { PrismaClientKnownRequestError } from "@prisma/client/runtime/client";
import { NextResponse } from "next/server";

import { auth } from "@/auth";
import { logStructured } from "@/lib/observability";
import { getPrisma } from "@/lib/prisma";
import { normalizeUsername, validateUsernameFormat } from "@/lib/username";

export async function PATCH(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "No autorizado." }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "JSON inválido." }, { status: 400 });
  }

  const usernameRaw =
    typeof body === "object" &&
    body !== null &&
    "username" in body &&
    typeof (body as { username: unknown }).username === "string" ?
      (body as { username: string }).username
    : "";

  const normalized = normalizeUsername(usernameRaw);
  const formatError = validateUsernameFormat(normalized);
  if (formatError) {
    return NextResponse.json({ error: formatError }, { status: 400 });
  }

  const prisma = getPrisma();

  const existing = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { username: true },
  });
  if (!existing) {
    return NextResponse.json(
      {
        error:
          "Tu sesión no coincide con la base de datos (p. ej. después de un reset). Cerrá sesión y volvé a entrar.",
      },
      { status: 401 },
    );
  }
  if (existing.username) {
    return NextResponse.json(
      { error: "El nombre de usuario ya está definido." },
      { status: 409 },
    );
  }

  const taken = await prisma.user.findFirst({
    where: { username: normalized },
    select: { id: true },
  });
  if (taken && taken.id !== session.user.id) {
    return NextResponse.json(
      { error: "Ese nombre ya está en uso." },
      { status: 409 },
    );
  }

  try {
    await prisma.user.update({
      where: { id: session.user.id },
      data: { username: normalized },
    });
  } catch (e) {
    if (e instanceof PrismaClientKnownRequestError) {
      if (e.code === "P2002") {
        return NextResponse.json(
          { error: "Ese nombre ya está en uso. Elegí otro." },
          { status: 409 },
        );
      }
      if (e.code === "P2025") {
        return NextResponse.json(
          {
            error:
              "No se encontró tu usuario. Cerrá sesión y volvé a entrar.",
          },
          { status: 401 },
        );
      }
    }
    logStructured("user.username_patch_failed", {
      message: e instanceof Error ? e.message : String(e),
    });
    return NextResponse.json(
      { error: "No se pudo guardar. Probá de nuevo en unos segundos." },
      { status: 503 },
    );
  }

  return NextResponse.json({ ok: true, username: normalized });
}
