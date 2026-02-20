import { type NextRequest, NextResponse } from "next/server";

import { updateSession } from "./lib/supabase/middleware";

/**
 * Protected route prefixes that require authentication
 */
const PROTECTED_PREFIXES = [
  "/dashboard",
  "/profile",
  "/courses",
  "/materials",
  "/quizzes",
  "/teams",
  "/memos",
  "/qa",
];

/**
 * Auth routes - redirect to dashboard if already authenticated
 */
const AUTH_ROUTES = ["/login", "/register"];

/**
 * Instructor-only route prefixes
 */
const INSTRUCTOR_ONLY_PREFIXES = [
  "/courses/create",
  "/courses/settings",
  "/materials/upload",
  "/materials/editor",
  "/quizzes/create",
  "/quizzes/manage",
];

/**
 * Student-only route prefixes
 */
const STUDENT_ONLY_PREFIXES = [
  "/quizzes/taking",
];

/**
 * Middleware for route protection using Supabase Auth
 *
 * - Refreshes the auth session on every request via updateSession()
 * - Protects dashboard and feature routes from unauthenticated access
 * - Redirects authenticated users away from login/register pages
 * - Enforces role-based access for instructor and student routes
 * - Passes through public routes (/, /api, /reset-password)
 */
export async function middleware(request: NextRequest) {
  const { response, user } = await updateSession(request);
  const { pathname } = request.nextUrl;

  // Allow auth callback to proceed without any route protection
  if (pathname.startsWith("/auth/callback")) {
    return response;
  }

  // Check if the current path matches any protected prefix
  const isProtectedRoute = PROTECTED_PREFIXES.some((prefix) =>
    pathname.startsWith(prefix)
  );

  // Check if the current path is an auth route
  const isAuthRoute = AUTH_ROUTES.some((route) =>
    pathname.startsWith(route)
  );

  // Redirect unauthenticated users from protected routes to login
  if (isProtectedRoute && !user) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("callbackUrl", encodeURIComponent(pathname));
    return NextResponse.redirect(loginUrl);
  }

  // Redirect authenticated users from auth routes to dashboard
  if (isAuthRoute && user) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  // Role-based guards for authenticated users
  if (user) {
    const userRole = user.user_metadata?.role;

    // Instructor-only routes: redirect students to dashboard
    const isInstructorOnly = INSTRUCTOR_ONLY_PREFIXES.some((prefix) =>
      pathname.startsWith(prefix)
    );
    if (isInstructorOnly && userRole === "student") {
      return NextResponse.redirect(new URL("/dashboard", request.url));
    }

    // Student-only routes: redirect instructors to dashboard
    const isStudentOnly = STUDENT_ONLY_PREFIXES.some((prefix) =>
      pathname.startsWith(prefix)
    );
    if (isStudentOnly && userRole === "instructor") {
      return NextResponse.redirect(new URL("/dashboard", request.url));
    }
  }

  // Return the response from updateSession (contains refreshed session cookies)
  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - api (API routes handled separately)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    "/((?!api|_next/static|_next/image|favicon.ico).*)",
  ],
};
