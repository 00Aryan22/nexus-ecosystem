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

export async function fetchNonce(wallet: string) {
  console.debug("[Auth API] fetchNonce", { wallet });
  const res = await fetch(`/api/auth/nonce?wallet=${encodeURIComponent(wallet)}`);
  console.debug("[Auth API] fetchNonce response", { status: res.status, statusText: res.statusText });
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    console.error("[Auth API] fetchNonce failed", { status: res.status, body });
    throw new Error("Failed to fetch nonce");
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
  console.debug("[Auth API] fetchNonce success", { nonce: json.data.nonce });
  return json.data;
}

export async function verifySignature(payload: {
  wallet: string;
  signature: string;
  message: string;
}) {
  console.debug("[Auth API] verifySignature", { wallet: payload.wallet });
  const res = await fetch("/api/auth/verify", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  console.debug("[Auth API] verifySignature response", { status: res.status, statusText: res.statusText });

  const body = await res.json().catch(() => ({}));
  if (!res.ok) {
    console.error("[Auth API] verifySignature failed", { status: res.status, body });
    throw new Error(body?.error?.message ?? "Verification failed");
  }

  const json = body as ApiResponse<{ user: UserPublic }>;
  if (!json.data?.user) {
    console.error("[Auth API] verifySignature invalid response", { json });
    throw new Error("Invalid verify response");
  }
  console.debug("[Auth API] verifySignature success", { user: json.data.user.wallet_address });
  return json.data.user;
}

export async function fetchMe(): Promise<UserPublic | null> {
  const res = await fetch("/api/auth/me");
  if (res.status === 401) return null;
  if (!res.ok) throw new Error("Failed to fetch session");
  const json = (await res.json()) as ApiResponse<UserPublic>;
  return json.data;
}

export async function logout() {
  await fetch("/api/auth/logout", { method: "POST" });
}
