import { NextResponse } from "next/server";

import { apiError } from "@/lib/api-errors";
import { getPrisma } from "@/lib/prisma";
import { findProdeByIdOrSlug } from "@/lib/prode-resolve";
import { requireAdminApi } from "@/lib/require-admin";
import { prodeRouteIdSchema } from "@/lib/validation/prodes-api";
import { zodToApiError } from "@/lib/validation/zod-to-api";

export const dynamic = "force-dynamic";

/** Usuarios con entrada JOINED: pronósticos cargados vs partidos del prode. */
export async function GET(
  _req: Request,
  context: { params: Promise<{ id: string }> },
) {
  const denied = await requireAdminApi();
  if (denied) return denied;

  const { id: rawId } = await context.params;
  const idParsed = prodeRouteIdSchema.safeParse(rawId);
  if (!idParsed.success) return zodToApiError(idParsed.error);

  const prisma = getPrisma();
  const prode = await findProdeByIdOrSlug(prisma, idParsed.data);
  if (!prode) return apiError(404, "NOT_FOUND", "Prode no encontrado.");

  const matchCount = await prisma.prodeMatch.count({ where: { prodeId: prode.id } });

  const entries = await prisma.prodeEntry.findMany({
    where: { prodeId: prode.id, status: "JOINED" },
    orderBy: { createdAt: "desc" },
    include: {
      user: {
        select: { id: true, name: true, username: true, email: true },
      },
    },
  });

  const rows = await Promise.all(
    entries.map(async (e) => {
      const predictionCount = await prisma.prediction.count({
        where: { prodeId: prode.id, userId: e.userId },
      });
      const pendingCount = Math.max(0, matchCount - predictionCount);
      const predictionsComplete =
        matchCount === 0 || predictionCount >= matchCount;

      return {
        entryId: e.id,
        joinedAt: e.createdAt,
        user: e.user,
        predictionCount,
        matchCount,
        pendingCount,
        predictionsComplete,
      };
    }),
  );

  return NextResponse.json({ prodeId: prode.id, matchCount, participants: rows });
}
