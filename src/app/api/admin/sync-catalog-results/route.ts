import { NextResponse } from "next/server";

import { logStructured } from "@/lib/observability";
import { apiError } from "@/lib/api-errors";
import { requireAdminApi } from "@/lib/require-admin";
import { syncCatalogMockResultsToDb } from "@/lib/sync-catalog-mock-results-to-db";

export const dynamic = "force-dynamic";

/**
 * Aplica `MOCK_MATCH_RESULTS` a filas `Match` en la base y recalcula rankings.
 * Query opcional: `prodeId` para forzar recálculo de un prode (p. ej. sin vínculos raros).
 */
export async function POST(req: Request) {
  const denied = await requireAdminApi();
  if (denied) return denied;

  const url = new URL(req.url);
  const forceProdeId = url.searchParams.get("prodeId");

  try {
    const result = await syncCatalogMockResultsToDb({
      forceProdeId: forceProdeId || undefined,
    });

    logStructured("admin.catalog_mock_synced", {
      updated: result.updated,
      skippedMissing: result.skippedMissing,
      affectedProdeCount: result.affectedProdeIds.length,
    });

    return NextResponse.json({ ok: true, ...result });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Sync failed.";
    return apiError(500, "SERVICE_UNAVAILABLE", msg);
  }
}
