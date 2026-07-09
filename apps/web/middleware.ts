import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

import { ACCESS_COOKIE } from "@/lib/constants";
import { handleSupabaseCookies } from "@/lib/supabase/middleware";

const PROTECTED_PREFIXES = [
  "/dashboard",
  "/founder-agent",
  "/startup-builder",
  "/skill-passport",
  "/auditor",
  "/analytics",
  "/settings",
  "/ai-founder",
  "/dao-center",
  "/support",
  "/profile",
  "/notifications",
  "/contracts/deploy",
  "/dashboard/history",
  "/contract-audit",
  "/workspace",
];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const response = await handleSupabaseCookies(request);
  const isProtected = PROTECTED_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );

  if (!isProtected) {
    return response;
  }

  const token = request.cookies.get(ACCESS_COOKIE)?.value;
  if (!token) {
    const url = request.nextUrl.clone();
    url.pathname = "/auth/connect";
    url.searchParams.set("next", pathname);
    return NextResponse.redirect(url);
  }

  return response;
}

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/founder-agent/:path*",
    "/ai-founder/:path*",
    "/startup-builder/:path*",
    "/skill-passport/:path*",
    "/auditor/:path*",
    "/contract-audit/:path*",
    "/contracts/deploy/:path*",
    "/analytics/:path*",
    "/dao-center/:path*",
    "/notifications/:path*",
    "/profile/:path*",
    "/support/:path*",
    "/settings/:path*",
    "/workspace/:path*",
  ],
};
