import { getPrisma } from "@/lib/prisma";

/**
 * El ranking solo tiene sentido público una vez jugado el primer partido del calendario
 * compartido (fixtures sin `prodeId`), ordenado por `startsAt`.
 */
export async function isRankingUnlocked(): Promise<boolean> {
  const prisma = getPrisma();
  const first = await prisma.match.findFirst({
    where: {
      prodeId: null,
      status: { not: "CANCELLED" },
    },
    orderBy: { startsAt: "asc" },
    select: { status: true },
  });
  if (!first) return false;
  return first.status === "FINISHED";
}
