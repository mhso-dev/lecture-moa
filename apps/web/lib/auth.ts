/**
 * Server-side Auth Utilities (Supabase Auth)
 *
 * This file provides server-side auth utilities for:
 * - React Server Components (RSC)
 * - Route Handlers
 * - Server Actions
 *
 * For client-side auth actions (signIn, signOut, signUp),
 * use hooks/useAuth.ts instead.
 */

import { createClient } from "~/lib/supabase/server";

/**
 * Get the currently authenticated user (server-side).
 *
 * Uses getUser() which validates the token against
 * the Supabase Auth server (more secure than getSession).
 *
 * @returns The authenticated Supabase user, or null if not authenticated.
 */
export async function getUser() {
  const supabase = await createClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) return null;
  return user;
}

/**
 * Get the current session (server-side).
 *
 * Use only when the access_token is needed (e.g., to forward to an API).
 * Prefer getUser() for authentication checks because it validates
 * the token against the Supabase Auth server.
 *
 * @returns The current Supabase session, or null if not authenticated.
 */
export async function getSession() {
  const supabase = await createClient();
  const {
    data: { session },
    error,
  } = await supabase.auth.getSession();

  if (error || !session) return null;
  return session;
}
