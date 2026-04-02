import { NextResponse } from "next/server";

import { apiError } from "@/lib/api-errors";
import { getPrisma } from "@/lib/prisma";
import { requireAdminApi } from "@/lib/require-admin";
import { adminTournamentCreateSchema } from "@/lib/validation/admin-api";
import { parseJsonBody } from "@/lib/validation/parse-json";

export const dynamic = "force-dynamic";

export async function GET() {
  const denied = await requireAdminApi();
  if (denied) return denied;

  const prisma = getPrisma();
  const tournaments = await prisma.tournament.findMany({
    orderBy: { name: "asc" },
    take: 500,
    select: {
      id: true,
      slug: true,
      name: true,
      category: true,
      isActive: true,
      updatedAt: true,
      _count: { select: { teams: true, matchdays: true, matches: true } },
    },
  });

  return NextResponse.json({ tournaments });
}

export async function POST(req: Request) {
  const denied = await requireAdminApi();
  if (denied) return denied;

  const parsed = await parseJsonBody(req, adminTournamentCreateSchema);
  if (!parsed.ok) return parsed.response;

  const prisma = getPrisma();
  const existing = await prisma.tournament.findUnique({
    where: { slug: parsed.data.slug },
  });
  if (existing) {
    return apiError(409, "CONFLICT", "Ya existe un torneo con ese slug.");
  }

  const t = await prisma.tournament.create({
    data: {
      slug: parsed.data.slug,
      name: parsed.data.name,
      category: parsed.data.category ?? "liga",
      isActive: parsed.data.isActive ?? true,
    },
  });

  return NextResponse.json({ tournament: t });
}
