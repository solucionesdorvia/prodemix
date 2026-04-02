import { NextResponse } from "next/server";

import { apiError } from "@/lib/api-errors";
import { getPrisma } from "@/lib/prisma";
import { requireAdminApi } from "@/lib/require-admin";
import { adminMatchdayCreateSchema } from "@/lib/validation/admin-api";
import { parseJsonBody } from "@/lib/validation/parse-json";

export const dynamic = "force-dynamic";

export async function GET(
  _req: Request,
  context: { params: Promise<{ id: string }> },
) {
  const denied = await requireAdminApi();
  if (denied) return denied;

  const { id: tournamentId } = await context.params;
  const prisma = getPrisma();
  const t = await prisma.tournament.findUnique({
    where: { id: tournamentId },
    select: { id: true },
  });
  if (!t) return apiError(404, "NOT_FOUND", "Torneo no encontrado.");

  const matchdays = await prisma.matchday.findMany({
    where: { tournamentId },
    orderBy: { roundNumber: "asc" },
  });

  return NextResponse.json({ matchdays });
}

export async function POST(
  req: Request,
  context: { params: Promise<{ id: string }> },
) {
  const denied = await requireAdminApi();
  if (denied) return denied;

  const { id: tournamentId } = await context.params;
  const parsed = await parseJsonBody(req, adminMatchdayCreateSchema);
  if (!parsed.ok) return parsed.response;

  const prisma = getPrisma();
  const t = await prisma.tournament.findUnique({
    where: { id: tournamentId },
    select: { id: true },
  });
  if (!t) return apiError(404, "NOT_FOUND", "Torneo no encontrado.");

  const keyTaken = await prisma.matchday.findUnique({
    where: { externalKey: parsed.data.externalKey },
  });
  if (keyTaken) {
    return apiError(409, "CONFLICT", "Ya existe una fecha con ese externalKey.");
  }

  const md = await prisma.matchday.create({
    data: {
      tournamentId,
      externalKey: parsed.data.externalKey,
      name: parsed.data.name,
      roundNumber: parsed.data.roundNumber,
      startsAt: new Date(parsed.data.startsAt),
      closesAt: new Date(parsed.data.closesAt),
    },
  });

  return NextResponse.json({ matchday: md });
}
