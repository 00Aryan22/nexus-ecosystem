import { NextResponse } from "next/server";

import { API_BASE } from "@/lib/constants";
import { clearAccessCookie, clearRefreshCookie, getCsrfTokenFromCookieHeader } from "@/lib/auth-cookies";

export async function POST(request: Request) {
  const cookieHeader = request.headers.get("cookie");
  const csrfToken = request.headers.get("x-csrf-token") ?? getCsrfTokenFromCookieHeader(cookieHeader);

  if (cookieHeader) {
    const headers: Record<string, string> = { Cookie: cookieHeader };
    if (csrfToken) {
      headers["x-csrf-token"] = csrfToken;
    }
    await fetch(`${API_BASE}/auth/logout`, {
      method: "POST",
      headers,
    }).catch(() => undefined);
  }

  const response = NextResponse.json({ data: { logged_out: true } });
  clearAccessCookie(response);
  clearRefreshCookie(response);
  return response;
}
