import { NextResponse } from "next/server";
import { getRanking } from "@/server/prode/ranking-service";
import { ProdeServiceError } from "@/server/prode/prode-service";
import { jsonError } from "@/server/http/json";

type Params = { params: Promise<{ prodeId: string }> };

export async function GET(_req: Request, { params }: Params) {
  const { prodeId } = await params;
  try {
    const ranking = await getRanking(prodeId);
    return NextResponse.json({ prodeId, ranking });
  } catch (e) {
    if (e instanceof ProdeServiceError && e.code === "NOT_FOUND") {
      return jsonError(404, e.message, e.code);
    }
    throw e;
  }
}
