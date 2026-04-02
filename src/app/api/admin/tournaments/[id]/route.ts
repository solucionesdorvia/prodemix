import { NextResponse } from "next/server";

import { apiError } from "@/lib/api-errors";
import { getPrisma } from "@/lib/prisma";
import { requireAdminApi } from "@/lib/require-admin";
import { adminTournamentPatchSchema } from "@/lib/validation/admin-api";
import { parseJsonBody } from "@/lib/validation/parse-json";

export const dynamic = "force-dynamic";

export async function GET(
  _req: Request,
  context: { params: Promise<{ id: string }> },
) {
  const denied = await requireAdminApi();
  if (denied) return denied;

  const { id } = await context.params;
  const prisma = getPrisma();
  const t = await prisma.tournament.findUnique({
    where: { id },
    include: {
      _count: { select: { teams: true, matchdays: true, matches: true } },
    },
  });
  if (!t) return apiError(404, "NOT_FOUND", "Torneo no encontrado.");

  return NextResponse.json({ tournament: t });
}

export async function PATCH(
  req: Request,
  context: { params: Promise<{ id: string }> },
) {
  const denied = await requireAdminApi();
  if (denied) return denied;

  const { id } = await context.params;
  const parsed = await parseJsonBody(req, adminTournamentPatchSchema);
  if (!parsed.ok) return parsed.response;
  if (Object.keys(parsed.data).length === 0) {
    return apiError(422, "INVALID_DATA", "Sin cambios.");
  }

  const prisma = getPrisma();
  const t = await prisma.tournament.update({
    where: { id },
    data: parsed.data,
  });

  return NextResponse.json({ tournament: t });
}
