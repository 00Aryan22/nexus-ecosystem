import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import { API_BASE, ACCESS_COOKIE } from "@/lib/constants";
import { setAccessCookie, setRefreshCookie } from "@/lib/auth-cookies";

async function refreshSession(cookieHeader: string, csrfToken: string | null) {
  const headers: Record<string, string> = {};
  if (cookieHeader) {
    headers.Cookie = cookieHeader;
  }
  if (csrfToken) {
    headers["x-csrf-token"] = csrfToken;
  }
  return fetch(`${API_BASE}/auth/refresh`, {
    method: "POST",
    headers,
  });
}

export async function GET(request: Request) {
  const cookieStore = await cookies();
  const token = cookieStore.get(ACCESS_COOKIE)?.value;
  const cookieHeader = request.headers.get("cookie") ?? "";
  const csrfToken = request.headers.get("x-csrf-token");
  if (!csrfToken) {
    return NextResponse.json(
      { error: { message: "Forbidden: Missing CSRF token" } },
      { status: 403 },
    );
  }

  const tryMe = async (authToken: string | null) => {
    const headers: HeadersInit = { "Cache-Control": "no-store" };
    if (authToken) {
      headers.Authorization = `Bearer ${authToken}`;
    }
    return fetch(`${API_BASE}/auth/me`, { headers, cache: "no-store" });
  };

  const upstream = await tryMe(token ?? null);
  if (upstream.status === 401 && cookieHeader) {
    const refreshResponse = await refreshSession(cookieHeader, csrfToken ?? null);
    const refreshBody = await refreshResponse.json().catch(() => ({}));

    const response = refreshResponse.ok
      ? NextResponse.json(
          { data: refreshBody?.data?.user ?? null, error: refreshBody?.error ?? null },
          { status: refreshResponse.status },
        )
      : NextResponse.json(
          { error: { message: "Session refresh failed" } },
          { status: refreshResponse.status },
        );

    if (refreshResponse.ok && refreshBody?.data?.access_token) {
      setAccessCookie(response, refreshBody.data.access_token, 15 * 60);
    }
    if (refreshResponse.ok && refreshBody?.data?.refresh_token) {
      setRefreshCookie(response, refreshBody.data.refresh_token, 7 * 24 * 60 * 60);
    }
    return response;
  }

  const body = await upstream.json();
  return NextResponse.json(body, { status: upstream.status });
}
