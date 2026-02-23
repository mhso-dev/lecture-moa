"use client";

/**
 * ActivityFeedWidget Component
 * REQ-FE-225: Recent Student Activity Feed Widget
 */

import { useState } from "react";
import type { Route } from "next";
import Link from "next/link";
import {
  UserPlus,
  BookOpen,
  MessageCircle,
  CheckCircle,
  ChevronRight,
  Loader2,
} from "lucide-react";
import { DashboardWidget } from "../DashboardWidget";
import { EmptyState } from "../EmptyState";
import { useActivityFeed } from "~/hooks/dashboard/useInstructorDashboard";
import type { ActivityFeedItemType } from "@shared";
import { Button } from "~/components/ui/button";

/**
 * Get icon for activity type
 */
function getActivityIcon(type: ActivityFeedItemType) {
  switch (type) {
    case "enrolled":
      return UserPlus;
    case "studied":
      return BookOpen;
    case "asked":
      return MessageCircle;
    case "quiz_completed":
      return CheckCircle;
    default:
      return UserPlus;
  }
}

/**
 * Get description for activity type
 */
function getActivityDescription(type: ActivityFeedItemType) {
  switch (type) {
    case "enrolled":
      return "에 등록했습니다:";
    case "studied":
      return "에서 학습했습니다:";
    case "asked":
      return "에서 질문했습니다:";
    case "quiz_completed":
      return "에서 퀴즈를 완료했습니다:";
    default:
      return "에서 활동했습니다:";
  }
}

/**
 * ActivityFeedWidget displays a chronological feed of recent student activities
 * across the instructor's courses.
 *
 * Features:
 * - Activity type icon (enrolled, studied, asked, quiz_completed)
 * - Student name, course name, time ago
 * - Maximum 10 items per page
 * - Pagination with "Load more" button
 * - Empty state with "No recent activity"
 *
 * @example
 * ```tsx
 * <ActivityFeedWidget />
 * ```
 */
export function ActivityFeedWidget() {
  const [page, setPage] = useState(1);
  const { data, isLoading, error, refetch, isFetching } = useActivityFeed({ page });

  const handleLoadMore = () => {
    setPage((prev) => prev + 1);
  };

  const hasNextPage = data?.hasMore ?? false;

  return (
    <DashboardWidget
      title="활동 피드"
      subtitle="최근 학생 활동"
      headerAction={
        data?.items && data.items.length > 0 ? (
          <Link
            href={"/activity" as Route}
            className="text-sm text-primary hover:underline flex items-center gap-1"
          >
            전체 보기
            <ChevronRight className="h-4 w-4" />
          </Link>
        ) : undefined
      }
      isLoading={isLoading}
      error={error?.message ?? null}
      onRetry={() => void refetch()}
      testId="activity-feed-widget"
    >
      {data?.items && data.items.length > 0 ? (
        <div className="space-y-4">
          {data.items.map((item) => {
            const Icon = getActivityIcon(item.type);
            const description = getActivityDescription(item.type);

            return (
              <div key={item.id} className="flex items-start gap-3">
                <div className="p-2 rounded-full bg-muted shrink-0">
                  <Icon className="h-4 w-4 text-muted-foreground" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm">
                    <span className="font-medium">{item.actorName}</span>{" "}
                    <span className="text-muted-foreground">{description}</span>{" "}
                    <span className="font-medium">{item.courseName}</span>
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {new Date(item.createdAt).toLocaleDateString()}
                  </p>
                </div>
              </div>
            );
          })}

          {hasNextPage && (
            <Button
              variant="outline"
              size="sm"
              className="w-full"
              onClick={handleLoadMore}
              disabled={isFetching}
            >
              {isFetching ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  로딩 중...
                </>
              ) : (
                "더 보기"
              )}
            </Button>
          )}
        </div>
      ) : (
        <EmptyState
          icon={UserPlus}
          title="최근 활동이 없습니다"
          description="학생 활동이 여기에 표시됩니다."
        />
      )}
    </DashboardWidget>
  );
}
