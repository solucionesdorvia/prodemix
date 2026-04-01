import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

export function middleware(request: NextRequest) {
  if (!process.env.ADMIN_SECRET) {
    return NextResponse.next();
  }

  const { pathname } = request.nextUrl;
  if (pathname === "/admin/login") {
    return NextResponse.next();
  }

  const cookie = request.cookies.get("prodemix_admin");
  if (cookie?.value === "1") {
    return NextResponse.next();
  }

  const loginUrl = new URL("/admin/login", request.url);
  loginUrl.searchParams.set("from", pathname);
  return NextResponse.redirect(loginUrl);
}

export const config = {
  matcher: ["/admin", "/admin/:path*"],
};
