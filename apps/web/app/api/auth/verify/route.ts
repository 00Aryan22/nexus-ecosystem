import { NextRequest, NextResponse } from "next/server";

import { API_BASE } from "@/lib/constants";
import { setAccessCookie } from "@/lib/auth-cookies";

export async function POST(request: NextRequest) {
  const payload = await request.json();
  const upstream = await fetch(`${API_BASE}/auth/verify`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  const body = await upstream.json();
  const response = NextResponse.json(
    body.data ? { data: { user: body.data.user } } : body,
    { status: upstream.status },
  );

  if (upstream.ok && body.data?.access_token) {
    setAccessCookie(response, body.data.access_token, 15 * 60);
  }
  return response;
}
