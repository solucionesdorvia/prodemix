import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const secret = process.env.ADMIN_SECRET;
  if (!secret) {
    return NextResponse.json(
      { ok: false, error: "ADMIN_SECRET not configured" },
      { status: 503 },
    );
  }

  const body = (await req.json().catch(() => ({}))) as { secret?: string };
  if (body.secret !== secret) {
    return NextResponse.json({ ok: false }, { status: 401 });
  }

  const res = NextResponse.json({ ok: true });
  res.cookies.set("prodemix_admin", "1", {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
    secure: process.env.NODE_ENV === "production",
  });
  return res;
}
