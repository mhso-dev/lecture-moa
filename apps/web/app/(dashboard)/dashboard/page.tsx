/**
 * Dashboard Root Redirect Hub
 * REQ-FE-200, REQ-FE-201: Role-based redirect to appropriate dashboard
 */

import { redirect } from "next/navigation";
import { auth } from "~/lib/auth";

/**
 * Dashboard Root Page - Redirects to role-appropriate dashboard
 *
 * Redirect logic:
 * - instructor role -> /dashboard/instructor
 * - student role -> /dashboard/student
 * - no session -> /login (handled by middleware, but also here as safety net)
 */
export default async function DashboardRootPage() {
  const session = await auth();

  // Safety net redirect if no session (should be caught by middleware)
  if (!session?.user) {
    redirect("/login");
  }

  const { role } = session.user;

  // Role-based redirect
  switch (role) {
    case "instructor":
      redirect("/dashboard/instructor");
      break; // unreachable but required for lint
    case "student":
      redirect("/dashboard/student");
      break; // unreachable but required for lint
    case "admin":
      // Admin defaults to instructor dashboard for now
      redirect("/dashboard/instructor");
      break; // unreachable but required for lint
    default:
      // Fallback for unknown roles
      redirect("/dashboard/student");
      break; // unreachable but required for lint
  }
}
