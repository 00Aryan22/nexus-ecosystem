import { ACCESS_COOKIE } from "@/lib/constants";

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

export function clearAccessCookie(response: Response) {
  response.headers.append(
    "Set-Cookie",
    `${ACCESS_COOKIE}=; HttpOnly; Path=/; SameSite=Lax; Max-Age=0${
      COOKIE_OPTS.secure ? "; Secure" : ""
    }`,
  );
}

export function readAccessCookie(request: Request): string | undefined {
  const cookie = request.headers.get("cookie") ?? "";
  const match = cookie.match(new RegExp(`(?:^|; )${ACCESS_COOKIE}=([^;]*)`));
  return match?.[1];
}
