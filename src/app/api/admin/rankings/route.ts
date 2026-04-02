import { NextResponse } from "next/server";

import { apiError } from "@/lib/api-errors";
import { getPrisma } from "@/lib/prisma";
import { findProdeByIdOrSlug } from "@/lib/prode-resolve";
import { requireAdminApi } from "@/lib/require-admin";

export const dynamic = "force-dynamic";

/** Ranking materializado de un prode (admin, sin restricción de visibilidad). */
export async function GET(req: Request) {
  const denied = await requireAdminApi();
  if (denied) return denied;

  const url = new URL(req.url);
  const prodeIdRaw = url.searchParams.get("prodeId")?.trim();
  if (!prodeIdRaw) {
    return apiError(422, "INVALID_DATA", "Query `prodeId` requerido.");
  }

  const prisma = getPrisma();
  const prode = await findProdeByIdOrSlug(prisma, prodeIdRaw);
  if (!prode) return apiError(404, "NOT_FOUND", "Prode no encontrado.");

  const rows = await prisma.prodeLeaderboardEntry.findMany({
    where: { prodeId: prode.id },
    orderBy: [
      { rankPosition: "asc" },
      { points: "desc" },
      { plenos: "desc" },
      { signHits: "desc" },
    ],
    include: {
      user: {
        select: {
          id: true,
          email: true,
          name: true,
          username: true,
        },
      },
    },
  });

  return NextResponse.json({
    prode: {
      id: prode.id,
      slug: prode.slug,
      title: prode.title,
    },
    ranking: rows.map((r) => ({
      rank: r.rankPosition,
      points: r.points,
      plenos: r.plenos,
      signHits: r.signHits,
      computedAt: r.computedAt,
      user: r.user,
    })),
  });
}
