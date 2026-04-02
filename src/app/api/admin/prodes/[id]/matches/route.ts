import { NextResponse } from "next/server";

import { apiError } from "@/lib/api-errors";
import { getPrisma } from "@/lib/prisma";
import { findProdeByIdOrSlug } from "@/lib/prode-resolve";
import { requireAdminApi } from "@/lib/require-admin";
import { adminProdeLinkMatchSchema } from "@/lib/validation/admin-api";
import { prodeRouteIdSchema } from "@/lib/validation/prodes-api";
import { parseJsonBody } from "@/lib/validation/parse-json";
import { zodToApiError } from "@/lib/validation/zod-to-api";

export const dynamic = "force-dynamic";

/** Partidos vinculados al prode (misma forma que `/api/prodes/[id]/matches`). */
export async function GET(
  _req: Request,
  context: { params: Promise<{ id: string }> },
) {
  const denied = await requireAdminApi();
  if (denied) return denied;

  const { id: rawId } = await context.params;
  const idParsed = prodeRouteIdSchema.safeParse(rawId);
  if (!idParsed.success) {
    return zodToApiError(idParsed.error);
  }
  const id = idParsed.data;

  const prisma = getPrisma();
  const prode = await findProdeByIdOrSlug(prisma, id);
  if (!prode) {
    return apiError(404, "NOT_FOUND", "Prode not found.");
  }

  const links = await prisma.prodeMatch.findMany({
    where: { prodeId: prode.id },
    select: { matchId: true },
  });
  const matchIds = links.map((l) => l.matchId);

  const matches = await prisma.match.findMany({
    where: { id: { in: matchIds } },
    orderBy: { startsAt: "asc" },
    include: {
      homeTeam: { select: { id: true, name: true, slug: true, logoUrl: true } },
      awayTeam: { select: { id: true, name: true, slug: true, logoUrl: true } },
      matchday: {
        select: {
          id: true,
          externalKey: true,
          name: true,
          roundNumber: true,
          closesAt: true,
        },
      },
    },
  });

  return NextResponse.json({
    prodeId: prode.id,
    matches: matches.map((m) => ({
      id: m.id,
      tournamentId: m.tournamentId,
      matchdayId: m.matchday.externalKey,
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

/** Vincular un partido del calendario al prode (torneo del partido debe estar vinculado al prode). */
export async function POST(
  req: Request,
  context: { params: Promise<{ id: string }> },
) {
  const denied = await requireAdminApi();
  if (denied) return denied;

  const { id: rawId } = await context.params;
  const idParsed = prodeRouteIdSchema.safeParse(rawId);
  if (!idParsed.success) return zodToApiError(idParsed.error);

  const parsed = await parseJsonBody(req, adminProdeLinkMatchSchema);
  if (!parsed.ok) return parsed.response;

  const prisma = getPrisma();
  const prode = await findProdeByIdOrSlug(prisma, idParsed.data);
  if (!prode) return apiError(404, "NOT_FOUND", "Prode no encontrado.");

  const match = await prisma.match.findUnique({
    where: { id: parsed.data.matchId },
    select: { id: true, tournamentId: true },
  });
  if (!match) return apiError(404, "NOT_FOUND", "Partido no encontrado.");

  const linked = await prisma.prodeTournament.findUnique({
    where: {
      prodeId_tournamentId: {
        prodeId: prode.id,
        tournamentId: match.tournamentId,
      },
    },
  });
  if (!linked) {
    return apiError(
      422,
      "INVALID_DATA",
      "Vinculá primero el torneo de este partido al prode (sección Torneo).",
    );
  }

  await prisma.prodeMatch.upsert({
    where: {
      prodeId_matchId: { prodeId: prode.id, matchId: match.id },
    },
    create: { prodeId: prode.id, matchId: match.id },
    update: {},
  });

  return NextResponse.json({ ok: true });
}

/** Quitar partido del prode (no borra el partido del torneo). */
export async function DELETE(
  req: Request,
  context: { params: Promise<{ id: string }> },
) {
  const denied = await requireAdminApi();
  if (denied) return denied;

  const { id: rawId } = await context.params;
  const idParsed = prodeRouteIdSchema.safeParse(rawId);
  if (!idParsed.success) return zodToApiError(idParsed.error);

  const url = new URL(req.url);
  const matchId = url.searchParams.get("matchId");
  if (!matchId) {
    return apiError(422, "INVALID_DATA", "Query `matchId` requerido.");
  }

  const prisma = getPrisma();
  const prode = await findProdeByIdOrSlug(prisma, idParsed.data);
  if (!prode) return apiError(404, "NOT_FOUND", "Prode no encontrado.");

  await prisma.prodeMatch.deleteMany({
    where: { prodeId: prode.id, matchId },
  });

  return NextResponse.json({ ok: true });
}
