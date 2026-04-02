import { NextResponse } from "next/server";

import { auth } from "@/auth";
import { apiError } from "@/lib/api-errors";
import { getPrisma } from "@/lib/prisma";
import { misProdeServerStatus } from "@/lib/mis-prode-server-status";
import { meProdesQuerySchema } from "@/lib/validation/prodes-api";
import { zodToApiError } from "@/lib/validation/zod-to-api";

export const dynamic = "force-dynamic";

/** Current user’s participations with stats for “Mis Prodes” UI. */
export async function GET(req: Request) {
  const url = new URL(req.url);
  const q = meProdesQuerySchema.safeParse({
    limit: url.searchParams.get("limit") ?? undefined,
  });
  if (!q.success) {
    return zodToApiError(q.error);
  }
  const { limit } = q.data;

  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) {
    return apiError(401, "UNAUTHORIZED", "Authentication required.");
  }

  const prisma = getPrisma();
  const entries = await prisma.prodeEntry.findMany({
    where: { userId, status: "JOINED" },
    orderBy: { createdAt: "desc" },
    take: limit,
    include: {
      prode: {
        select: {
          id: true,
          slug: true,
          title: true,
          type: true,
          status: true,
          seasonLabel: true,
          closesAt: true,
          entryFeeArs: true,
          tournaments: {
            take: 1,
            select: {
              tournament: {
                select: { name: true, slug: true },
              },
            },
          },
        },
      },
    },
  });

  const now = new Date();

  const prodes = await Promise.all(
    entries.map(async (e) => {
      const prodeId = e.prode.id;
      const [matchCount, predictionCount, leaderboard] = await Promise.all([
        prisma.prodeMatch.count({ where: { prodeId } }),
        prisma.prediction.count({ where: { userId, prodeId } }),
        prisma.prodeLeaderboardEntry.findUnique({
          where: {
            prodeId_userId: { prodeId, userId },
          },
          select: { points: true, rankPosition: true, plenos: true },
        }),
      ]);

      const pendingCount = Math.max(0, matchCount - predictionCount);
      const tournamentName =
        e.prode.tournaments[0]?.tournament.name ?? e.prode.title;
      const status = misProdeServerStatus(e.prode, matchCount, pendingCount, now);

      return {
        entryId: e.id,
        joinedAt: e.createdAt,
        prode: {
          id: e.prode.id,
          slug: e.prode.slug,
          title: e.prode.title,
          type: e.prode.type,
          status: e.prode.status,
          seasonLabel: e.prode.seasonLabel,
          closesAt: e.prode.closesAt,
          entryFeeArs: e.prode.entryFeeArs,
        },
        tournamentLabel: tournamentName,
        stats: {
          matchCount,
          predictionCount,
          pendingCount,
          points: leaderboard?.points ?? 0,
          rank: leaderboard?.rankPosition ?? null,
          plenos: leaderboard?.plenos ?? 0,
        },
        status,
      };
    }),
  );

  return NextResponse.json({ prodes });
}
