/**
 * Legacy NextAuth API Route Handler (DEPRECATED)
 *
 * This route is kept as a stub to prevent 404 errors during the
 * transition period. All authentication is now handled by Supabase Auth.
 *
 * OAuth callbacks are handled by /auth/callback/route.ts.
 * Client-side auth actions use hooks/useAuth.ts.
 * Server-side auth checks use lib/auth.ts (getUser/getSession).
 */

import { NextResponse } from "next/server";

export function GET() {
  return NextResponse.json(
    { error: "NextAuth has been replaced by Supabase Auth" },
    { status: 410 }
  );
}

export function POST() {
  return NextResponse.json(
    { error: "NextAuth has been replaced by Supabase Auth" },
    { status: 410 }
  );
}
