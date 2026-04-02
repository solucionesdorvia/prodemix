import type { NextRequest } from "next/server";

/** Best-effort client IP for rate limiting (rely on `x-forwarded-for` / `x-real-ip` from your reverse proxy). */
export function getClientIpFromHeaders(headers: Headers): string {
  const forwarded = headers.get("x-forwarded-for");
  if (forwarded) {
    const first = forwarded.split(",")[0]?.trim();
    if (first) return first;
  }
  const real = headers.get("x-real-ip");
  if (real?.trim()) return real.trim();
  return headers.get("cf-connecting-ip")?.trim() || "unknown";
}

export function getClientIp(request: NextRequest): string {
  return getClientIpFromHeaders(request.headers);
}
