import { NextResponse } from "next/server";

import { getTournamentCatalogueFromDb } from "@/server/catalogue/from-db";

export const dynamic = "force-dynamic";

/**
 * JSON catalogue from Postgres (Neon). Same shape as `TournamentCatalogueEntry[]`
 * for progressive migration off mocks.
 */
export async function GET() {
  try {
    const tournaments = await getTournamentCatalogueFromDb();
    return NextResponse.json({ tournaments });
  } catch (e) {
    console.error(e);
    return NextResponse.json(
      { error: "No se pudo cargar el catálogo desde la base de datos." },
      { status: 500 },
    );
  }
}
