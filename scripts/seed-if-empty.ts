/**
 * Ejecuta `prisma db seed` solo si el catálogo no está cargado (primer deploy / base nueva).
 * Evita ~3 min en cada restart cuando ya hay torneos y partidos.
 */
import "dotenv/config";
import { execSync } from "node:child_process";

import { getPrisma } from "../src/lib/prisma";
import { syncCatalogMockResultsToDb } from "../src/lib/sync-catalog-mock-results-to-db";

async function main() {
  if (!process.env.DATABASE_URL?.trim()) {
    console.warn("seed-if-empty: DATABASE_URL no definida, omitiendo seed.");
    return;
  }

  const prisma = getPrisma();
  try {
    const [tournaments, matches] = await Promise.all([
      prisma.tournament.count(),
      prisma.match.count(),
    ]);

    if (tournaments > 0 && matches > 0) {
      console.log(
        "seed-if-empty: catálogo presente (tournaments=%s, matches=%s), sincronizando marcadores catálogo→DB…",
        tournaments,
        matches,
      );
      const r = await syncCatalogMockResultsToDb();
      console.log(
        "seed-if-empty: catalog→DB: %s partido(s) tocado(s), %s id(s) sin fila, %s prode(s) con recálculo.",
        r.updated,
        r.skippedMissing,
        r.affectedProdeIds.length,
      );
      return;
    }

    console.log(
      "seed-if-empty: base vacía o incompleta (tournaments=%s, matches=%s), ejecutando seed…",
      tournaments,
      matches,
    );
  } finally {
    await prisma.$disconnect();
  }

  execSync("npx prisma db seed", {
    stdio: "inherit",
    env: process.env,
    cwd: process.cwd(),
  });
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
