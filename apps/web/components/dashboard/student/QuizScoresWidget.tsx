"use client";

/**
 * QuizScoresWidget Component
 * REQ-FE-213: Quiz Scores Summary Widget
 */

import type { Route } from "next";
import Link from "next/link";
import { Award, ChevronRight } from "lucide-react";
import { DashboardWidget } from "../DashboardWidget";
import { EmptyState } from "../EmptyState";
import { useQuizResults } from "~/hooks/dashboard/useStudentDashboard";
import { Badge } from "~/components/ui/badge";
import { cn } from "~/lib/utils";
import { formatDistanceToNow } from "~/lib/date-utils";

/**
 * Maximum number of quiz results to display
 */
const MAX_DISPLAYED_RESULTS = 5;

/**
 * Score color configuration
 */
function getScoreConfig(score: number, total: number) {
  const percentage = (score / total) * 100;

  if (percentage >= 80) {
    return {
      className: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
      variant: "default" as const,
    };
  }
  if (percentage >= 60) {
    return {
      className: "bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200",
      variant: "secondary" as const,
    };
  }
  return {
    className: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
    variant: "destructive" as const,
  };
}

/**
 * QuizScoresWidget displays a summary of the student's recent quiz performance
 *
 * Features:
 * - Quiz title, course name
 * - Score (e.g., "8 / 10") with percentage
 * - Color-coded: >= 80% green, 60-79% amber, < 60% red
 * - Maximum 5 results
 * - "View all results" link to /quizzes
 * - Empty state
 *
 * @example
 * ```tsx
 * <QuizScoresWidget />
 * ```
 */
export function QuizScoresWidget() {
  const { data: results, isLoading, error, refetch } = useQuizResults();

  const displayedResults = results?.slice(0, MAX_DISPLAYED_RESULTS);
  const hasMore = (results?.length ?? 0) > MAX_DISPLAYED_RESULTS;

  return (
    <DashboardWidget
      title="퀴즈 점수"
      subtitle="최근 퀴즈 결과"
      headerAction={
        results && results.length > 0 ? (
          <Link
            href={"/quizzes" as Route}
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
      testId="quiz-scores-widget"
    >
      {displayedResults && displayedResults.length > 0 ? (
        <div className="space-y-3">
          {displayedResults.map((result) => {
            const scoreConfig = getScoreConfig(result.score, result.totalPoints);
            const percentage = Math.round((result.score / result.totalPoints) * 100);

            return (
              <Link
                key={result.id}
                href={`/quizzes/${result.id}/results` as Route}
                className="block group"
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm truncate group-hover:text-primary transition-colors">
                      {result.quizTitle}
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-xs text-muted-foreground">
                        {result.courseName}
                      </span>
                      <span className="text-xs text-muted-foreground">-</span>
                      <span className="text-xs text-muted-foreground">
                        {formatDistanceToNow(new Date(result.takenAt))}
                      </span>
                    </div>
                  </div>
                  <Badge
                    variant={scoreConfig.variant}
                    className={cn("text-xs font-medium", scoreConfig.className)}
                  >
                    {result.score} / {result.totalPoints} ({percentage}%)
                  </Badge>
                </div>
              </Link>
            );
          })}

          {hasMore && results && (
            <Link
              href={"/quizzes" as Route}
              className="block text-sm text-center text-primary hover:underline pt-2"
            >
              {results.length - MAX_DISPLAYED_RESULTS}개의 결과 더 보기
            </Link>
          )}
        </div>
      ) : (
        <EmptyState
          icon={Award}
          title="퀴즈 결과가 없습니다"
          description="아직 퀴즈 결과가 없습니다."
        />
      )}
    </DashboardWidget>
  );
}
