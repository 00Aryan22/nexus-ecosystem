import { createServerClient } from "@supabase/ssr";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

export async function handleSupabaseCookies(request: NextRequest) {
  const supabaseResponse = NextResponse.next();

  const supabase = createServerClient(
    supabaseUrl!,
    supabaseKey!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            if (name && value != null) {
              supabaseResponse.cookies.set(name, value, options);
            }
          });
        },
      },
    },
  );

  try {
    await supabase.auth.getSession();
  } catch {
    // Ignore session refresh failures in middleware.
  }

  return supabaseResponse;
};
