import { NextRequest, NextResponse } from "next/server";

import { API_BASE } from "@/lib/constants";

export async function GET(request: NextRequest) {
  const wallet = request.nextUrl.searchParams.get("wallet");
  if (!wallet) {
    return NextResponse.json({ error: { message: "wallet required" } }, { status: 422 });
  }

  try {
    const upstream = await fetch(
      `${API_BASE}/auth/nonce?wallet=${encodeURIComponent(wallet)}`,
    );
    const bodyText = await upstream.text();
    let parsed: unknown;

    try {
      parsed = bodyText ? JSON.parse(bodyText) : {};
    } catch {
      parsed = undefined;
    }

    if (parsed !== undefined) {
      const response = NextResponse.json(parsed, { status: upstream.status });
      const setCookie = upstream.headers.get("set-cookie");
      if (setCookie) {
        response.headers.append("set-cookie", setCookie);
      }
      return response;
    }

    return NextResponse.json(
      {
        error: {
          message: upstream.ok
            ? "Invalid JSON response from auth service"
            : bodyText || "Nonce proxy received an invalid response",
        },
      },
      { status: upstream.ok ? 502 : upstream.status },
    );
  } catch (error: any) {
    console.error("[Auth Proxy] nonce error", { wallet, error });
    return NextResponse.json(
      { error: { message: `Nonce proxy failed: ${error?.message ?? "unknown"}` } },
      { status: 500 },
    );
  }
}
