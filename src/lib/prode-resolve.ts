import type { PrismaClient } from "@/generated/prisma/client";

/** Resolve route param that may be cuid or slug. */
export async function findProdeByIdOrSlug(
  prisma: PrismaClient,
  idOrSlug: string,
) {
  return prisma.prode.findFirst({
    where: {
      OR: [{ id: idOrSlug }, { slug: idOrSlug }],
    },
  });
}
