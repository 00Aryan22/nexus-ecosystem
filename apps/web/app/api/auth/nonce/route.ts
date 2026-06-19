import { NextRequest, NextResponse } from "next/server";

import { API_BASE } from "@/lib/constants";

export async function GET(request: NextRequest) {
  const wallet = request.nextUrl.searchParams.get("wallet");
  if (!wallet) {
    return NextResponse.json({ error: { message: "wallet required" } }, { status: 422 });
  }

  const upstream = await fetch(
    `${API_BASE}/auth/nonce?wallet=${encodeURIComponent(wallet)}`,
  );
  const body = await upstream.json();
  return NextResponse.json(body, { status: upstream.status });
}
