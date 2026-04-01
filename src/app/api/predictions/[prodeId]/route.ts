import { NextRequest, NextResponse } from "next/server";
import { listPredictionsForUser } from "@/server/prode/prediction-service";
import { jsonError } from "@/server/http/json";

type Params = { params: Promise<{ prodeId: string }> };

export async function GET(req: NextRequest, { params }: Params) {
  const { prodeId } = await params;
  const userId =
    req.nextUrl.searchParams.get("userId") ?? req.headers.get("x-user-id");
  if (!userId) {
    return jsonError(
      400,
      "userId is required (query ?userId= or X-User-Id header)",
      "VALIDATION"
    );
  }

  const predictions = await listPredictionsForUser(prodeId, userId);
  return NextResponse.json({ prodeId, userId, predictions });
}
