import { NextResponse } from "next/server";

import { logStructured } from "@/lib/observability";
import { apiError } from "@/lib/api-errors";
import { findProdeByIdOrSlug } from "@/lib/prode-resolve";
import { getPrisma } from "@/lib/prisma";
import { recalculateProdeLeaderboard } from "@/lib/ranking-compute";
import { requireAdminApi } from "@/lib/require-admin";

export const dynamic = "force-dynamic";

/** Recompute ranking for one prode (admin). */
export async function POST(req: Request) {
  const denied = await requireAdminApi();
  if (denied) return denied;

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return apiError(400, "INVALID_DATA", "Invalid JSON body.");
  }

  if (typeof body !== "object" || body === null) {
    return apiError(422, "INVALID_DATA", "Body must be an object.");
  }

  const prodeIdRaw = (body as Record<string, unknown>).prodeId;
  if (typeof prodeIdRaw !== "string" || !prodeIdRaw) {
    return apiError(422, "INVALID_DATA", "Expected string `prodeId`.");
  }

  const prisma = getPrisma();
  const prode = await findProdeByIdOrSlug(prisma, prodeIdRaw);
  if (!prode) {
    return apiError(404, "NOT_FOUND", "Prode not found.");
  }

  await recalculateProdeLeaderboard(prode.id);

  logStructured("admin.ranking_recalc", { prodeId: prode.id });

  return NextResponse.json({ ok: true, prodeId: prode.id });
}
