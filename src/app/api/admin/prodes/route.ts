import { NextResponse } from "next/server";

import { slugify } from "@/lib/admin/slug";
import { apiError } from "@/lib/api-errors";
import { getPrisma } from "@/lib/prisma";
import { requireAdminApi } from "@/lib/require-admin";
import { adminProdeCreateSchema } from "@/lib/validation/admin-api";
import { parseJsonBody } from "@/lib/validation/parse-json";

export const dynamic = "force-dynamic";

/** List prodes (admin). */
export async function GET() {
  const denied = await requireAdminApi();
  if (denied) return denied;

  const prisma = getPrisma();
  const prodes = await prisma.prode.findMany({
    orderBy: { updatedAt: "desc" },
    take: 300,
    select: {
      id: true,
      slug: true,
      title: true,
      type: true,
      status: true,
      seasonLabel: true,
      closesAt: true,
      updatedAt: true,
      _count: {
        select: { prodeMatches: true, entries: true },
      },
    },
  });

  return NextResponse.json({ prodes });
}

/** Crear prode (y opcionalmente vincular un torneo). */
export async function POST(req: Request) {
  const denied = await requireAdminApi();
  if (denied) return denied;

  const parsed = await parseJsonBody(req, adminProdeCreateSchema);
  if (!parsed.ok) return parsed.response;
  const d = parsed.data;

  const prisma = getPrisma();
  const baseSlug = d.slug ?? slugify(d.title);
  let slug = baseSlug;
  let n = 0;
  while (await prisma.prode.findUnique({ where: { slug } })) {
    n += 1;
    slug = `${baseSlug}-${n}`;
  }

  if (d.tournamentId) {
    const t = await prisma.tournament.findUnique({
      where: { id: d.tournamentId },
      select: { id: true },
    });
    if (!t) {
      return apiError(422, "INVALID_DATA", "Torneo no encontrado.");
    }
  }

  const prode = await prisma.prode.create({
    data: {
      slug,
      title: d.title,
      type: d.type,
      seasonLabel: d.seasonLabel ?? null,
      closesAt: new Date(d.closesAt),
      startsAt: d.startsAt ? new Date(d.startsAt) : null,
      endsAt: d.endsAt ? new Date(d.endsAt) : null,
      prizeFirstArs: d.prizeFirstArs ?? null,
      prizeSecondArs: d.prizeSecondArs ?? null,
      prizeThirdArs: d.prizeThirdArs ?? null,
      entryFeeArs: d.entryFeeArs ?? 0,
      status: d.status,
      visibility: d.visibility,
    },
  });

  if (d.tournamentId) {
    await prisma.prodeTournament.create({
      data: { prodeId: prode.id, tournamentId: d.tournamentId },
    });
  }

  return NextResponse.json({ prode });
}
