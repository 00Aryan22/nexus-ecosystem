import { NextRequest, NextResponse } from "next/server";

import { API_BASE } from "@/lib/constants";
import { setAccessCookie, setRefreshCookie } from "@/lib/auth-cookies";

export async function POST(request: NextRequest) {
  const cookieHeader = request.headers.get("cookie") ?? "";
  const csrfToken = request.headers.get("x-csrf-token");
  if (!csrfToken) {
    return NextResponse.json(
      { error: { message: "Forbidden: Missing CSRF token" } },
      { status: 403 },
    );
  }
  try {
    const headers: Record<string, string> = {};
    if (cookieHeader) {
      headers.Cookie = cookieHeader;
    }
    if (csrfToken) {
      headers["x-csrf-token"] = csrfToken;
    }
    const upstream = await fetch(`${API_BASE}/auth/refresh`, {
      method: "POST",
      headers,
    });

    const bodyText = await upstream.text();
    let body: any = {};

    try {
      body = bodyText ? JSON.parse(bodyText) : {};
    } catch {
      body = undefined;
    }

    const response = NextResponse.json(
      body?.data ? { data: { user: body.data.user } } : body ?? { error: { message: "Invalid response from auth service" } },
      { status: upstream.status },
    );

    if (upstream.ok && body?.data?.access_token) {
      setAccessCookie(response, body.data.access_token, 15 * 60);
    }
    if (upstream.ok && body?.data?.refresh_token) {
      setRefreshCookie(response, body.data.refresh_token, 7 * 24 * 60 * 60);
    }

    return response;
  } catch (error: any) {
    console.error("[Auth Proxy] refresh error", { error });
    return NextResponse.json(
      { error: { message: `Refresh proxy failed: ${error?.message ?? "unknown"}` } },
      { status: 500 },
    );
  }
}
