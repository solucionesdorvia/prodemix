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

/**
 * Ranking de un prode: visible si en este prode hay al menos un partido con
 * marcador oficial cargado, o si el ranking global ya está habilitado.
 *
 * @param globalUnlocked - Si ya calculaste `isRankingUnlocked()` (p. ej. en un
 *   batch de Mis prodes), pasalo para no repetir la query global por fila.
 */
export async function isRankingUnlockedForProde(
  prodeId: string,
  globalUnlocked?: boolean,
): Promise<boolean> {
  const prisma = getPrisma();
  const hasResultInProde = await prisma.match.findFirst({
    where: {
      prodeMatchJoins: { some: { prodeId } },
      homeScore: { not: null },
      awayScore: { not: null },
    },
    select: { id: true },
  });
  if (hasResultInProde) return true;
  if (globalUnlocked !== undefined) return globalUnlocked;
  return isRankingUnlocked();
}
