import { PrismaPg } from "@prisma/adapter-pg";
import pg from "pg";

import { PrismaClient } from "@/generated/prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

function createPrismaClient(): PrismaClient {
  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error("DATABASE_URL is not set");
  }
  // Serverless (p. ej. Vercel): un pool pequeño evita agotar el límite de conexiones
  // de Neon/Railway cuando hay muchas funciones en paralelo.
  const pool = new pg.Pool({
    connectionString: url,
    max: process.env.VERCEL ? 1 : 10,
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
