/**
 * Team Dashboard Page
 * REQ-FE-202, REQ-FE-203, REQ-FE-230: Team dashboard view
 */

import { redirect } from "next/navigation";
import { getUser } from "~/lib/auth";
import { DashboardGrid } from "~/components/dashboard/DashboardGrid";
import { TeamOverviewWidget } from "~/components/dashboard/team/TeamOverviewWidget";
import { TeamMembersWidget } from "~/components/dashboard/team/TeamMembersWidget";
import { SharedMemosFeedWidget } from "~/components/dashboard/team/SharedMemosFeedWidget";
import { TeamActivityWidget } from "~/components/dashboard/team/TeamActivityWidget";
import type { Metadata } from "next";

/**
 * Page metadata for SEO and browser tab
 */
export const metadata: Metadata = {
  title: "Team Dashboard | lecture-moa",
  description: "View your team activity, shared memos, and collaboration.",
};

/**
 * Team Dashboard Page
 *
 * Displays a responsive grid of widgets:
 * 1. Team Overview (team info, member count)
 * 2. Team Members (member list with activity status)
 * 3. Shared Memos Feed (team memos)
 * 4. Team Activity (recent activity timeline)
 *
 * Grid layout: 1-col (Mobile), 2-col (Tablet), 2-col (Desktop)
 *
 * Role protection: Only students can access this page
 */
export default async function TeamDashboardPage() {
  const user = await getUser();

  // Role protection: only students can access this page
  const role = user?.user_metadata.role as string | undefined;
  if (!user || role !== "student") {
    redirect("/dashboard/instructor");
  }

  const name = (user.user_metadata.name as string | undefined) ?? "Student";

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Team Dashboard</h1>
        <p className="text-muted-foreground">
          Welcome back, {name}! Here&apos;s your team activity.
        </p>
      </div>

      <DashboardGrid columns={{ mobile: 1, tablet: 2, desktop: 2 }}>
        <TeamOverviewWidget />
        <TeamMembersWidget />
        <SharedMemosFeedWidget />
        <TeamActivityWidget />
      </DashboardGrid>
    </div>
  );
}
