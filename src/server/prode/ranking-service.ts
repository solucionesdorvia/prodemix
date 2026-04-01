import { prisma } from "@/server/db/prisma";
import { ProdeServiceError } from "@/server/prode/prode-service";

export async function getRanking(prodeId: string) {
  const prode = await prisma.prode.findUnique({ where: { id: prodeId } });
  if (!prode) {
    throw new ProdeServiceError("Prode not found", "NOT_FOUND");
  }

  const rows = await prisma.score.findMany({
    where: { prodeId },
    orderBy: [{ points: "desc" }, { userId: "asc" }],
    include: {
      user: {
        select: { id: true, name: true, email: true, avatar: true },
      },
    },
  });

  return rows.map((row, index) => ({
    rank: index + 1,
    points: row.points,
    user: row.user,
  }));
}
