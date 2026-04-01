import { prisma } from "@/server/db/prisma";

export class ProdeServiceError extends Error {
  constructor(
    message: string,
    public readonly code: "NOT_FOUND" | "VALIDATION" | "DUPLICATE_JOIN"
  ) {
    super(message);
    this.name = "ProdeServiceError";
  }
}

export async function createProde(params: {
  name: string;
  isPublic: boolean;
  createdByUserId: string;
  matchIds: string[];
  entryPrice?: number;
  prizePool?: number | null;
}) {
  const { name, isPublic, createdByUserId, matchIds, entryPrice, prizePool } = params;

  if (!name?.trim()) {
    throw new ProdeServiceError("Name is required", "VALIDATION");
  }
  if (!matchIds?.length) {
    throw new ProdeServiceError("At least one match is required", "VALIDATION");
  }

  const creator = await prisma.user.findUnique({ where: { id: createdByUserId } });
  if (!creator) {
    throw new ProdeServiceError("Creator user does not exist", "VALIDATION");
  }

  const matches = await prisma.match.findMany({
    where: { id: { in: matchIds } },
  });
  if (matches.length !== matchIds.length) {
    throw new ProdeServiceError("One or more match ids are invalid", "VALIDATION");
  }

  return prisma.$transaction(async (tx) => {
    const prode = await tx.prode.create({
      data: {
        name: name.trim(),
        isPublic,
        createdByUserId,
        entryPrice: entryPrice ?? 0,
        prizePool: prizePool ?? null,
        prodeMatches: {
          create: matchIds.map((matchId) => ({ matchId })),
        },
      },
      include: {
        prodeMatches: { include: { match: true } },
        creator: true,
      },
    });

    await tx.prodeParticipant.create({
      data: {
        prodeId: prode.id,
        userId: createdByUserId,
      },
    });

    await tx.score.upsert({
      where: {
        userId_prodeId: { userId: createdByUserId, prodeId: prode.id },
      },
      create: { userId: createdByUserId, prodeId: prode.id, points: 0 },
      update: {},
    });

    return prode;
  });
}

export async function listProdes() {
  return prisma.prode.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      creator: { select: { id: true, name: true, email: true } },
      _count: {
        select: { participants: true, prodeMatches: true },
      },
    },
  });
}

export async function getProdeById(id: string) {
  const prode = await prisma.prode.findUnique({
    where: { id },
    include: {
      creator: { select: { id: true, name: true, email: true, avatar: true } },
      prodeMatches: {
        include: {
          match: {
            include: {
              homeTeam: true,
              awayTeam: true,
              tournament: true,
            },
          },
        },
        orderBy: { id: "asc" },
      },
      _count: { select: { participants: true } },
    },
  });
  if (!prode) {
    throw new ProdeServiceError("Prode not found", "NOT_FOUND");
  }
  return prode;
}

export async function joinProde(prodeId: string, userId: string) {
  const prode = await prisma.prode.findUnique({ where: { id: prodeId } });
  if (!prode) {
    throw new ProdeServiceError("Prode not found", "NOT_FOUND");
  }

  try {
    await prisma.prodeParticipant.create({
      data: { prodeId, userId },
    });
    await prisma.score.upsert({
      where: { userId_prodeId: { userId, prodeId } },
      create: { userId, prodeId, points: 0 },
      update: {},
    });
  } catch (e: unknown) {
    if (
      e &&
      typeof e === "object" &&
      "code" in e &&
      (e as { code?: string }).code === "P2002"
    ) {
      throw new ProdeServiceError("User already joined this prode", "DUPLICATE_JOIN");
    }
    throw e;
  }
}
