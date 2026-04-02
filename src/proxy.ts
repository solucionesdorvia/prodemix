import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

import { getClientIp } from "@/lib/client-ip";
import { rateLimit } from "@/lib/rate-limit";
import { rateLimitResponse } from "@/lib/rate-limit-response";

function jsonError(
  status: number,
  code: "UNAUTHORIZED" | "SERVICE_UNAVAILABLE",
  message: string,
) {
  return NextResponse.json({ error: { code, message } }, { status });
}

/** Next.js 16+: `proxy` reemplaza `middleware` (misma API, runtime Node por defecto). */
export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const ip = getClientIp(request);

  if (pathname.startsWith("/api/auth")) {
    const rl = rateLimit(`auth:${ip}`, 60, 60_000);
    if (!rl.ok) return rateLimitResponse(rl.retryAfterSec);
  }

  if (
    request.method === "POST" &&
    /^\/api\/prodes\/[^/]+\/predictions\/?$/.test(pathname)
  ) {
    const rl = rateLimit(`pred_ip:${ip}`, 120, 60_000);
    if (!rl.ok) return rateLimitResponse(rl.retryAfterSec);
  }

  if (pathname === "/api/admin/login" && request.method === "POST") {
    const rl = rateLimit(`admin_login:${ip}`, 15, 60_000);
    if (!rl.ok) return rateLimitResponse(rl.retryAfterSec);
  }

  if (pathname === "/admin/login" || pathname.startsWith("/admin/login/")) {
    return NextResponse.next();
  }

  if (pathname === "/api/admin/login" || pathname === "/api/admin/logout") {
    return NextResponse.next();
  }

  const isAdminUi =
    pathname === "/admin" || pathname.startsWith("/admin/");
  const isAdminApi =
    pathname === "/api/admin" || pathname.startsWith("/api/admin/");

  if (!isAdminUi && !isAdminApi) {
    return NextResponse.next();
  }

  if (!process.env.ADMIN_SECRET) {
    if (isAdminApi) {
      return jsonError(
        503,
        "SERVICE_UNAVAILABLE",
        "Admin is not configured (ADMIN_SECRET).",
      );
    }
    return new NextResponse(
      "Administración no configurada: definí ADMIN_SECRET en el servidor.",
      { status: 503, headers: { "Content-Type": "text/plain; charset=utf-8" } },
    );
  }

  const cookie = request.cookies.get("prodemix_admin");
  if (cookie?.value === "1") {
    return NextResponse.next();
  }

  if (isAdminApi) {
    return jsonError(
      401,
      "UNAUTHORIZED",
      "Admin authentication required.",
    );
  }

  const loginUrl = new URL("/admin/login", request.url);
  loginUrl.searchParams.set("from", pathname);
  return NextResponse.redirect(loginUrl);
}

export const config = {
  matcher: [
    "/api/auth/:path*",
    "/api/prodes/:path*",
    "/admin",
    "/admin/:path*",
    "/api/admin",
    "/api/admin/:path*",
  ],
};
