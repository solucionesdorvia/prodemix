import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";

import { getClientIp } from "@/lib/client-ip";
import {
  REFERRAL_COOKIE,
  REFERRAL_COOKIE_MAX_AGE_SEC,
} from "@/lib/referrals/constants";
import { normalizeReferralCode } from "@/lib/referrals/normalize";
import {
  buildMaintenanceHtmlPage,
  isMaintenanceModeActive,
} from "@/lib/maintenance-mode";
import { rateLimit } from "@/lib/rate-limit";
import { rateLimitResponse } from "@/lib/rate-limit-response";

function jsonError(
  status: number,
  code: "UNAUTHORIZED" | "FORBIDDEN" | "SERVICE_UNAVAILABLE",
  message: string,
) {
  return NextResponse.json({ error: { code, message } }, { status });
}

/** Si viene `?ref=`, guarda el código en cookie httpOnly para el alta (registro / OAuth). */
function withReferralCookie(
  request: NextRequest,
  response: NextResponse,
): NextResponse {
  const ref = request.nextUrl.searchParams.get("ref");
  const code = normalizeReferralCode(ref);
  if (code) {
    response.cookies.set(REFERRAL_COOKIE, code, {
      path: "/",
      maxAge: REFERRAL_COOKIE_MAX_AGE_SEC,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      httpOnly: true,
    });
  }
  return response;
}

/** Next.js 16+: `proxy` reemplaza `middleware` (misma API, runtime Node por defecto). */
export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const ip = getClientIp(request);

  if (isMaintenanceModeActive()) {
    if (pathname.startsWith("/api/")) {
      return NextResponse.json(
        {
          error: {
            code: "SERVICE_UNAVAILABLE" as const,
            message:
              "ProdeMix está en mantenimiento. Probá de nuevo en unos minutos.",
          },
        },
        { status: 503 },
      );
    }
    /** Sin pasar por Next: no hay React, sesión ni rutas de la app. */
    return new NextResponse(buildMaintenanceHtmlPage(), {
      status: 503,
      headers: {
        "Content-Type": "text/html; charset=utf-8",
        "Cache-Control": "no-store, no-cache, must-revalidate",
      },
    });
  }

  if (pathname.startsWith("/api/auth")) {
    const rl = rateLimit(`auth:${ip}`, 60, 60_000);
    if (!rl.ok) {
      return withReferralCookie(request, rateLimitResponse(rl.retryAfterSec));
    }
  }

  if (
    request.method === "POST" &&
    /^\/api\/prodes\/[^/]+\/predictions\/?$/.test(pathname)
  ) {
    const rl = rateLimit(`pred_ip:${ip}`, 120, 60_000);
    if (!rl.ok) {
      return withReferralCookie(request, rateLimitResponse(rl.retryAfterSec));
    }
  }

  const isAdminUi =
    pathname === "/admin" || pathname.startsWith("/admin/");
  const isAdminApi =
    pathname === "/api/admin" || pathname.startsWith("/api/admin/");

  if (!isAdminUi && !isAdminApi) {
    return withReferralCookie(request, NextResponse.next());
  }

  const secret = process.env.AUTH_SECRET;
  if (!secret) {
    if (isAdminApi) {
      return withReferralCookie(
        request,
        jsonError(
          503,
          "SERVICE_UNAVAILABLE",
          "Auth no configurado (AUTH_SECRET).",
        ),
      );
    }
    return withReferralCookie(
      request,
      new NextResponse(
        "Administración no disponible: definí AUTH_SECRET en el servidor.",
        { status: 503, headers: { "Content-Type": "text/plain; charset=utf-8" } },
      ),
    );
  }

  const token = await getToken({
    req: request,
    secret,
    secureCookie: process.env.NODE_ENV === "production",
  });

  if (!token?.sub) {
    if (isAdminApi) {
      return withReferralCookie(
        request,
        jsonError(
          401,
          "UNAUTHORIZED",
          "Iniciá sesión con una cuenta administradora.",
        ),
      );
    }
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("callbackUrl", pathname);
    return withReferralCookie(request, NextResponse.redirect(loginUrl));
  }

  if (token.role !== "admin") {
    if (isAdminApi) {
      return withReferralCookie(
        request,
        jsonError(403, "FORBIDDEN", "Se requiere rol administrador."),
      );
    }
    return withReferralCookie(
      request,
      NextResponse.redirect(new URL("/?error=forbidden", request.url)),
    );
  }

  return withReferralCookie(request, NextResponse.next());
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
