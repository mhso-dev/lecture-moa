"use client";

/**
 * TeamActivityWidget Component
 * REQ-FE-234: Team Activity Widget
 */

import { FileText, UserPlus, HelpCircle, Edit, ChevronDown } from "lucide-react";
import { DashboardWidget } from "../DashboardWidget";
import { useTeamActivity, useTeamOverview } from "~/hooks/dashboard/useTeamDashboard";
import { Button } from "~/components/ui/button";
import { cn } from "~/lib/utils";
import { formatDistanceToNow } from "~/lib/date-utils";
import type { TeamActivityItemType } from "@shared";
import { useState } from "react";

/**
 * Maximum number of activities to display initially
 */
const MAX_DISPLAYED_ACTIVITIES = 10;

/**
 * Get icon for activity type
 */
function getActivityIcon(type: TeamActivityItemType) {
  switch (type) {
    case "memo_created":
      return FileText;
    case "memo_updated":
      return Edit;
    case "member_joined":
      return UserPlus;
    case "qa_asked":
      return HelpCircle;
    default:
      return FileText;
  }
}

/**
 * Get color class for activity type
 */
function getActivityColor(type: TeamActivityItemType): string {
  switch (type) {
    case "memo_created":
      return "text-blue-500 bg-blue-100 dark:bg-blue-900/30";
    case "memo_updated":
      return "text-purple-500 bg-purple-100 dark:bg-purple-900/30";
    case "member_joined":
      return "text-green-500 bg-green-100 dark:bg-green-900/30";
    case "qa_asked":
      return "text-amber-500 bg-amber-100 dark:bg-amber-900/30";
    default:
      return "text-gray-500 bg-gray-100 dark:bg-gray-900/30";
  }
}

/**
 * Props for TeamActivityWidget
 */
interface TeamActivityWidgetProps {
  /** Team ID to fetch activity for */
  teamId?: string;
}

/**
 * TeamActivityWidget displays team activity timeline.
 *
 * Features:
 * - Activity timeline: memo created/updated, member joined, Q&A asked
 * - Actor name and time ago
 * - Max 10 items, "Load more" pagination
 * - Empty state
 *
 * @example
 * ```tsx
 * <TeamActivityWidget teamId="team-123" />
 * ```
 */
export function TeamActivityWidget({ teamId = "" }: TeamActivityWidgetProps) {
  const { data: overview } = useTeamOverview(teamId);
  const { data: activitiesData, isLoading, error, refetch } = useTeamActivity({ teamId, page: 1 });

  const [currentPage, setCurrentPage] = useState(1);

  // Don't render if no team
  if (!overview && !isLoading) {
    return null;
  }

  // Limit to MAX_DISPLAYED_ACTIVITIES
  const activityItems = activitiesData?.items;
  const displayedActivities = activityItems?.slice(0, MAX_DISPLAYED_ACTIVITIES * currentPage);
  const hasMore = (activityItems?.length ?? 0) > MAX_DISPLAYED_ACTIVITIES * currentPage;

  const handleLoadMore = () => {
    setCurrentPage((prev) => prev + 1);
  };

  return (
    <DashboardWidget
      title="팀 활동"
      subtitle="최근 팀 이벤트"
      isLoading={isLoading}
      error={error?.message ?? null}
      onRetry={() => void refetch()}
      testId="team-activity-widget"
    >
      {displayedActivities && displayedActivities.length > 0 ? (
        <div className="space-y-4">
          {displayedActivities.map((activity) => {
            const Icon = getActivityIcon(activity.type);
            const colorClass = getActivityColor(activity.type);

            return (
              <div key={activity.id} className="flex gap-3">
                {/* Activity Icon */}
                <div
                  className={cn(
                    "flex-shrink-0 h-8 w-8 rounded-full flex items-center justify-center",
                    colorClass
                  )}
                >
                  <Icon className="h-4 w-4" />
                </div>

                {/* Activity Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">
                      {activity.actorName}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {activity.description}
                  </p>
                  <span className="text-xs text-muted-foreground">
                    {formatDistanceToNow(new Date(activity.createdAt))} 전
                  </span>
                </div>
              </div>
            );
          })}

          {/* Load More Button */}
          {hasMore && (
            <Button
              variant="ghost"
              size="sm"
              className="w-full"
              onClick={handleLoadMore}
            >
              <ChevronDown className="h-4 w-4 mr-2" />
              더 보기
            </Button>
          )}
        </div>
      ) : (
        <div className="text-center py-8 text-muted-foreground">
          <p className="text-sm">최근 활동이 없습니다</p>
          <p className="text-xs mt-1">
            팀원들이 협업하면 활동 내역이 여기에 표시됩니다.
          </p>
        </div>
      )}
    </DashboardWidget>
  );
}
