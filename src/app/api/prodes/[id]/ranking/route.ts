import { NextResponse } from "next/server";

import { queryProdeRanking } from "@/lib/ranking-query";
import { isRankingUnlocked } from "@/lib/ranking-visibility";
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

  const result = await queryProdeRanking(id);
  if (!result.ok) {
    return result.response;
  }

  const unlocked = await isRankingUnlocked();
  if (!unlocked) {
    return NextResponse.json({
      prodeId: result.prodeId,
      rankingLocked: true,
      ranking: [],
    });
  }

  return NextResponse.json({
    prodeId: result.prodeId,
    rankingLocked: false,
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
