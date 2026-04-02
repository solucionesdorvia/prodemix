import { NextResponse } from "next/server";

import { auth } from "@/auth";
import { assertCanViewProde } from "@/lib/prode-access";
import { apiError } from "@/lib/api-errors";
import { getPrisma } from "@/lib/prisma";
import { findProdeByIdOrSlug } from "@/lib/prode-resolve";
import { prodeRouteIdSchema } from "@/lib/validation/prodes-api";
import { zodToApiError } from "@/lib/validation/zod-to-api";

export const dynamic = "force-dynamic";

export async function GET(
  _req: Request,
  context: { params: Promise<{ id: string }> },
) {
  const { id: rawId } = await context.params;
  const idParsed = prodeRouteIdSchema.safeParse(rawId);
  if (!idParsed.success) {
    return zodToApiError(idParsed.error);
  }
  const id = idParsed.data;

  const prisma = getPrisma();
  const session = await auth();
  const userId = session?.user?.id ?? null;

  const prode = await findProdeByIdOrSlug(prisma, id);
  if (!prode) {
    return apiError(404, "NOT_FOUND", "Prode not found.");
  }

  const access = await assertCanViewProde(userId, prode);
  if (!access.ok) return access.response;

  return NextResponse.json({
    prode: {
      id: prode.id,
      slug: prode.slug,
      ownerId: prode.ownerId,
      title: prode.title,
      type: prode.type,
      seasonLabel: prode.seasonLabel,
      status: prode.status,
      visibility: prode.visibility,
      closesAt: prode.closesAt,
      startsAt: prode.startsAt,
      endsAt: prode.endsAt,
      entryFeeArs: prode.entryFeeArs,
      prizeFirstArs: prode.prizeFirstArs,
      prizeSecondArs: prode.prizeSecondArs,
      prizeThirdArs: prode.prizeThirdArs,
      inviteCode: prode.inviteCode,
      createdAt: prode.createdAt,
      updatedAt: prode.updatedAt,
    },
  });
}
