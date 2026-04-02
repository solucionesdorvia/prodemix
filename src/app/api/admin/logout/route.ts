import { NextResponse } from "next/server";

const CLEAR_OPTS = {
  httpOnly: true,
  sameSite: "lax" as const,
  path: "/",
  maxAge: 0,
  secure: process.env.NODE_ENV === "production",
};

export async function POST() {
  const res = NextResponse.json({ ok: true });
  res.cookies.set("prodemix_admin", "", CLEAR_OPTS);
  return res;
}
