/**
 * Instructor Dashboard Page
 * REQ-FE-202, REQ-FE-203, REQ-FE-220: Instructor dashboard view
 */

import { redirect } from "next/navigation";
import { auth } from "~/lib/auth";
import { DashboardGrid } from "~/components/dashboard/DashboardGrid";
import { MyCoursesWidget } from "~/components/dashboard/instructor/MyCoursesWidget";
import { StudentActivityWidget } from "~/components/dashboard/instructor/StudentActivityWidget";
import { PendingQAWidget } from "~/components/dashboard/instructor/PendingQAWidget";
import { QuizPerformanceWidget } from "~/components/dashboard/instructor/QuizPerformanceWidget";
import { ActivityFeedWidget } from "~/components/dashboard/instructor/ActivityFeedWidget";
import { QuickActionsWidget } from "~/components/dashboard/instructor/QuickActionsWidget";
import type { Metadata } from "next";

/**
 * Page metadata for SEO and browser tab
 */
export const metadata: Metadata = {
  title: "Instructor Dashboard | lecture-moa",
  description: "Manage your courses, view student activity, and track quiz performance.",
};

/**
 * Instructor Dashboard Page
 *
 * Displays a responsive grid of widgets:
 * 1. My Courses Overview
 * 2. Student Enrollment & Activity
 * 3. Pending Q&A
 * 4. Quiz Performance Summary
 * 5. Recent Student Activity Feed
 * 6. Quick Actions
 *
 * Grid layout: 1-col (Mobile), 2-col (Tablet), 3-col (Desktop)
 *
 * Role protection: Only instructors can access this page
 */
export default async function InstructorDashboardPage() {
  const session = await auth();

  // Role protection: only instructors can access this page
  if (!session?.user) {
    redirect("/login");
  }

  if (session.user.role !== "instructor") {
    redirect("/dashboard/student");
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">
          Welcome back, {session.user.name ?? "Instructor"}! Here&apos;s an overview of your teaching activity.
        </p>
      </div>

      <DashboardGrid columns={{ mobile: 1, tablet: 2, desktop: 3 }}>
        <MyCoursesWidget />
        <StudentActivityWidget />
        <PendingQAWidget />
        <QuizPerformanceWidget />
        <ActivityFeedWidget />
        <QuickActionsWidget />
      </DashboardGrid>
    </div>
  );
}
