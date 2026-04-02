import { NextResponse } from "next/server";

import { getPrisma } from "@/lib/prisma";
import { prodesListQuerySchema } from "@/lib/validation/prodes-api";
import { zodToApiError } from "@/lib/validation/zod-to-api";

export const dynamic = "force-dynamic";

/** List public prodes (catalog). Query: `limit` (1–200, default 200). */
export async function GET(req: Request) {
  const url = new URL(req.url);
  const q = prodesListQuerySchema.safeParse({
    limit: url.searchParams.get("limit") ?? undefined,
  });
  if (!q.success) {
    return zodToApiError(q.error);
  }
  const { limit } = q.data;

  const prisma = getPrisma();
  const prodes = await prisma.prode.findMany({
    where: {
      visibility: "PUBLIC",
      status: { in: ["OPEN", "CLOSED", "FINALIZED"] },
    },
    orderBy: { closesAt: "asc" },
    take: limit,
    select: {
      id: true,
      slug: true,
      title: true,
      type: true,
      seasonLabel: true,
      status: true,
      closesAt: true,
      startsAt: true,
      endsAt: true,
      entryFeeArs: true,
      prizeFirstArs: true,
      prizeSecondArs: true,
      prizeThirdArs: true,
      createdAt: true,
    },
  });

  return NextResponse.json({ prodes });
}
