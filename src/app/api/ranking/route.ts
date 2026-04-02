import { NextResponse } from "next/server";

import { queryGlobalRanking, queryProdeRanking } from "@/lib/ranking-query";

export const dynamic = "force-dynamic";

/**
 * Ranking global (suma de tablas por prode) o de un prode (`prodeId` = id o slug).
 * `GET /api/ranking` · `GET /api/ranking?prodeId=...`
 */
export async function GET(req: Request) {
  const url = new URL(req.url);
  const prodeIdOrSlug = url.searchParams.get("prodeId");

  if (prodeIdOrSlug) {
    const result = await queryProdeRanking(prodeIdOrSlug);
    if (!result.ok) {
      return result.response;
    }
    return NextResponse.json({
      scope: "prode" as const,
      prodeId: result.prodeId,
      ranking: result.ranking.map((r) => ({
        rank: r.rank,
        points: r.points,
        plenos: r.plenos,
        signHits: r.signHits,
        computedAt: r.computedAt,
        user: r.user,
      })),
    });
  }

  const ranking = await queryGlobalRanking();
  return NextResponse.json({
    scope: "global" as const,
    ranking: ranking.map((r) => ({
      rank: r.rank,
      points: r.points,
      plenos: r.plenos,
      signHits: r.signHits,
      computedAt: r.computedAt,
      user: r.user,
    })),
  });
}
