import { NextResponse } from "next/server";

import { apiError } from "@/lib/api-errors";
import { getPrisma } from "@/lib/prisma";
import { findProdeByIdOrSlug } from "@/lib/prode-resolve";
import { requireAdminApi } from "@/lib/require-admin";
import { adminProdeLinkTournamentSchema } from "@/lib/validation/admin-api";
import { prodeRouteIdSchema } from "@/lib/validation/prodes-api";
import { parseJsonBody } from "@/lib/validation/parse-json";
import { zodToApiError } from "@/lib/validation/zod-to-api";

export const dynamic = "force-dynamic";

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

  const links = await prisma.prodeTournament.findMany({
    where: { prodeId: prode.id },
    include: {
      tournament: {
        select: { id: true, slug: true, name: true, category: true },
      },
    },
  });

  return NextResponse.json({
    tournaments: links.map((l) => l.tournament),
  });
}

export async function POST(
  req: Request,
  context: { params: Promise<{ id: string }> },
) {
  const denied = await requireAdminApi();
  if (denied) return denied;

  const { id: rawId } = await context.params;
  const idParsed = prodeRouteIdSchema.safeParse(rawId);
  if (!idParsed.success) return zodToApiError(idParsed.error);

  const parsed = await parseJsonBody(req, adminProdeLinkTournamentSchema);
  if (!parsed.ok) return parsed.response;

  const prisma = getPrisma();
  const prode = await findProdeByIdOrSlug(prisma, idParsed.data);
  if (!prode) return apiError(404, "NOT_FOUND", "Prode no encontrado.");

  const t = await prisma.tournament.findUnique({
    where: { id: parsed.data.tournamentId },
    select: { id: true },
  });
  if (!t) return apiError(404, "NOT_FOUND", "Torneo no encontrado.");

  await prisma.prodeTournament.upsert({
    where: {
      prodeId_tournamentId: {
        prodeId: prode.id,
        tournamentId: parsed.data.tournamentId,
      },
    },
    create: {
      prodeId: prode.id,
      tournamentId: parsed.data.tournamentId,
    },
    update: {},
  });

  return NextResponse.json({ ok: true });
}
