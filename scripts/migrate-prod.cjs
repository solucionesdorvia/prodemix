/**
 * Arranque en producción (Railway): recupera migración fallida conocida y aplica el resto.
 * No requiere shell manual: corre en cada `npm start`.
 *
 * 1) prisma migrate resolve --rolled-back 20260330140000_referrals
 *    → ignora error si no hay migración en estado failed (caso normal).
 * 2) prisma migrate deploy
 *    → debe terminar OK (incluye SQL idempotente de referidos).
 */
"use strict";

const { execSync } = require("node:child_process");

const env = {
  ...process.env,
  PRISMA_SCHEMA_DISABLE_ADVISORY_LOCK: "1",
};

try {
  execSync(
    "npx prisma migrate resolve --rolled-back 20260330140000_referrals",
    { stdio: "inherit", env },
  );
} catch {
  /* Normal si la migración no está marcada como fallida. */
}

try {
  execSync("npx prisma migrate deploy", { stdio: "inherit", env });
} catch {
  process.exit(1);
}
