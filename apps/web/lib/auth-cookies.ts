import { ACCESS_COOKIE, CSRF_COOKIE, REFRESH_COOKIE } from "@/lib/constants";

const COOKIE_OPTS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax" as const,
  path: "/",
};

export function setAccessCookie(
  response: Response,
  token: string,
  maxAgeSeconds: number,
) {
  response.headers.append(
    "Set-Cookie",
    `${ACCESS_COOKIE}=${token}; HttpOnly; Path=/; SameSite=Lax; Max-Age=${maxAgeSeconds}${
      COOKIE_OPTS.secure ? "; Secure" : ""
    }`,
  );
}

export function setCsrfCookie(
  response: Response,
  token: string,
  maxAgeSeconds: number,
) {
  response.headers.append(
    "Set-Cookie",
    `${CSRF_COOKIE}=${token}; Path=/; SameSite=Lax; Max-Age=${maxAgeSeconds}${
      COOKIE_OPTS.secure ? "; Secure" : ""
    }`,
  );
}

export function setRefreshCookie(
  response: Response,
  token: string,
  maxAgeSeconds: number,
) {
  response.headers.append(
    "Set-Cookie",
    `${REFRESH_COOKIE}=${token}; HttpOnly; Path=/; SameSite=Lax; Max-Age=${maxAgeSeconds}${
      COOKIE_OPTS.secure ? "; Secure" : ""
    }`,
  );
}

export function clearAccessCookie(response: Response) {
  response.headers.append(
    "Set-Cookie",
    `${ACCESS_COOKIE}=; HttpOnly; Path=/; SameSite=Lax; Max-Age=0${
      COOKIE_OPTS.secure ? "; Secure" : ""
    }`,
  );
}

export function clearRefreshCookie(response: Response) {
  response.headers.append(
    "Set-Cookie",
    `${REFRESH_COOKIE}=; HttpOnly; Path=/; SameSite=Lax; Max-Age=0${
      COOKIE_OPTS.secure ? "; Secure" : ""
    }`,
  );
}

export function readAccessCookie(request: Request): string | undefined {
  const cookie = request.headers.get("cookie") ?? "";
  const match = cookie.match(new RegExp(`(?:^|; )${ACCESS_COOKIE}=([^;]*)`));
  return match?.[1];
}

export function getCsrfTokenFromCookieHeader(cookieHeader: string | null | undefined): string | undefined {
  if (!cookieHeader) return undefined;
  const match = cookieHeader.match(new RegExp(`(?:^|; )${CSRF_COOKIE}=([^;]*)`));
  return match?.[1];
}

export function readCookie(name: string): string | undefined {
  if (typeof document === "undefined") return undefined;
  const cookie = document.cookie;
  const match = cookie.match(new RegExp(`(?:^|; )${name}=([^;]*)`));
  return match?.[1];
}
