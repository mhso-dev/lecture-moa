"use client";

/**
 * TeamOverviewWidget Component
 * REQ-FE-231: Team Overview Widget
 */

import type { Route } from "next";
import Link from "next/link";
import { Users, ChevronRight, Calendar, BookOpen } from "lucide-react";
import { DashboardWidget } from "../DashboardWidget";
import { EmptyState } from "../EmptyState";
import { useTeamOverview } from "~/hooks/dashboard/useTeamDashboard";
import { formatDistanceToNow } from "~/lib/date-utils";

/**
 * Props for TeamOverviewWidget
 */
interface TeamOverviewWidgetProps {
  /** Team ID to fetch overview for */
  teamId?: string;
}

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
 * <TeamOverviewWidget teamId="team-123" />
 * ```
 */
export function TeamOverviewWidget({ teamId = "" }: TeamOverviewWidgetProps) {
  const { data: overview, isLoading, error, refetch } = useTeamOverview(teamId);

  return (
    <DashboardWidget
      title="팀 개요"
      subtitle="나의 팀 정보"
      headerAction={
        overview ? (
          <Link
            href={`/teams/${overview.id}` as Route}
            className="text-sm text-primary hover:underline flex items-center gap-1"
          >
            팀 관리
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
              <span>{overview.memberCount}명</span>
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
              {formatDistanceToNow(new Date(overview.createdAt))} 전 생성
            </span>
          </div>
        </div>
      ) : (
        <EmptyState
          icon={Users}
          title="아직 팀이 없습니다"
          description="소속된 팀이 없습니다."
          action={{ label: "팀 둘러보기", href: "/teams" as Route }}
        />
      )}
    </DashboardWidget>
  );
}
