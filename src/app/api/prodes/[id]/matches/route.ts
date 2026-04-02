import { NextResponse } from "next/server";

import { auth } from "@/auth";
import { assertCanViewProde } from "@/lib/prode-access";
import { apiError } from "@/lib/api-errors";
import { getPrisma } from "@/lib/prisma";
import { findProdeByIdOrSlug } from "@/lib/prode-resolve";
import { prodeRouteIdSchema } from "@/lib/validation/prodes-api";
import { zodToApiError } from "@/lib/validation/zod-to-api";

export const dynamic = "force-dynamic";

export async function GET(
  _req: Request,
  context: { params: Promise<{ id: string }> },
) {
  const { id: rawId } = await context.params;
  const idParsed = prodeRouteIdSchema.safeParse(rawId);
  if (!idParsed.success) {
    return zodToApiError(idParsed.error);
  }
  const id = idParsed.data;

  const prisma = getPrisma();
  const session = await auth();
  const userId = session?.user?.id ?? null;

  const prode = await findProdeByIdOrSlug(prisma, id);
  if (!prode) {
    return apiError(404, "NOT_FOUND", "Prode not found.");
  }

  const access = await assertCanViewProde(userId, prode);
  if (!access.ok) return access.response;

  const links = await prisma.prodeMatch.findMany({
    where: { prodeId: prode.id },
    select: { matchId: true },
  });
  const matchIds = links.map((l) => l.matchId);

  const matches = await prisma.match.findMany({
    where: { id: { in: matchIds } },
    orderBy: { startsAt: "asc" },
    include: {
      homeTeam: { select: { id: true, name: true, slug: true, logoUrl: true } },
      awayTeam: { select: { id: true, name: true, slug: true, logoUrl: true } },
      matchday: {
        select: {
          id: true,
          externalKey: true,
          name: true,
          roundNumber: true,
          closesAt: true,
        },
      },
    },
  });

  return NextResponse.json({
    matches: matches.map((m) => ({
      id: m.id,
      tournamentId: m.tournamentId,
      matchdayId: m.matchday.externalKey,
      startsAt: m.startsAt,
      status: m.status,
      homeScore: m.homeScore,
      awayScore: m.awayScore,
      homeTeam: m.homeTeam,
      awayTeam: m.awayTeam,
      matchday: m.matchday,
    })),
  });
}
