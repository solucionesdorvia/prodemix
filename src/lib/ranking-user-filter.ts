import type { Prisma } from "@/generated/prisma/client";

/** Rol `User.role` que no debe aparecer en tablas de ranking ni en `ProdeLeaderboardEntry`. */
export const RANKING_EXCLUDED_USER_ROLE = "admin";

/** Filtro Prisma para `user` en filas de leaderboard visibles. */
export const prismaUserIncludedInRankings: Prisma.UserWhereInput = {
  role: { not: RANKING_EXCLUDED_USER_ROLE },
};
