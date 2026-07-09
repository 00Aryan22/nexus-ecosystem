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

async function verifyJwt(token: string, secret?: string): Promise<boolean> {
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return false;

    const [headerB64, payloadB64, signatureB64] = parts;

    // Check expiration
    const payload = JSON.parse(atob(payloadB64.replace(/-/g, "+").replace(/_/g, "/")));
    if (payload.exp && typeof payload.exp === "number") {
      const now = Math.floor(Date.now() / 1000);
      if (now >= payload.exp) return false;
    }

    if (secret) {
      const encoder = new TextEncoder();
      const keyData = encoder.encode(secret);
      const data = encoder.encode(`${headerB64}.${payloadB64}`);
      
      const key = await crypto.subtle.importKey(
        "raw",
        keyData,
        { name: "HMAC", hash: "SHA-256" },
        false,
        ["verify"]
      );

      const sigRaw = Uint8Array.from(
        atob(signatureB64.replace(/-/g, "+").replace(/_/g, "/")),
        (c) => c.charCodeAt(0)
      );

      return await crypto.subtle.verify("HMAC", key, sigRaw, data);
    }

    return true;
  } catch {
    return false;
  }
}

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
  const secret = process.env.JWT_SECRET_KEY;
  
  if (!token || !(await verifyJwt(token, secret))) {
    const url = request.nextUrl.clone();
    url.pathname = "/auth/connect";
    url.searchParams.set("next", pathname);
    
    // Clear invalid/expired cookie
    const nextResponse = NextResponse.redirect(url);
    nextResponse.cookies.delete(ACCESS_COOKIE);
    return nextResponse;
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
