export const API_BASE =
  process.env.INTERNAL_API_URL ??
  process.env.NEXT_PUBLIC_API_URL ??
  "http://localhost:8000/api/v1";

export const ACCESS_COOKIE = "nexus_access_token";
export const REFRESH_COOKIE = "nexus_refresh_token";
export const CSRF_COOKIE = "nexus_csrf_token";
export const CHAIN_ID = Number(process.env.NEXT_PUBLIC_CHAIN_ID ?? 80002);
