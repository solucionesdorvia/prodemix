import { NextResponse } from "next/server";

export function jsonError(
  status: number,
  message: string,
  code?: string
): NextResponse {
  return NextResponse.json(
    { error: message, ...(code ? { code } : {}) },
    { status }
  );
}
