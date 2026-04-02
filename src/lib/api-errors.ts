import { NextResponse } from "next/server";

export type ApiErrorCode =
  | "UNAUTHORIZED"
  | "FORBIDDEN"
  | "NOT_FOUND"
  | "INVALID_DATA"
  | "PREDICTION_WINDOW_CLOSED"
  | "NOT_PARTICIPATING"
  | "CONFLICT"
  | "SERVICE_UNAVAILABLE"
  | "RATE_LIMIT";

export function apiError(
  status: number,
  code: ApiErrorCode,
  message: string,
  extra?: Record<string, unknown>,
): NextResponse {
  return NextResponse.json(
    { error: { code, message, ...extra } },
    { status },
  );
}
