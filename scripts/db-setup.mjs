#!/usr/bin/env node
/**
 * Carga .env + .env.local (igual que Prisma config) y ejecuta migraciones + seed.
 * Uso: npm run db:setup
 */
import { config } from "dotenv";
import { resolve } from "node:path";
import { spawnSync } from "node:child_process";

const root = process.cwd();
config({ path: resolve(root, ".env") });
config({ path: resolve(root, ".env.local"), override: true });

const url = process.env.DATABASE_URL;
if (!url || !String(url).trim()) {
  console.error(
    "Falta DATABASE_URL. Copiá .env.example → .env y pegá la connection string de Neon."
  );
  process.exit(1);
}

const looksLocal =
  url.includes("localhost") ||
  url.includes("127.0.0.1") ||
  url.includes("0.0.0.0");

if (looksLocal) {
  console.warn(
    "⚠️  DATABASE_URL apunta a esta máquina. Si no tenés Postgres corriendo, usá la URL de Neon en .env o .env.local.\n"
  );
}

function run(cmd, args) {
  const r = spawnSync(cmd, args, {
    stdio: "inherit",
    cwd: root,
    env: process.env,
    shell: false,
  });
  if (r.status !== 0) process.exit(r.status ?? 1);
}

console.log("→ prisma migrate deploy\n");
run("npx", ["prisma", "migrate", "deploy"]);

console.log("\n→ prisma db seed\n");
run("npx", ["prisma", "db", "seed"]);

console.log("\n✓ Base lista (migraciones + seed).");
