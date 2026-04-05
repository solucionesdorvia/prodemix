import { NextResponse } from "next/server";

import { auth } from "@/auth";
import { apiError } from "@/lib/api-errors";
import { assertCanViewProde } from "@/lib/prode-access";
import { getPrisma } from "@/lib/prisma";
import { recalculateProdeLeaderboard } from "@/lib/ranking-compute";
import { findProdeByIdOrSlug } from "@/lib/prode-resolve";

export const dynamic = "force-dynamic";

/** Join a public prode (creates ProdeEntry JOINED). Private prodes require invite flow later. */
export async function POST(
  _req: Request,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params;
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) {
    return apiError(401, "UNAUTHORIZED", "Authentication required.");
  }

  const prisma = getPrisma();
  const prode = await findProdeByIdOrSlug(prisma, id);
  if (!prode) {
    return apiError(404, "NOT_FOUND", "Prode not found.");
  }

  if (prode.visibility !== "PUBLIC") {
    return apiError(
      403,
      "FORBIDDEN",
      "This prode is not joinable via public API.",
    );
  }

  const now = new Date();
  if (prode.status === "CANCELLED" || prode.status === "FINALIZED") {
    return apiError(403, "FORBIDDEN", "This prode is not accepting entries.");
  }
  if (prode.closesAt <= now) {
    return apiError(403, "FORBIDDEN", "Entry window closed.");
  }

  const access = await assertCanViewProde(userId, prode);
  if (!access.ok) return access.response;

  await prisma.prodeEntry.upsert({
    where: {
      userId_prodeId: { userId, prodeId: prode.id },
    },
    create: {
      userId,
      prodeId: prode.id,
      status: "JOINED",
    },
    update: {
      status: "JOINED",
    },
  });

  await recalculateProdeLeaderboard(prode.id);

  return NextResponse.json({ ok: true });
}
