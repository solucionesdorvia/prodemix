import { NextResponse } from "next/server";

import { auth } from "@/auth";
import { apiError } from "@/lib/api-errors";
import { getPrisma } from "@/lib/prisma";
import { requireAdminApi } from "@/lib/require-admin";
import { adminUserPatchSchema } from "@/lib/validation/admin-api";
import { parseJsonBody } from "@/lib/validation/parse-json";

export const dynamic = "force-dynamic";

export async function PATCH(
  req: Request,
  context: { params: Promise<{ id: string }> },
) {
  const denied = await requireAdminApi();
  if (denied) return denied;

  const { id } = await context.params;
  if (!id) return apiError(400, "INVALID_DATA", "Falta id.");

  const parsedBody = await parseJsonBody(req, adminUserPatchSchema);
  if (!parsedBody.ok) return parsedBody.response;

  const prisma = getPrisma();
  const session = await auth();
  const selfId = session?.user?.id;

  const data: {
    role?: string;
    bannedAt?: Date | null;
  } = {};

  if (parsedBody.data.role !== undefined) {
    if (parsedBody.data.role === "user" && id === selfId) {
      return apiError(403, "FORBIDDEN", "No podés quitarte el rol admin a vos mismo.");
    }
    data.role = parsedBody.data.role;
  }
  if (parsedBody.data.bannedAt !== undefined) {
    if (id === selfId && parsedBody.data.bannedAt !== null) {
      return apiError(403, "FORBIDDEN", "No podés suspender tu propia cuenta.");
    }
    data.bannedAt =
      parsedBody.data.bannedAt === null ?
        null
      : new Date(parsedBody.data.bannedAt);
  }

  if (Object.keys(data).length === 0) {
    return apiError(400, "INVALID_DATA", "Nada para actualizar.");
  }

  try {
    const user = await prisma.user.update({
      where: { id },
      data,
      select: {
        id: true,
        email: true,
        username: true,
        role: true,
        bannedAt: true,
      },
    });
    return NextResponse.json({ user });
  } catch {
    return apiError(404, "NOT_FOUND", "Usuario no encontrado.");
  }
}
