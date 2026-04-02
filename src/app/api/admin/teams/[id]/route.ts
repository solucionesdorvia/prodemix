import { NextResponse } from "next/server";

import { apiError } from "@/lib/api-errors";
import { getPrisma } from "@/lib/prisma";
import { requireAdminApi } from "@/lib/require-admin";
import { adminTeamPatchSchema } from "@/lib/validation/admin-api";
import { parseJsonBody } from "@/lib/validation/parse-json";

export const dynamic = "force-dynamic";

export async function PATCH(
  req: Request,
  context: { params: Promise<{ id: string }> },
) {
  const denied = await requireAdminApi();
  if (denied) return denied;

  const { id } = await context.params;
  const parsed = await parseJsonBody(req, adminTeamPatchSchema);
  if (!parsed.ok) return parsed.response;

  const prisma = getPrisma();
  const team = await prisma.team.update({
    where: { id },
    data: parsed.data,
  });

  return NextResponse.json({ team });
}

export async function DELETE(
  _req: Request,
  context: { params: Promise<{ id: string }> },
) {
  const denied = await requireAdminApi();
  if (denied) return denied;

  const { id } = await context.params;
  const prisma = getPrisma();

  const refs = await prisma.match.count({
    where: { OR: [{ homeTeamId: id }, { awayTeamId: id }] },
  });
  if (refs > 0) {
    return apiError(
      409,
      "CONFLICT",
      "No se puede borrar: el equipo está en partidos.",
    );
  }

  await prisma.team.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
