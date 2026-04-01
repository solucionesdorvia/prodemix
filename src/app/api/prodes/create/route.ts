import { NextRequest, NextResponse } from "next/server";
import { createProde, ProdeServiceError } from "@/server/prode/prode-service";
import { jsonError } from "@/server/http/json";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      name,
      isPublic = true,
      createdByUserId,
      matchIds,
      entryPrice,
      prizePool,
    } = body as {
      name?: string;
      isPublic?: boolean;
      createdByUserId?: string;
      matchIds?: string[];
      entryPrice?: number;
      prizePool?: number | null;
    };

    if (!createdByUserId) {
      return jsonError(400, "createdByUserId is required", "VALIDATION");
    }

    const prode = await createProde({
      name: name ?? "",
      isPublic: Boolean(isPublic),
      createdByUserId,
      matchIds: matchIds ?? [],
      entryPrice,
      prizePool,
    });

    return NextResponse.json(prode, { status: 201 });
  } catch (e) {
    if (e instanceof ProdeServiceError) {
      const status =
        e.code === "NOT_FOUND" ? 404 : e.code === "VALIDATION" ? 400 : 400;
      return jsonError(status, e.message, e.code);
    }
    throw e;
  }
}
