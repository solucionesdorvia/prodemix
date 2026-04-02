import { NextResponse } from "next/server";

import { auth } from "@/auth";
import { apiError } from "@/lib/api-errors";
import { getPrisma } from "@/lib/prisma";
import { normalizeUsername, validateUsernameFormat } from "@/lib/username";
import { profilePatchBodySchema } from "@/lib/validation/profile-api";
import { zodToApiError } from "@/lib/validation/zod-to-api";

export const dynamic = "force-dynamic";

export async function GET() {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) {
    return apiError(401, "UNAUTHORIZED", "Authentication required.");
  }

  const prisma = getPrisma();
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      email: true,
      name: true,
      username: true,
      image: true,
      role: true,
      createdAt: true,
      notificationPreference: true,
    },
  });

  if (!user) {
    return apiError(404, "NOT_FOUND", "User not found.");
  }

  return NextResponse.json({
    profile: {
      id: user.id,
      email: user.email,
      name: user.name,
      username: user.username,
      image: user.image,
      role: user.role,
      createdAt: user.createdAt.toISOString(),
      notificationPreferences:
        user.notificationPreference ?
          {
            remindersEnabled: user.notificationPreference.remindersEnabled,
            closingAlertEnabled: user.notificationPreference.closingAlertEnabled,
          }
        : {
            remindersEnabled: true,
            closingAlertEnabled: true,
          },
    },
  });
}

export async function PATCH(req: Request) {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) {
    return apiError(401, "UNAUTHORIZED", "Authentication required.");
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return apiError(400, "INVALID_DATA", "Invalid JSON body.");
  }

  const parsed = profilePatchBodySchema.safeParse(body);
  if (!parsed.success) {
    return zodToApiError(parsed.error);
  }

  const o = parsed.data;
  const prisma = getPrisma();

  const data: {
    name?: string | null;
    image?: string | null;
    username?: string;
  } = {};

  if (o.name !== undefined) {
    data.name = o.name;
  }

  if (o.username !== undefined) {
    const normalized = normalizeUsername(o.username);
    const fmtErr = validateUsernameFormat(normalized);
    if (fmtErr) {
      return apiError(422, "INVALID_DATA", fmtErr);
    }
    const taken = await prisma.user.findFirst({
      where: { username: normalized, NOT: { id: userId } },
      select: { id: true },
    });
    if (taken) {
      return apiError(
        409,
        "CONFLICT",
        "Ese nombre de usuario ya está en uso.",
      );
    }
    data.username = normalized;
  }

  if (o.image !== undefined) {
    if (o.image === null) {
      data.image = null;
    } else {
      try {
        const url = new URL(o.image);
        if (url.protocol !== "http:" && url.protocol !== "https:") {
          return apiError(
            422,
            "INVALID_DATA",
            "La imagen debe ser una URL http o https.",
          );
        }
      } catch {
        return apiError(422, "INVALID_DATA", "URL de imagen inválida.");
      }
      data.image = o.image;
    }
  }

  if (o.notificationPreferences !== undefined) {
    await prisma.notificationPreference.upsert({
      where: { userId },
      create: {
        userId,
        remindersEnabled: o.notificationPreferences.remindersEnabled,
        closingAlertEnabled: o.notificationPreferences.closingAlertEnabled,
      },
      update: {
        remindersEnabled: o.notificationPreferences.remindersEnabled,
        closingAlertEnabled: o.notificationPreferences.closingAlertEnabled,
      },
    });
  }

  if (Object.keys(data).length > 0) {
    await prisma.user.update({
      where: { id: userId },
      data,
    });
  }

  return NextResponse.json({ ok: true });
}
