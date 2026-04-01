import { NextRequest, NextResponse } from "next/server";
import { joinProde, ProdeServiceError } from "@/server/prode/prode-service";
import { jsonError } from "@/server/http/json";

type Params = { params: Promise<{ id: string }> };

export async function POST(req: NextRequest, { params }: Params) {
  const { id: prodeId } = await params;
  try {
    const body = await req.json().catch(() => ({}));
    const userId =
      (body as { userId?: string }).userId ?? req.headers.get("x-user-id");
    if (!userId) {
      return jsonError(400, "userId is required (body or X-User-Id header)", "VALIDATION");
    }

    await joinProde(prodeId, userId);
    return NextResponse.json({ ok: true, prodeId, userId });
  } catch (e) {
    if (e instanceof ProdeServiceError) {
      const status =
        e.code === "NOT_FOUND" ? 404 : e.code === "DUPLICATE_JOIN" ? 409 : 400;
      return jsonError(status, e.message, e.code);
    }
    throw e;
  }
}
