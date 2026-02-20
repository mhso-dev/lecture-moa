import { createClient } from "~/lib/supabase/server";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

/**
 * OAuth Callback Route Handler
 *
 * Handles the redirect from Supabase Auth after an OAuth sign-in.
 * Exchanges the authorization code for a session, then redirects
 * the user to the intended destination (or /dashboard by default).
 *
 * @param request - The incoming request with code and next query params
 */
export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const next = requestUrl.searchParams.get("next") ?? "/dashboard";
  const origin = requestUrl.origin;

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  // Return to login page on error
  return NextResponse.redirect(`${origin}/login?error=auth_callback_failed`);
}
