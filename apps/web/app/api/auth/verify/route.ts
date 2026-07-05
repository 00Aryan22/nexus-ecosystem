import { NextRequest, NextResponse } from "next/server";

import { API_BASE } from "@/lib/constants";
import { setAccessCookie } from "@/lib/auth-cookies";

export async function POST(request: NextRequest) {
  const payload = await request.json();
  try {
    const upstream = await fetch(`${API_BASE}/auth/verify`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
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
    return response;
  } catch (error: any) {
    console.error("[Auth Proxy] verify error", { payload, error });
    return NextResponse.json(
      { error: { message: `Verify proxy failed: ${error?.message ?? "unknown"}` } },
      { status: 500 },
    );
  }
}
