import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

export async function handleSupabaseCookies(request: NextRequest) {
  const response = NextResponse.next();

  // Skip Supabase session refresh if env vars are not configured
  // (e.g. in CI or local dev without Supabase)
  if (!supabaseUrl || !supabaseKey) {
    return response;
  }

  try {
    const { createServerClient } = await import("@supabase/ssr");
    const supabase = createServerClient(supabaseUrl, supabaseKey, {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            if (name && value != null) {
              response.cookies.set(name, value, options);
            }
          });
        },
      },
    });

    await supabase.auth.getSession();
  } catch {
    // Ignore session refresh failures — non-critical for routing
  }

  return response;
}
