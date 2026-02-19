/**
 * PendingQAWidget Component
 * REQ-FE-223: Pending Q&A Widget
 */

import Link from "next/link";
import { CheckCircle, ChevronRight, AlertTriangle } from "lucide-react";
import { DashboardWidget } from "../DashboardWidget";
import { EmptyState } from "../EmptyState";
import { usePendingQA } from "~/hooks/dashboard/useInstructorDashboard";
import { Badge } from "~/components/ui/badge";

/**
 * Maximum number of questions to display in the widget
 */
const MAX_DISPLAYED_ITEMS = 5;

/**
 * PendingQAWidget displays Q&A questions awaiting the instructor's response.
 *
 * Features:
 * - Question excerpt, student name, course name
 * - Time since asked
 * - Ordered by oldest first (longest unanswered)
 * - "Answer" button linking to Q&A detail
 * - Urgent badge for questions older than 48 hours
 * - Maximum 5 items
 * - "View all Q&A" link to /qa
 * - Empty state with green checkmark icon
 *
 * @example
 * ```tsx
 * <PendingQAWidget />
 * ```
 */
export function PendingQAWidget() {
  const { data: items, isLoading, error, refetch } = usePendingQA();

  // Limit to MAX_DISPLAYED_ITEMS
  const displayedItems = items?.slice(0, MAX_DISPLAYED_ITEMS);
  const hasMore = (items?.length ?? 0) > MAX_DISPLAYED_ITEMS;

  return (
    <DashboardWidget
      title="Pending Q&A"
      subtitle="Questions awaiting response"
      headerAction={
        items && items.length > 0 ? (
          <Link
            href="/qa"
            className="text-sm text-primary hover:underline flex items-center gap-1"
          >
            View all
            <ChevronRight className="h-4 w-4" />
          </Link>
        ) : undefined
      }
      isLoading={isLoading}
      error={error?.message ?? null}
      onRetry={() => void refetch()}
      testId="pending-qa-widget"
    >
      {displayedItems && displayedItems.length > 0 ? (
        <div className="space-y-4">
          {displayedItems.map((item) => (
            <div key={item.id} className="flex items-start justify-between gap-3">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-medium truncate">
                    {item.questionExcerpt}
                  </p>
                  {item.isUrgent && (
                    <Badge variant="destructive" className="text-xs">
                      <AlertTriangle className="h-3 w-3 mr-1" />
                      Urgent
                    </Badge>
                  )}
                </div>
                <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                  <span>{item.studentName}</span>
                  <span>·</span>
                  <span>{item.courseName}</span>
                </div>
              </div>
              <Link
                href={`/qa/${item.id}`}
                className="text-sm text-primary hover:underline shrink-0"
              >
                Answer
              </Link>
            </div>
          ))}

          {hasMore && items && (
            <Link
              href="/qa"
              className="block text-sm text-center text-primary hover:underline pt-2"
            >
              View {items.length - MAX_DISPLAYED_ITEMS} more questions
            </Link>
          )}
        </div>
      ) : (
        <EmptyState
          icon={CheckCircle}
          title="No pending questions"
          description="All questions have been answered."
        />
      )}
    </DashboardWidget>
  );
}
