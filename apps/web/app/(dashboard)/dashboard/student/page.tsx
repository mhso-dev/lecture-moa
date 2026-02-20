/**
 * Student Dashboard Page
 * REQ-FE-202, REQ-FE-203, REQ-FE-210: Student dashboard view
 */

import { redirect } from "next/navigation";
import { getUser } from "~/lib/auth";
import { DashboardGrid } from "~/components/dashboard/DashboardGrid";
import { EnrolledCoursesWidget } from "~/components/dashboard/student/EnrolledCoursesWidget";
import { RecentQAWidget } from "~/components/dashboard/student/RecentQAWidget";
import { QuizScoresWidget } from "~/components/dashboard/student/QuizScoresWidget";
import { StudyProgressWidget } from "~/components/dashboard/student/StudyProgressWidget";
import { UpcomingQuizzesWidget } from "~/components/dashboard/student/UpcomingQuizzesWidget";
import { QANotificationsWidget } from "~/components/dashboard/student/QANotificationsWidget";
import type { Metadata } from "next";

/**
 * Page metadata for SEO and browser tab
 */
export const metadata: Metadata = {
  title: "Dashboard | lecture-moa",
  description: "View your enrolled courses, study progress, and recent activity.",
};

/**
 * Student Dashboard Page
 *
 * Displays a responsive grid of widgets:
 * 1. Enrolled Courses Progress
 * 2. Recent Q&A Activity
 * 3. Quiz Scores Summary
 * 4. Study Progress / Streaks
 * 5. Upcoming / Pending Quizzes
 * 6. Q&A Notifications
 *
 * Grid layout: 1-col (Mobile), 2-col (Tablet), 3-col (Desktop)
 */
export default async function StudentDashboardPage() {
  const user = await getUser();

  // Role protection: only students can access this page
  const role = user?.user_metadata?.role as string | undefined;
  if (!user || role !== "student") {
    redirect("/dashboard/instructor");
  }

  const name = (user.user_metadata?.name as string) ?? "Student";

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">
          Welcome back, {name}! Here&apos;s your learning progress.
        </p>
      </div>

      <DashboardGrid columns={{ mobile: 1, tablet: 2, desktop: 3 }}>
        <EnrolledCoursesWidget />
        <StudyProgressWidget />
        <QuizScoresWidget />
        <RecentQAWidget />
        <UpcomingQuizzesWidget />
        <QANotificationsWidget />
      </DashboardGrid>
    </div>
  );
}
