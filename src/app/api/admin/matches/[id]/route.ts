import { NextResponse } from "next/server";

import { apiError } from "@/lib/api-errors";
import { getPrisma } from "@/lib/prisma";
import { requireAdminApi } from "@/lib/require-admin";
import { adminMatchPatchSchema } from "@/lib/validation/admin-api";
import { parseJsonBody } from "@/lib/validation/parse-json";

export const dynamic = "force-dynamic";

export async function PATCH(
  req: Request,
  context: { params: Promise<{ id: string }> },
) {
  const denied = await requireAdminApi();
  if (denied) return denied;

  const { id } = await context.params;
  const parsed = await parseJsonBody(req, adminMatchPatchSchema);
  if (!parsed.ok) return parsed.response;

  const data = parsed.data;
  if (Object.keys(data).length === 0) {
    return apiError(422, "INVALID_DATA", "Sin cambios.");
  }

  const prisma = getPrisma();
  const m = await prisma.match.update({
    where: { id },
    data: {
      ...(data.startsAt !== undefined ?
        { startsAt: new Date(data.startsAt) }
      : {}),
      ...(data.status !== undefined ? { status: data.status } : {}),
      ...(data.homeScore !== undefined ? { homeScore: data.homeScore } : {}),
      ...(data.awayScore !== undefined ? { awayScore: data.awayScore } : {}),
    },
  });

  return NextResponse.json({ match: m });
}
