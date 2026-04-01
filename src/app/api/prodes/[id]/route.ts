import { NextResponse } from "next/server";
import { getProdeById, ProdeServiceError } from "@/server/prode/prode-service";
import { jsonError } from "@/server/http/json";

type Params = { params: Promise<{ id: string }> };

export async function GET(_req: Request, { params }: Params) {
  const { id } = await params;
  try {
    const prode = await getProdeById(id);
    return NextResponse.json(prode);
  } catch (e) {
    if (e instanceof ProdeServiceError && e.code === "NOT_FOUND") {
      return jsonError(404, e.message, e.code);
    }
    throw e;
  }
}
