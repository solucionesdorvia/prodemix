import { NextResponse } from "next/server";
import { listProdes } from "@/server/prode/prode-service";

function prismaMeta(e: unknown): { code?: string } {
  if (typeof e === "object" && e !== null && "code" in e) {
    const code = (e as { code?: unknown }).code;
    if (typeof code === "string") return { code };
  }
  return {};
}

export async function GET() {
  try {
    const prodes = await listProdes();
    return NextResponse.json(prodes);
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    const { code } = prismaMeta(e);
    return NextResponse.json(
      {
        error: message,
        ...(code ? { code } : {}),
        ...(process.env.NODE_ENV === "development"
          ? {
              hint:
                "Revisá DATABASE_URL, ejecutá `npx prisma migrate deploy` y que la base (Neon/local) sea alcanzable.",
            }
          : {}),
      },
      { status: 500 }
    );
  }
}
