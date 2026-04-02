import { NextResponse } from "next/server";

import { getPrisma } from "@/lib/prisma";
import { requireAdminApi } from "@/lib/require-admin";

export const dynamic = "force-dynamic";

/** Listado de usuarios con búsqueda simple por email o username. */
export async function GET(req: Request) {
  const denied = await requireAdminApi();
  if (denied) return denied;

  const url = new URL(req.url);
  const q = url.searchParams.get("q")?.trim();
  const take = Math.min(100, Math.max(1, Number(url.searchParams.get("take")) || 50));

  const prisma = getPrisma();
  const users = await prisma.user.findMany({
    where:
      q ?
        {
          OR: [
            { email: { contains: q, mode: "insensitive" } },
            { username: { contains: q, mode: "insensitive" } },
            { name: { contains: q, mode: "insensitive" } },
          ],
        }
      : undefined,
    orderBy: { createdAt: "desc" },
    take,
    select: {
      id: true,
      email: true,
      username: true,
      name: true,
      role: true,
      bannedAt: true,
      createdAt: true,
    },
  });

  return NextResponse.json({ users });
}
