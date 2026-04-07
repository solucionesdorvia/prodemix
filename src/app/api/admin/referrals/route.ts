import { NextResponse } from "next/server";

import { getPrisma } from "@/lib/prisma";
import { requireAdminApi } from "@/lib/require-admin";

export const dynamic = "force-dynamic";

/** Ranking de usuarios por cantidad de referidos (referralCount). */
export async function GET(req: Request) {
  const denied = await requireAdminApi();
  if (denied) return denied;

  const url = new URL(req.url);
  const take = Math.min(200, Math.max(1, Number(url.searchParams.get("take")) || 100));

  const prisma = getPrisma();
  const [users, referralRowsCount] = await Promise.all([
    prisma.user.findMany({
      orderBy: [{ referralCount: "desc" }, { createdAt: "asc" }],
      take,
      select: {
        id: true,
        email: true,
        username: true,
        name: true,
        referralCode: true,
        referralCount: true,
        hasFreeEntry: true,
        bannedAt: true,
        createdAt: true,
      },
    }),
    prisma.referral.count(),
  ]);

  return NextResponse.json({
    users,
    /** Filas en tabla Referral (debería coincidir con la suma lógica de invitaciones). */
    referralRowsCount,
  });
}
