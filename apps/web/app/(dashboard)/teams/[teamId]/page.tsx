/**
 * Team Detail Page
 * TASK-023: Team detail page with tabs
 * REQ-FE-720: Team detail page route
 */

import { Suspense } from "react";
import { TeamDetailContent } from "./TeamDetailContent";

interface TeamDetailPageProps {
  params: Promise<{
    teamId: string;
  }>;
}

/**
 * Team Detail Page - Server Component wrapper
 * Renders the team detail content with tabs.
 *
 * Tabs: Members | Shared Materials | Team Memos | Activity
 * Default active tab: Members
 */
export default async function TeamDetailPage({ params }: TeamDetailPageProps) {
  const { teamId } = await params;

  return (
    <Suspense fallback={<TeamDetailLoading />}>
      <TeamDetailContent teamId={teamId} />
    </Suspense>
  );
}

/**
 * Loading skeleton for team detail page
 */
function TeamDetailLoading() {
  return (
    <div className="space-y-4">
      <div className="h-10 bg-muted rounded animate-pulse" />
      <div className="h-64 bg-muted rounded animate-pulse" />
    </div>
  );
}
