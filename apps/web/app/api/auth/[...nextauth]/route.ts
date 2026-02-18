import { handlers } from "~/lib/auth";

/**
 * NextAuth API Route Handler
 *
 * This route handles all authentication requests:
 * - GET /api/auth/signin - Sign in page
 * - GET /api/auth/signout - Sign out page
 * - GET /api/auth/callback/:provider - OAuth callback
 * - GET /api/auth/session - Get session
 * - POST /api/auth/signin/:provider - Sign in action
 * - POST /api/auth/signout - Sign out action
 *
 * @see https://authjs.dev/getting-started/installation#route-handler
 */
export const { GET, POST } = handlers;
