"use client";

/**
 * TeamOverviewWidget Component
 * REQ-FE-231: Team Overview Widget
 */

import Link from "next/link";
import { Users, ChevronRight, Calendar, BookOpen } from "lucide-react";
import { DashboardWidget } from "../DashboardWidget";
import { EmptyState } from "../EmptyState";
import { useTeamOverview } from "~/hooks/dashboard/useTeamDashboard";
import { formatDistanceToNow } from "~/lib/date-utils";

/**
 * TeamOverviewWidget displays team metadata and stats.
 *
 * Features:
 * - Team name, course name, member count
 * - Team description (optional)
 * - Team creation date
 * - "Manage Team" link to /teams/{teamId}
 * - No-team state with "Browse Teams" CTA
 *
 * @example
 * ```tsx
 * <TeamOverviewWidget />
 * ```
 */
export function TeamOverviewWidget() {
  const { data: overview, isLoading, error, refetch } = useTeamOverview();

  return (
    <DashboardWidget
      title="Team Overview"
      subtitle="Your team details"
      headerAction={
        overview ? (
          <Link
            href={`/teams/${overview.id}`}
            className="text-sm text-primary hover:underline flex items-center gap-1"
          >
            Manage Team
            <ChevronRight className="h-4 w-4" />
          </Link>
        ) : undefined
      }
      isLoading={isLoading}
      error={error?.message ?? null}
      onRetry={() => void refetch()}
      testId="team-overview-widget"
    >
      {overview ? (
        <div className="space-y-4">
          {/* Team Name */}
          <div>
            <h4 className="text-lg font-semibold">{overview.name}</h4>
            <p className="text-sm text-muted-foreground flex items-center gap-1.5">
              <BookOpen className="h-3.5 w-3.5" />
              {overview.courseName}
            </p>
          </div>

          {/* Stats Row */}
          <div className="flex items-center gap-4 text-sm">
            <div className="flex items-center gap-1.5 text-muted-foreground">
              <Users className="h-4 w-4" />
              <span>{overview.memberCount} members</span>
            </div>
          </div>

          {/* Description */}
          {overview.description && (
            <p className="text-sm text-muted-foreground">
              {overview.description}
            </p>
          )}

          {/* Creation Date */}
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground pt-2 border-t">
            <Calendar className="h-3.5 w-3.5" />
            <span>
              Created {formatDistanceToNow(new Date(overview.createdAt))} ago
            </span>
          </div>
        </div>
      ) : (
        <EmptyState
          icon={Users}
          title="No team yet"
          description="You are not a member of any team."
          action={{ label: "Browse Teams", href: "/teams" }}
        />
      )}
    </DashboardWidget>
  );
}
