import type { Prode } from "@/generated/prisma/client";

import { apiError } from "@/lib/api-errors";
import { getPrisma } from "@/lib/prisma";
import type { NextResponse } from "next/server";

export async function assertCanViewProde(
  userId: string | null,
  prode: Prode,
): Promise<{ ok: true } | { ok: false; response: NextResponse }> {
  if (prode.visibility === "PUBLIC") {
    return { ok: true };
  }
  if (!userId) {
    return {
      ok: false,
      response: apiError(
        401,
        "UNAUTHORIZED",
        "Authentication required for this prode.",
      ),
    };
  }
  if (prode.ownerId === userId) {
    return { ok: true };
  }

  const prisma = getPrisma();
  const entry = await prisma.prodeEntry.findUnique({
    where: {
      userId_prodeId: { userId, prodeId: prode.id },
    },
  });
  if (
    entry &&
    (entry.status === "JOINED" || entry.status === "INVITED")
  ) {
    return { ok: true };
  }

  return {
    ok: false,
    response: apiError(403, "FORBIDDEN", "You do not have access to this prode."),
  };
}

export function canSubmitPredictions(prode: Prode, now: Date): boolean {
  if (prode.status === "CANCELLED" || prode.status === "FINALIZED") {
    return false;
  }
  return prode.closesAt > now;
}
