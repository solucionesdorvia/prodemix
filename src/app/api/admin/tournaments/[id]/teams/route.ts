import { NextResponse } from "next/server";

import { apiError } from "@/lib/api-errors";
import { slugify } from "@/lib/admin/slug";
import { getPrisma } from "@/lib/prisma";
import { requireAdminApi } from "@/lib/require-admin";
import { adminTeamCreateSchema } from "@/lib/validation/admin-api";
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

  const teams = await prisma.team.findMany({
    where: { tournamentId },
    orderBy: { name: "asc" },
  });

  return NextResponse.json({ teams });
}

export async function POST(
  req: Request,
  context: { params: Promise<{ id: string }> },
) {
  const denied = await requireAdminApi();
  if (denied) return denied;

  const { id: tournamentId } = await context.params;
  const parsed = await parseJsonBody(req, adminTeamCreateSchema);
  if (!parsed.ok) return parsed.response;

  const prisma = getPrisma();
  const t = await prisma.tournament.findUnique({
    where: { id: tournamentId },
    select: { id: true },
  });
  if (!t) return apiError(404, "NOT_FOUND", "Torneo no encontrado.");

  const slug = parsed.data.slug ?? slugify(parsed.data.name);
  const clash = await prisma.team.findFirst({
    where: { tournamentId, slug },
  });
  if (clash) {
    return apiError(409, "CONFLICT", "Ya existe un equipo con ese slug en el torneo.");
  }

  const team = await prisma.team.create({
    data: {
      tournamentId,
      name: parsed.data.name,
      slug,
      logoUrl: parsed.data.logoUrl ?? null,
    },
  });

  return NextResponse.json({ team });
}
