import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

import { ACCESS_COOKIE } from "@/lib/constants";

const PROTECTED_PREFIXES = ["/dashboard", "/founder-agent", "/startup-builder", "/skill-passport", "/auditor", "/analytics", "/settings"];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const isProtected = PROTECTED_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );

  if (!isProtected) {
    return NextResponse.next();
  }

  const token = request.cookies.get(ACCESS_COOKIE)?.value;
  if (!token) {
    const url = request.nextUrl.clone();
    url.pathname = "/auth/connect";
    url.searchParams.set("next", pathname);
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/founder-agent/:path*",
    "/startup-builder/:path*",
    "/skill-passport/:path*",
    "/auditor/:path*",
    "/analytics/:path*",
    "/settings/:path*",
  ],
};
