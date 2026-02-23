/**
 * RecentQAWidget Component
 * REQ-FE-212: Recent Q&A Activity Widget
 */

import type { Route } from "next";
import Link from "next/link";
import { MessageCircleQuestion, ChevronRight } from "lucide-react";
import { DashboardWidget } from "../DashboardWidget";
import { EmptyState } from "../EmptyState";
import { useRecentQA } from "~/hooks/dashboard/useStudentDashboard";
import { Badge } from "~/components/ui/badge";
import { cn } from "~/lib/utils";
import { formatDistanceToNow } from "~/lib/date-utils";

/**
 * Maximum number of Q&A items to display
 */
const MAX_DISPLAYED_ITEMS = 5;

/**
 * Status badge configuration
 */
const STATUS_CONFIG = {
  answered: {
    variant: "default" as const,
    className: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
    label: "답변 완료",
  },
  pending: {
    variant: "secondary" as const,
    className: "bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200",
    label: "대기 중",
  },
};

/**
 * RecentQAWidget displays the student's recent Q&A interactions
 *
 * Features:
 * - Question excerpt (max 80 chars)
 * - Course name
 * - Status badge (Answered green, Pending amber)
 * - Timestamp
 * - Maximum 5 items
 * - "View all Q&A" link to /qa
 * - Empty state
 *
 * @example
 * ```tsx
 * <RecentQAWidget />
 * ```
 */
export function RecentQAWidget() {
  const { data: qaItems, isLoading, error, refetch } = useRecentQA();

  const displayedItems = qaItems?.slice(0, MAX_DISPLAYED_ITEMS);
  const hasMore = (qaItems?.length ?? 0) > MAX_DISPLAYED_ITEMS;

  return (
    <DashboardWidget
      title="최근 Q&A"
      subtitle="나의 최근 질문"
      headerAction={
        qaItems && qaItems.length > 0 ? (
          <Link
            href={"/qa" as Route}
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
      testId="recent-qa-widget"
    >
      {displayedItems && displayedItems.length > 0 ? (
        <div className="space-y-3">
          {displayedItems.map((item) => {
            const statusConfig = STATUS_CONFIG[item.status];
            return (
              <Link
                key={item.id}
                href={`/qa/${item.id}` as Route}
                className="block group"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm truncate group-hover:text-primary transition-colors">
                      {item.questionExcerpt}
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-xs text-muted-foreground">
                        {item.courseName}
                      </span>
                      <span className="text-xs text-muted-foreground">-</span>
                      <span className="text-xs text-muted-foreground">
                        {formatDistanceToNow(new Date(item.createdAt))}
                      </span>
                    </div>
                  </div>
                  <Badge
                    variant={statusConfig.variant}
                    className={cn("text-xs", statusConfig.className)}
                  >
                    {statusConfig.label}
                  </Badge>
                </div>
              </Link>
            );
          })}

          {hasMore && qaItems && (
            <Link
              href={"/qa" as Route}
              className="block text-sm text-center text-primary hover:underline pt-2"
            >
              {qaItems.length - MAX_DISPLAYED_ITEMS}개의 질문 더 보기
            </Link>
          )}
        </div>
      ) : (
        <EmptyState
          icon={MessageCircleQuestion}
          title="Q&A 활동이 없습니다"
          description="아직 Q&A 활동이 없습니다."
          action={{ label: "자료 둘러보기", href: "/materials" as Route }}
        />
      )}
    </DashboardWidget>
  );
}
