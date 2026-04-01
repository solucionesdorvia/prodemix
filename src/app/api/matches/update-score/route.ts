import { NextRequest, NextResponse } from "next/server";
import { updateMatchScore } from "@/server/matches/match-service";
import { MatchServiceError } from "@/server/matches/match-service";
import { jsonError } from "@/server/http/json";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const matchId = (body as { matchId?: string }).matchId;
    const homeScore = (body as { homeScore?: unknown }).homeScore;
    const awayScore = (body as { awayScore?: unknown }).awayScore;
    const status = (body as { status?: "scheduled" | "finished" }).status;

    if (!matchId || typeof matchId !== "string") {
      return jsonError(400, "matchId is required", "VALIDATION");
    }
    if (typeof homeScore !== "number" || typeof awayScore !== "number") {
      return jsonError(400, "homeScore and awayScore must be numbers", "VALIDATION");
    }

    const match = await updateMatchScore({
      matchId,
      homeScore,
      awayScore,
      status,
    });
    return NextResponse.json(match);
  } catch (e) {
    if (e instanceof MatchServiceError) {
      const status = e.code === "NOT_FOUND" ? 404 : 400;
      return jsonError(status, e.message, e.code);
    }
    throw e;
  }
}
