import { getPrisma } from "@/lib/prisma";

/**
 * Ranking global (calendario compartido, `prodeId` null): visible cuando ya hay
 * algún partido oficial con resultado o marcado como finalizado — no solo el
 * primero por `startsAt`. Si la fecha 1 sigue pendiente pero la 3 ya se jugó,
 * el ranking debe mostrarse.
 */
export async function isRankingUnlocked(): Promise<boolean> {
  const prisma = getPrisma();
  const any = await prisma.match.findFirst({
    where: {
      prodeId: null,
      status: { not: "CANCELLED" },
      OR: [
        { status: "FINISHED" },
        {
          homeScore: { not: null },
          awayScore: { not: null },
        },
      ],
    },
    select: { id: true },
  });
  return any != null;
}
