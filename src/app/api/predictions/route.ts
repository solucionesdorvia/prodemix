import { NextRequest, NextResponse } from "next/server";
import { PredictionOutcome } from "@/generated/prisma/client";
import {
  submitPredictions,
  PredictionError,
} from "@/server/prode/prediction-service";
import { jsonError } from "@/server/http/json";

const OUTCOMES = new Set(Object.values(PredictionOutcome));

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const userId =
      (body as { userId?: string }).userId ?? req.headers.get("x-user-id");
    const prodeId = (body as { prodeId?: string }).prodeId;
    const predictions = (body as { predictions?: unknown }).predictions;

    if (!userId) {
      return jsonError(400, "userId is required (body or X-User-Id header)", "VALIDATION");
    }
    if (!prodeId) {
      return jsonError(400, "prodeId is required", "VALIDATION");
    }
    if (!Array.isArray(predictions) || predictions.length === 0) {
      return jsonError(400, "predictions must be a non-empty array", "VALIDATION");
    }

    const items: { matchId: string; prediction: PredictionOutcome }[] = [];
    for (const row of predictions) {
      if (
        !row ||
        typeof row !== "object" ||
        typeof (row as { matchId?: string }).matchId !== "string" ||
        typeof (row as { prediction?: string }).prediction !== "string"
      ) {
        return jsonError(400, "Each prediction needs matchId and prediction", "VALIDATION");
      }
      const p = (row as { prediction: string }).prediction;
      if (!OUTCOMES.has(p as PredictionOutcome)) {
        return jsonError(400, `Invalid prediction: ${p}`, "VALIDATION");
      }
      items.push({
        matchId: (row as { matchId: string }).matchId,
        prediction: p as PredictionOutcome,
      });
    }

    const result = await submitPredictions({ userId, prodeId, items });
    return NextResponse.json(result);
  } catch (e) {
    if (e instanceof PredictionError) {
      const status =
        e.code === "NOT_PARTICIPANT"
          ? 403
          : e.code === "UNKNOWN_MATCH"
            ? 400
            : e.code === "MATCH_LOCKED"
              ? 409
              : 400;
      return jsonError(status, e.message, e.code);
    }
    throw e;
  }
}
