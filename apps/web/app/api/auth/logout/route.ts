import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import { API_BASE } from "@/lib/constants";
import { ACCESS_COOKIE } from "@/lib/constants";
import { clearAccessCookie } from "@/lib/auth-cookies";

export async function POST() {
  const cookieStore = await cookies();
  const token = cookieStore.get(ACCESS_COOKIE)?.value;

  if (token) {
    await fetch(`${API_BASE}/auth/logout`, {
      method: "POST",
      headers: { Cookie: `${ACCESS_COOKIE}=${token}` },
    }).catch(() => undefined);
  }

  const response = NextResponse.json({ data: { logged_out: true } });
  clearAccessCookie(response);
  return response;
}
