import { NextResponse } from "next/server";

import { getPrisma } from "@/lib/prisma";
import { requireAdminApi } from "@/lib/require-admin";

export const dynamic = "force-dynamic";

/** Listado de partidos (filtro opcional por torneo). */
export async function GET(req: Request) {
  const denied = await requireAdminApi();
  if (denied) return denied;

  const url = new URL(req.url);
  const tournamentId = url.searchParams.get("tournamentId")?.trim();
  const take = Math.min(200, Math.max(1, Number(url.searchParams.get("take")) || 80));

  const prisma = getPrisma();
  const matches = await prisma.match.findMany({
    where: tournamentId ? { tournamentId } : undefined,
    orderBy: { startsAt: "desc" },
    take,
    include: {
      homeTeam: { select: { id: true, name: true, slug: true } },
      awayTeam: { select: { id: true, name: true, slug: true } },
      tournament: { select: { id: true, name: true, slug: true } },
      matchday: { select: { id: true, name: true, externalKey: true } },
    },
  });

  return NextResponse.json({ matches });
}
