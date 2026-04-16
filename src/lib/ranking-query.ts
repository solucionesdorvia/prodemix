import type { NextResponse } from "next/server";

import { auth } from "@/auth";
import { apiError } from "@/lib/api-errors";
import { assertCanViewProde } from "@/lib/prode-access";
import { getPrisma } from "@/lib/prisma";
import {
  applyNamedPremioTopThreeOverlay,
  applyShowcaseLeaderboardOverlay,
  isNamedPremioTopThreeProde,
} from "@/lib/leaderboard-prode-display";
import { recalculateProdeLeaderboard } from "@/lib/ranking-compute";
import { findProdeByIdOrSlug } from "@/lib/prode-resolve";
import { prismaUserIncludedInRankings } from "@/lib/ranking-user-filter";

export type RankingApiRow = {
  rank: number | null;
  points: number;
  plenos: number;
  signHits: number;
  computedAt: Date;
  /** Fila solo visual (no es un usuario real); usado en exhibición de últimos prodes. */
  displayPlaceholder?: boolean;
  user: {
    id: string;
    name: string | null;
    username: string | null;
    image: string | null;
  };
};

/**
 * Ranking de un prode (filas materializadas). Respeta visibilidad del prode.
 */
export async function queryProdeRanking(
  prodeIdOrSlug: string,
): Promise<
  | { ok: true; prodeId: string; ranking: RankingApiRow[] }
  | { ok: false; response: NextResponse }
> {
  const prisma = getPrisma();
  const session = await auth();
  const userId = session?.user?.id ?? null;

  const prode = await findProdeByIdOrSlug(prisma, prodeIdOrSlug);
  if (!prode) {
    return { ok: false, response: apiError(404, "NOT_FOUND", "Prode not found.") };
  }

  const access = await assertCanViewProde(userId, prode);
  if (!access.ok) {
    return { ok: false, response: access.response };
  }

  /** Siempre al día con marcadores y pronósticos actuales (fixture en marcha). */
  await recalculateProdeLeaderboard(prode.id);

  const leaderboardQuery = {
    where: {
      prodeId: prode.id,
      user: prismaUserIncludedInRankings,
    },
    orderBy: [
      { rankPosition: "asc" as const },
      { points: "desc" as const },
      { plenos: "desc" as const },
      { signHits: "desc" as const },
    ],
    include: {
      user: {
        select: {
          id: true,
          name: true,
          username: true,
          image: true,
        },
      },
    },
  };

  const rows = await prisma.prodeLeaderboardEntry.findMany(leaderboardQuery);

  let ranking: RankingApiRow[] = rows.map((r) => ({
    rank: r.rankPosition,
    points: r.points,
    plenos: r.plenos,
    signHits: r.signHits,
    computedAt: r.computedAt,
    user: r.user,
  }));

  const lastThree = await prisma.prode.findMany({
    orderBy: { createdAt: "desc" },
    take: 3,
    select: { id: true },
  });
  const lastThreeIds = new Set(lastThree.map((p) => p.id));
  if (isNamedPremioTopThreeProde(prode.title, prode.slug)) {
    ranking = applyNamedPremioTopThreeOverlay(ranking);
  } else if (lastThreeIds.has(prode.id)) {
    ranking = applyShowcaseLeaderboardOverlay(ranking);
  }

  return { ok: true, prodeId: prode.id, ranking };
}

/**
 * Ranking global: suma de puntos / plenos / signos en todos los prodes públicos.
 */
export async function queryGlobalRanking(): Promise<RankingApiRow[]> {
  const prisma = getPrisma();

  const grouped = await prisma.prodeLeaderboardEntry.groupBy({
    by: ["userId"],
    _sum: {
      points: true,
      plenos: true,
      signHits: true,
    },
  });

  type Agg = {
    userId: string;
    points: number;
    plenos: number;
    signHits: number;
  };

  const aggs: Agg[] = grouped.map((g) => ({
    userId: g.userId,
    points: g._sum.points ?? 0,
    plenos: g._sum.plenos ?? 0,
    signHits: g._sum.signHits ?? 0,
  }));

  aggs.sort((a, b) => {
    if (b.points !== a.points) return b.points - a.points;
    if (b.plenos !== a.plenos) return b.plenos - a.plenos;
    if (b.signHits !== a.signHits) return b.signHits - a.signHits;
    return a.userId.localeCompare(b.userId);
  });

  const userIds = aggs.map((a) => a.userId);
  if (userIds.length === 0) return [];

  const users = await prisma.user.findMany({
    where: { id: { in: userIds }, ...prismaUserIncludedInRankings },
    select: { id: true, name: true, username: true, image: true },
  });
  const userMap = new Map(users.map((u) => [u.id, u]));
  const aggsVisible = aggs.filter((a) => userMap.has(a.userId));

  const now = new Date();
  let rank = 1;
  const ranking: RankingApiRow[] = [];
  for (let i = 0; i < aggsVisible.length; i++) {
    const cur = aggsVisible[i]!;
    if (i > 0) {
      const prev = aggsVisible[i - 1]!;
      if (
        prev.points !== cur.points ||
        prev.plenos !== cur.plenos ||
        prev.signHits !== cur.signHits
      ) {
        rank = i + 1;
      }
    }
    const u = userMap.get(cur.userId);
    if (!u) continue;
    ranking.push({
      rank,
      points: cur.points,
      plenos: cur.plenos,
      signHits: cur.signHits,
      computedAt: now,
      user: u,
    });
  }

  return ranking;
}
