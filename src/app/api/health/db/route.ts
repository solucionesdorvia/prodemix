import { NextResponse } from "next/server";

import { getPrisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

/**
 * Diagnóstico sin secretos: comprueba si existe la tabla User y la columna passwordHash.
 * Abrí GET /api/health/db en producción si el registro falla con P2021/P2022.
 */
export async function GET() {
  const databaseUrlSet = Boolean(process.env.DATABASE_URL?.trim());
  const directUrlSet = Boolean(process.env.DIRECT_URL?.trim());

  if (!databaseUrlSet) {
    return NextResponse.json(
      {
        ok: false,
        databaseUrlSet: false,
        directUrlSet,
        userTableExists: false,
        passwordHashColumnExists: false,
      },
      { status: 503 },
    );
  }

  try {
    const prisma = getPrisma();
    const [table] = await prisma.$queryRaw<Array<{ exists: boolean }>>`
      SELECT to_regclass('public."User"') IS NOT NULL AS exists
    `;
    const userTableExists = Boolean(table?.exists);

    const [col] = await prisma.$queryRaw<Array<{ exists: boolean }>>`
      SELECT EXISTS (
        SELECT 1
        FROM pg_attribute a
        JOIN pg_class t ON a.attrelid = t.oid
        JOIN pg_namespace n ON t.relnamespace = n.oid
        WHERE n.nspname = 'public'
          AND t.relname = 'User'
          AND a.attname = 'passwordHash'
          AND NOT a.attisdropped
      ) AS exists
    `;
    const passwordHashColumnExists = Boolean(col?.exists);

    const ok = userTableExists && passwordHashColumnExists;
    return NextResponse.json(
      {
        ok,
        databaseUrlSet: true,
        directUrlSet,
        userTableExists,
        passwordHashColumnExists,
        hint: ok
          ? null
          : "En Neon copiá la URL directa (sin -pooler) como DIRECT_URL en Railway y redeploy; el migrate deploy usa DIRECT_URL si está definida.",
      },
      { status: ok ? 200 : 503 },
    );
  } catch {
    return NextResponse.json(
      {
        ok: false,
        databaseUrlSet: true,
        directUrlSet,
        userTableExists: false,
        passwordHashColumnExists: false,
        hint: "No se pudo consultar la base. Revisá DATABASE_URL y que Neon esté accesible.",
      },
      { status: 503 },
    );
  }
}
