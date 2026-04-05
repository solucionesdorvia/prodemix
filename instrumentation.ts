/**
 * Next.js instrumentation: Sentry (Node + Edge) and production env checks.
 */
import * as Sentry from "@sentry/nextjs";

export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    await import("./sentry.server.config");
  }
  if (process.env.NEXT_RUNTIME === "edge") {
    await import("./sentry.edge.config");
  }

  if (process.env.NEXT_RUNTIME !== "nodejs") return;

  /** Alinea `MOCK_MATCH_RESULTS` con Prisma en cada arranque del servidor (dev y prod). Idempotente. */
  if (process.env.DATABASE_URL?.trim() && process.env.SKIP_CATALOG_SYNC !== "1") {
    try {
      const { syncCatalogMockResultsToDb } = await import(
        "./src/lib/sync-catalog-mock-results-to-db"
      );
      const r = await syncCatalogMockResultsToDb();
      if (r.updated > 0) {
        console.log(
          `[prodemix] catalog→DB: ${r.updated} partido(s) actualizado(s); ${r.skippedMissing} id(s) sin fila Match.`,
        );
      }
    } catch (e) {
      console.warn("[prodemix] catalog→DB (omitido o error):", e);
    }
  }

  if (process.env.NODE_ENV !== "production") return;

  const missing: string[] = [];
  if (!process.env.AUTH_SECRET?.trim()) missing.push("AUTH_SECRET");
  if (!process.env.DATABASE_URL?.trim()) missing.push("DATABASE_URL");
  if (missing.length > 0) {
    console.warn(
      `[prodemix] Production env: missing or empty: ${missing.join(", ")}`,
    );
  }
}

export const onRequestError = Sentry.captureRequestError;
