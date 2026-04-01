// Loads .env then .env.local (Next.js-style) so CLI matches `next dev`.
import { config } from "dotenv";
import { resolve } from "node:path";
import { defineConfig } from "prisma/config";

config({ path: resolve(process.cwd(), ".env") });
// Neon / producción: `PRODEMIX_SKIP_ENV_LOCAL=1 npx prisma migrate deploy` (solo lee .env, no .env.local).
if (!process.env.PRODEMIX_SKIP_ENV_LOCAL) {
  config({ path: resolve(process.cwd(), ".env.local"), override: true });
}

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
    seed: "tsx prisma/seed.ts",
  },
  datasource: {
    url: process.env["DATABASE_URL"],
  },
});
