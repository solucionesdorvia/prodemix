import { PrismaPg } from "@prisma/adapter-pg";
import pg from "pg";

import { PrismaClient } from "@/generated/prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

/**
 * Neon a veces añade `channel_binding=require`; `pg` puede fallar al conectar.
 * Quitamos solo ese parámetro; `sslmode=require` se mantiene.
 */
function normalizeDatabaseUrlForPg(url: string): string {
  try {
    const u = new URL(url);
    u.searchParams.delete("channel_binding");
    return u.href;
  } catch {
    return url;
  }
}

function isLikelyServerlessHost(): boolean {
  return Boolean(
    process.env.VERCEL ||
      process.env.RAILWAY_ENVIRONMENT ||
      process.env.RAILWAY,
  );
}

function createPrismaClient(): PrismaClient {
  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error("DATABASE_URL is not set");
  }
  const connectionString = normalizeDatabaseUrlForPg(url);
  // Vercel / Railway: pool pequeño para no agotar conexiones de Neon.
  const pool = new pg.Pool({
    connectionString,
    max: isLikelyServerlessHost() ? 1 : 10,
  });
  const adapter = new PrismaPg(pool);
  return new PrismaClient({ adapter });
}

/** Singleton para Auth.js y futuras rutas API. */
export function getPrisma(): PrismaClient {
  if (!globalForPrisma.prisma) {
    globalForPrisma.prisma = createPrismaClient();
  }
  return globalForPrisma.prisma;
}
