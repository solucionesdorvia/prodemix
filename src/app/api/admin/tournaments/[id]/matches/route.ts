import { NextResponse } from "next/server";

import { apiError } from "@/lib/api-errors";
import { getPrisma } from "@/lib/prisma";
import { requireAdminApi } from "@/lib/require-admin";
import { adminMatchCreateSchema } from "@/lib/validation/admin-api";
import { parseJsonBody } from "@/lib/validation/parse-json";

export const dynamic = "force-dynamic";

export async function GET(
  req: Request,
  context: { params: Promise<{ id: string }> },
) {
  const denied = await requireAdminApi();
  if (denied) return denied;

  const { id: tournamentId } = await context.params;
  const url = new URL(req.url);
  const matchdayId = url.searchParams.get("matchdayId");

  const prisma = getPrisma();
  const t = await prisma.tournament.findUnique({
    where: { id: tournamentId },
    select: { id: true },
  });
  if (!t) return apiError(404, "NOT_FOUND", "Torneo no encontrado.");

  const matches = await prisma.match.findMany({
    where: {
      tournamentId,
      ...(matchdayId ? { matchdayId } : {}),
    },
    orderBy: { startsAt: "asc" },
    include: {
      homeTeam: { select: { id: true, name: true, slug: true } },
      awayTeam: { select: { id: true, name: true, slug: true } },
      matchday: { select: { id: true, externalKey: true, name: true } },
    },
    take: 500,
  });

  return NextResponse.json({
    matches: matches.map((m) => ({
      id: m.id,
      tournamentId: m.tournamentId,
      matchdayId: m.matchdayId,
      startsAt: m.startsAt,
      status: m.status,
      homeScore: m.homeScore,
      awayScore: m.awayScore,
      homeTeam: m.homeTeam,
      awayTeam: m.awayTeam,
      matchday: m.matchday,
    })),
  });
}

export async function POST(
  req: Request,
  context: { params: Promise<{ id: string }> },
) {
  const denied = await requireAdminApi();
  if (denied) return denied;

  const { id: tournamentId } = await context.params;
  const parsed = await parseJsonBody(req, adminMatchCreateSchema);
  if (!parsed.ok) return parsed.response;

  const prisma = getPrisma();

  const md = await prisma.matchday.findFirst({
    where: { id: parsed.data.matchdayId, tournamentId },
  });
  if (!md) {
    return apiError(422, "INVALID_DATA", "La fecha no pertenece a este torneo.");
  }

  const [home, away] = await Promise.all([
    prisma.team.findFirst({
      where: { id: parsed.data.homeTeamId, tournamentId },
    }),
    prisma.team.findFirst({
      where: { id: parsed.data.awayTeamId, tournamentId },
    }),
  ]);
  if (!home || !away) {
    return apiError(422, "INVALID_DATA", "Equipos inválidos para este torneo.");
  }
  if (home.id === away.id) {
    return apiError(422, "INVALID_DATA", "Local y visitante deben ser distintos.");
  }

  const m = await prisma.match.create({
    data: {
      tournamentId,
      matchdayId: md.id,
      homeTeamId: home.id,
      awayTeamId: away.id,
      startsAt: new Date(parsed.data.startsAt),
      prodeId: null,
    },
    include: {
      homeTeam: { select: { id: true, name: true, slug: true } },
      awayTeam: { select: { id: true, name: true, slug: true } },
      matchday: { select: { id: true, externalKey: true, name: true } },
    },
  });

  return NextResponse.json({
    match: {
      id: m.id,
      tournamentId: m.tournamentId,
      matchdayId: m.matchdayId,
      startsAt: m.startsAt,
      status: m.status,
      homeScore: m.homeScore,
      awayScore: m.awayScore,
      homeTeam: m.homeTeam,
      awayTeam: m.awayTeam,
      matchday: m.matchday,
    },
  });
}
