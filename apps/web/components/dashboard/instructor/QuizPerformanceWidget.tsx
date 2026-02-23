"use client";

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
      title="퀴즈 성과"
      subtitle="최근 퀴즈 통계"
      headerAction={
        quizzes && quizzes.length > 0 ? (
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
                    <span className="text-muted-foreground">평균</span>
                  </span>
                  <span className="flex items-center gap-1">
                    <Users className="h-3 w-3 text-muted-foreground" />
                    <span className="font-medium">{quiz.submissionCount}</span>
                    <span className="text-muted-foreground">제출</span>
                  </span>
                  <span className="flex items-center gap-1">
                    <BarChart3 className="h-3 w-3 text-muted-foreground" />
                    <span className="font-medium">{quiz.passRate}%</span>
                    <span className="text-muted-foreground">통과</span>
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
              {quizzes.length - MAX_DISPLAYED_QUIZZES}개의 퀴즈 더 보기
            </Link>
          )}
        </div>
      ) : (
        <EmptyState
          icon={ClipboardList}
          title="아직 퀴즈 데이터가 없습니다"
          description="퀴즈를 만들면 성과 통계를 확인할 수 있습니다."
          action={{ label: "퀴즈 만들기", href: "/quizzes/create" as Route }}
        />
      )}
    </DashboardWidget>
  );
}
