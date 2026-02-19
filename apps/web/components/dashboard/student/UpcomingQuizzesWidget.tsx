/**
 * UpcomingQuizzesWidget Component
 * REQ-FE-215: Upcoming Quizzes Widget
 */

import Link from "next/link";
import { ClipboardList, ChevronRight, Clock } from "lucide-react";
import { DashboardWidget } from "../DashboardWidget";
import { EmptyState } from "../EmptyState";
import { useUpcomingQuizzes } from "~/hooks/dashboard/useStudentDashboard";
import { Badge } from "~/components/ui/badge";
import { formatDistanceToNow } from "~/lib/date-utils";

/**
 * Maximum number of quizzes to display
 */
const MAX_DISPLAYED_QUIZZES = 5;

/**
 * UpcomingQuizzesWidget displays quizzes that are pending for the student
 *
 * Features:
 * - Quiz title, course name
 * - Due date (if set)
 * - Number of questions
 * - Maximum 5 items
 * - "View all quizzes" link to /quizzes
 * - Empty state
 *
 * @example
 * ```tsx
 * <UpcomingQuizzesWidget />
 * ```
 */
export function UpcomingQuizzesWidget() {
  const { data: quizzes, isLoading, error, refetch } = useUpcomingQuizzes();

  const displayedQuizzes = quizzes?.slice(0, MAX_DISPLAYED_QUIZZES);
  const hasMore = (quizzes?.length ?? 0) > MAX_DISPLAYED_QUIZZES;

  return (
    <DashboardWidget
      title="Upcoming Quizzes"
      subtitle="Quizzes to complete"
      headerAction={
        quizzes && quizzes.length > 0 ? (
          <Link
            href="/quizzes"
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
      testId="upcoming-quizzes-widget"
    >
      {displayedQuizzes && displayedQuizzes.length > 0 ? (
        <div className="space-y-3">
          {displayedQuizzes.map((quiz) => (
            <Link
              key={quiz.id}
              href={`/quizzes/${quiz.id}`}
              className="block group"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <p className="text-sm truncate group-hover:text-primary transition-colors">
                    {quiz.quizTitle}
                  </p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-xs text-muted-foreground">
                      {quiz.courseName}
                    </span>
                    <span className="text-xs text-muted-foreground">-</span>
                    <span className="text-xs text-muted-foreground">
                      {quiz.questionCount} questions
                    </span>
                  </div>
                </div>
                {quiz.dueAt && (
                  <Badge
                    variant="outline"
                    className="text-xs flex items-center gap-1"
                  >
                    <Clock className="h-3 w-3" />
                    {formatDistanceToNow(new Date(quiz.dueAt))}
                  </Badge>
                )}
              </div>
            </Link>
          ))}

          {hasMore && quizzes && (
            <Link
              href="/quizzes"
              className="block text-sm text-center text-primary hover:underline pt-2"
            >
              View {quizzes.length - MAX_DISPLAYED_QUIZZES} more quizzes
            </Link>
          )}
        </div>
      ) : (
        <EmptyState
          icon={ClipboardList}
          title="No upcoming quizzes"
          description="No upcoming quizzes."
        />
      )}
    </DashboardWidget>
  );
}
