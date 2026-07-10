import { CSRF_COOKIE } from "@/lib/constants";

export type UserPublic = {
  id: string;
  wallet_address: string;
  username: string | null;
  role: string;
  is_active: boolean;
};

type ApiResponse<T> = {
  data: T | null;
  error: { message?: string } | null;
};

function readCookie(name: string): string | undefined {
  if (typeof document === "undefined") return undefined;
  const cookie = document.cookie;
  const match = cookie.match(new RegExp(`(?:^|; )${name}=([^;]*)`));
  return match?.[1];
}

export async function fetchNonce(wallet: string) {
  const res = await fetch(`/api/auth/nonce?wallet=${encodeURIComponent(wallet)}`);
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    let detail = "Failed to fetch nonce";
    try { const parsed = JSON.parse(body); if (parsed?.error?.message) detail = parsed.error.message; } catch {}
    console.error("[Auth API] fetchNonce failed", { status: res.status, body });
    throw new Error(detail);
  }
  const json = (await res.json()) as ApiResponse<{
    nonce: string;
    message: string;
    expires_at: string;
  }>;
  if (!json.data) {
    console.error("[Auth API] fetchNonce invalid response", { json });
    throw new Error("Invalid nonce response");
  }
  return json.data;
}

export async function verifySignature(payload: {
  wallet: string;
  signature: string;
  message: string;
}) {
  const csrfToken = readCookie(CSRF_COOKIE);
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (csrfToken) {
    headers["x-csrf-token"] = csrfToken;
  }
  const res = await fetch("/api/auth/verify", {
    method: "POST",
    headers,
    body: JSON.stringify(payload),
  });

  const body = await res.json().catch(() => ({}));
  if (!res.ok) {
    console.error("[Auth API] verifySignature failed", { status: res.status, body });
    const errMsg = body?.error?.message ?? body?.detail ?? "Verification failed";
    throw new Error(errMsg);
  }

  const json = body as ApiResponse<{ user: UserPublic }>;
  if (!json.data?.user) {
    console.error("[Auth API] verifySignature invalid response", { json });
    throw new Error("Invalid verify response");
  }
  return json.data.user;
}

export async function fetchMe(): Promise<UserPublic | null> {
  const csrfToken = readCookie(CSRF_COOKIE);
  const headers: HeadersInit = { "Cache-Control": "no-store" };
  if (csrfToken) {
    headers["x-csrf-token"] = csrfToken;
  }
  const res = await fetch("/api/auth/me", {
    headers,
    cache: "no-store",
    credentials: "same-origin",
  });
  if (res.status === 401) return null;
  if (!res.ok) throw new Error("Failed to fetch session");
  const json = (await res.json()) as ApiResponse<UserPublic>;
  return json.data;
}

export async function logout() {
  const csrfToken = readCookie("nexus_csrf_token");
  const headers: Record<string, string> = {};
  if (csrfToken) {
    headers["x-csrf-token"] = csrfToken;
  }
  await fetch("/api/auth/logout", { method: "POST", headers });
}
