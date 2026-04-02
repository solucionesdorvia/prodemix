import { NextResponse } from "next/server";

import { apiError } from "@/lib/api-errors";
import { getPrisma } from "@/lib/prisma";
import { findProdeByIdOrSlug } from "@/lib/prode-resolve";
import { requireAdminApi } from "@/lib/require-admin";
import { adminProdePatchSchema } from "@/lib/validation/admin-api";
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

  const [tournaments, matchCount, entryCount] = await Promise.all([
    prisma.prodeTournament.findMany({
      where: { prodeId: prode.id },
      include: {
        tournament: {
          select: { id: true, slug: true, name: true, category: true },
        },
      },
    }),
    prisma.prodeMatch.count({ where: { prodeId: prode.id } }),
    prisma.prodeEntry.count({ where: { prodeId: prode.id, status: "JOINED" } }),
  ]);

  return NextResponse.json({
    prode: {
      id: prode.id,
      slug: prode.slug,
      title: prode.title,
      type: prode.type,
      seasonLabel: prode.seasonLabel,
      status: prode.status,
      visibility: prode.visibility,
      closesAt: prode.closesAt,
      startsAt: prode.startsAt,
      endsAt: prode.endsAt,
      prizeFirstArs: prode.prizeFirstArs,
      prizeSecondArs: prode.prizeSecondArs,
      prizeThirdArs: prode.prizeThirdArs,
      entryFeeArs: prode.entryFeeArs,
      inviteCode: prode.inviteCode,
      createdAt: prode.createdAt,
      updatedAt: prode.updatedAt,
    },
    tournaments: tournaments.map((x) => x.tournament),
    stats: { matchCount, entryCount },
  });
}

export async function PATCH(
  req: Request,
  context: { params: Promise<{ id: string }> },
) {
  const denied = await requireAdminApi();
  if (denied) return denied;

  const { id: rawId } = await context.params;
  const idParsed = prodeRouteIdSchema.safeParse(rawId);
  if (!idParsed.success) return zodToApiError(idParsed.error);

  const parsed = await parseJsonBody(req, adminProdePatchSchema);
  if (!parsed.ok) return parsed.response;
  if (Object.keys(parsed.data).length === 0) {
    return apiError(422, "INVALID_DATA", "Sin cambios.");
  }

  const prisma = getPrisma();
  const prode = await findProdeByIdOrSlug(prisma, idParsed.data);
  if (!prode) return apiError(404, "NOT_FOUND", "Prode no encontrado.");

  const d = parsed.data;
  if (d.slug !== undefined) {
    const clash = await prisma.prode.findFirst({
      where: { slug: d.slug, id: { not: prode.id } },
    });
    if (clash) {
      return apiError(409, "CONFLICT", "Ya existe otro prode con ese slug.");
    }
  }

  const prodeNew = await prisma.prode.update({
    where: { id: prode.id },
    data: {
      ...(d.title !== undefined ? { title: d.title } : {}),
      ...(d.slug !== undefined ? { slug: d.slug } : {}),
      ...(d.type !== undefined ? { type: d.type } : {}),
      ...(d.seasonLabel !== undefined ? { seasonLabel: d.seasonLabel } : {}),
      ...(d.closesAt !== undefined ? { closesAt: new Date(d.closesAt) } : {}),
      ...(d.startsAt !== undefined ?
        { startsAt: d.startsAt ? new Date(d.startsAt) : null }
      : {}),
      ...(d.endsAt !== undefined ?
        { endsAt: d.endsAt ? new Date(d.endsAt) : null }
      : {}),
      ...(d.prizeFirstArs !== undefined ? { prizeFirstArs: d.prizeFirstArs } : {}),
      ...(d.prizeSecondArs !== undefined ?
        { prizeSecondArs: d.prizeSecondArs }
      : {}),
      ...(d.prizeThirdArs !== undefined ? { prizeThirdArs: d.prizeThirdArs } : {}),
      ...(d.entryFeeArs !== undefined ? { entryFeeArs: d.entryFeeArs } : {}),
      ...(d.status !== undefined ? { status: d.status } : {}),
      ...(d.visibility !== undefined ? { visibility: d.visibility } : {}),
    },
  });

  return NextResponse.json({ prode: prodeNew });
}
