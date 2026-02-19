/**
 * QuizPerformanceWidget Component
 * REQ-FE-224: Quiz Performance Summary Widget
 */

import type { Route } from "next";
import Link from "next/link";
import { BarChart3, ChevronRight, ClipboardList, Users, Percent } from "lucide-react";
import { DashboardWidget } from "../DashboardWidget";
import { EmptyState } from "../EmptyState";
import { useQuizPerformance } from "~/hooks/dashboard/useInstructorDashboard";

/**
 * Maximum number of quizzes to display in the widget
 */
const MAX_DISPLAYED_QUIZZES = 5;

/**
 * QuizPerformanceWidget displays aggregated performance statistics
 * for quizzes across the instructor's courses.
 *
 * Features:
 * - Quiz title, course name
 * - Average score, submission count, pass rate
 * - Maximum 5 quizzes
 * - "View all quizzes" link to /quizzes
 * - Empty state with "Create Quiz" CTA
 *
 * @example
 * ```tsx
 * <QuizPerformanceWidget />
 * ```
 */
export function QuizPerformanceWidget() {
  const { data: quizzes, isLoading, error, refetch } = useQuizPerformance();

  // Limit to MAX_DISPLAYED_QUIZZES
  const displayedQuizzes = quizzes?.slice(0, MAX_DISPLAYED_QUIZZES);
  const hasMore = (quizzes?.length ?? 0) > MAX_DISPLAYED_QUIZZES;

  return (
    <DashboardWidget
      title="Quiz Performance"
      subtitle="Recent quiz statistics"
      headerAction={
        quizzes && quizzes.length > 0 ? (
          <Link
            href={"/quizzes" as Route}
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
      testId="quiz-performance-widget"
    >
      {displayedQuizzes && displayedQuizzes.length > 0 ? (
        <div className="space-y-4">
          {displayedQuizzes.map((quiz) => (
            <Link
              key={quiz.id}
              href={`/quizzes/${quiz.id}` as Route}
              className="block group"
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-medium truncate group-hover:text-primary transition-colors">
                    {quiz.quizTitle}
                  </h4>
                </div>
                <p className="text-xs text-muted-foreground truncate">
                  {quiz.courseName}
                </p>
                <div className="flex items-center gap-4 text-xs">
                  <span className="flex items-center gap-1">
                    <Percent className="h-3 w-3 text-muted-foreground" />
                    <span className="font-medium">{quiz.averageScore}%</span>
                    <span className="text-muted-foreground">avg</span>
                  </span>
                  <span className="flex items-center gap-1">
                    <Users className="h-3 w-3 text-muted-foreground" />
                    <span className="font-medium">{quiz.submissionCount}</span>
                    <span className="text-muted-foreground">submissions</span>
                  </span>
                  <span className="flex items-center gap-1">
                    <BarChart3 className="h-3 w-3 text-muted-foreground" />
                    <span className="font-medium">{quiz.passRate}%</span>
                    <span className="text-muted-foreground">pass</span>
                  </span>
                </div>
              </div>
            </Link>
          ))}

          {hasMore && quizzes && (
            <Link
              href={"/quizzes" as Route}
              className="block text-sm text-center text-primary hover:underline pt-2"
            >
              View {quizzes.length - MAX_DISPLAYED_QUIZZES} more quizzes
            </Link>
          )}
        </div>
      ) : (
        <EmptyState
          icon={ClipboardList}
          title="No quiz data yet"
          description="Create a quiz to see performance statistics."
          action={{ label: "Create Quiz", href: "/quizzes/create" as Route }}
        />
      )}
    </DashboardWidget>
  );
}
