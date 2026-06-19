import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import { API_BASE, ACCESS_COOKIE } from "@/lib/constants";

export async function GET() {
  const cookieStore = await cookies();
  const token = cookieStore.get(ACCESS_COOKIE)?.value;

  if (!token) {
    return NextResponse.json({ error: { message: "Not authenticated" } }, { status: 401 });
  }

  const upstream = await fetch(`${API_BASE}/auth/me`, {
    headers: { Authorization: `Bearer ${token}` },
    cache: "no-store",
  });
  const body = await upstream.json();
  return NextResponse.json(body, { status: upstream.status });
}
