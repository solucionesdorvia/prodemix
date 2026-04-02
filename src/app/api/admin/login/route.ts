import { NextResponse } from "next/server";

import { timingSafeEqualString } from "@/lib/crypto-safe";
import { getClientIpFromHeaders } from "@/lib/client-ip";
import { rateLimit } from "@/lib/rate-limit";
import { rateLimitResponse } from "@/lib/rate-limit-response";
import { adminLoginBodySchema } from "@/lib/validation/admin-auth";
import { zodToApiError } from "@/lib/validation/zod-to-api";

const COOKIE_OPTS = {
  httpOnly: true,
  sameSite: "lax" as const,
  path: "/",
  maxAge: 60 * 60 * 24 * 7,
  secure: process.env.NODE_ENV === "production",
};

export async function POST(req: Request) {
  const secret = process.env.ADMIN_SECRET;
  if (!secret) {
    return NextResponse.json(
      { ok: false, error: "ADMIN_SECRET not configured" },
      { status: 503 },
    );
  }

  const ip = getClientIpFromHeaders(req.headers);
  const rl = rateLimit(`admin_login_route:${ip}`, 15, 60_000);
  if (!rl.ok) return rateLimitResponse(rl.retryAfterSec);

  let json: unknown;
  try {
    json = await req.json();
  } catch {
    return NextResponse.json({ ok: false }, { status: 400 });
  }

  const parsed = adminLoginBodySchema.safeParse(json);
  if (!parsed.success) {
    return zodToApiError(parsed.error);
  }

  if (!timingSafeEqualString(parsed.data.secret, secret)) {
    return NextResponse.json({ ok: false }, { status: 401 });
  }

  const res = NextResponse.json({ ok: true });
  res.cookies.set("prodemix_admin", "1", COOKIE_OPTS);
  return res;
}
