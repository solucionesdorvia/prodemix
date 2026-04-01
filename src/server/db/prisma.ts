import { Pool } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@/generated/prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
  pgPool: Pool | undefined;
};

/** URL solo para `next build` (importa rutas API sin DB). En runtime debe existir DATABASE_URL real. */
function resolveDatabaseUrl(): string {
  const url = process.env.DATABASE_URL;
  if (url) return url;
  if (
    process.env.NEXT_PHASE === "phase-production-build" ||
    process.env.NEXT_PHASE === "phase-development-build"
  ) {
    return "postgresql://build:build@127.0.0.1:5432/build?schema=public";
  }
  throw new Error("DATABASE_URL is not set");
}

function createPrismaClient(): PrismaClient {
  const url = resolveDatabaseUrl();
  const pool = globalForPrisma.pgPool ?? new Pool({ connectionString: url });
  globalForPrisma.pgPool = pool;
  const adapter = new PrismaPg(pool);
  return new PrismaClient({ adapter });
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
