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
  const res = await fetch(`/api/auth/nonce?wallet=${encodeURIComponent(wallet)}`);
  if (!res.ok) {
    throw new Error("Failed to fetch nonce");
  }
  const json = (await res.json()) as ApiResponse<{
    nonce: string;
    message: string;
    expires_at: string;
  }>;
  if (!json.data) throw new Error("Invalid nonce response");
  return json.data;
}

export async function verifySignature(payload: {
  wallet: string;
  signature: string;
  message: string;
}) {
  const res = await fetch("/api/auth/verify", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err?.error?.message ?? "Verification failed");
  }
  const json = (await res.json()) as ApiResponse<{ user: UserPublic }>;
  if (!json.data?.user) throw new Error("Invalid verify response");
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
