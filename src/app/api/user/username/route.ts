import { NextResponse } from "next/server";

import { auth } from "@/auth";
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
  if (existing?.username) {
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
  } catch {
    return NextResponse.json(
      { error: "No se pudo guardar. Probá otro nombre." },
      { status: 409 },
    );
  }

  return NextResponse.json({ ok: true, username: normalized });
}
