import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";

import { getClientIp } from "@/lib/client-ip";
import { rateLimit } from "@/lib/rate-limit";
import { rateLimitResponse } from "@/lib/rate-limit-response";

function jsonError(
  status: number,
  code: "UNAUTHORIZED" | "FORBIDDEN" | "SERVICE_UNAVAILABLE",
  message: string,
) {
  return NextResponse.json({ error: { code, message } }, { status });
}

/** Next.js 16+: `proxy` reemplaza `middleware` (misma API, runtime Node por defecto). */
export async function proxy(request: NextRequest) {
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

  const isAdminUi =
    pathname === "/admin" || pathname.startsWith("/admin/");
  const isAdminApi =
    pathname === "/api/admin" || pathname.startsWith("/api/admin/");

  if (!isAdminUi && !isAdminApi) {
    return NextResponse.next();
  }

  const secret = process.env.AUTH_SECRET;
  if (!secret) {
    if (isAdminApi) {
      return jsonError(
        503,
        "SERVICE_UNAVAILABLE",
        "Auth no configurado (AUTH_SECRET).",
      );
    }
    return new NextResponse(
      "Administración no disponible: definí AUTH_SECRET en el servidor.",
      { status: 503, headers: { "Content-Type": "text/plain; charset=utf-8" } },
    );
  }

  const token = await getToken({
    req: request,
    secret,
    secureCookie: process.env.NODE_ENV === "production",
  });

  if (!token?.sub) {
    if (isAdminApi) {
      return jsonError(
        401,
        "UNAUTHORIZED",
        "Iniciá sesión con una cuenta administradora.",
      );
    }
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }

  if (token.role !== "admin") {
    if (isAdminApi) {
      return jsonError(
        403,
        "FORBIDDEN",
        "Se requiere rol administrador.",
      );
    }
    return NextResponse.redirect(new URL("/?error=forbidden", request.url));
  }

  return NextResponse.next();
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
