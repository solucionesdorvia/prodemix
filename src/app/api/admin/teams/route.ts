import { NextResponse } from "next/server";

import { getPrisma } from "@/lib/prisma";
import { requireAdminApi } from "@/lib/require-admin";

export const dynamic = "force-dynamic";

/** Equipos (filtro opcional por torneo). */
export async function GET(req: Request) {
  const denied = await requireAdminApi();
  if (denied) return denied;

  const url = new URL(req.url);
  const tournamentId = url.searchParams.get("tournamentId")?.trim();

  const prisma = getPrisma();
  const teams = await prisma.team.findMany({
    where: tournamentId ? { tournamentId } : undefined,
    orderBy: [{ tournamentId: "asc" }, { name: "asc" }],
    take: 500,
    include: {
      tournament: { select: { id: true, name: true, slug: true } },
    },
  });

  return NextResponse.json({ teams });
}
