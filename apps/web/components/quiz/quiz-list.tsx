/**
 * QuizList Component
 * REQ-FE-602: Quiz List Data Fetching
 * REQ-FE-605: Empty State
 * REQ-FE-606: Quiz List Pagination
 */

"use client";

import { useState, useCallback } from "react";
import { useInfiniteQuery } from "@tanstack/react-query";
import { Plus, RefreshCw, SearchX, FileQuestion } from "lucide-react";
import { Button } from "~/components/ui/button";
import { cn } from "~/lib/utils";
import { QuizCard } from "./quiz-card";
import { QuizFilters, type FilterState } from "./quiz-filters";
import { QuizListSkeleton } from "./skeletons/quiz-list-skeleton";
import { QuizCardSkeleton } from "./skeletons/quiz-card-skeleton";
import type { QuizListItem, QuizStatus } from "@shared";

interface QuizListProps {
  role: "student" | "instructor";
  hasActiveFilters?: boolean;
  className?: string;
}

/**
 * Mock fetch function - will be replaced with actual API hook
 */
const fetchQuizList = ({
  pageParam: _pageParam,
  status: _status,
  courseId: _courseId,
}: {
  pageParam?: string;
  status?: QuizStatus | "all";
  courseId?: string;
}): Promise<{
  data: QuizListItem[];
  pagination: { cursor: string | null; hasMore: boolean };
}> => {
  // This is a placeholder - actual implementation will use the API hook
  // from hooks/quiz/useQuizList.ts (Tier 2)
  return Promise.resolve({
    data: [],
    pagination: { cursor: null, hasMore: false },
  });
};

/**
 * QuizList - Container component for displaying quizzes with filters and pagination
 */
export function QuizList({
  role,
  hasActiveFilters = false,
  className,
}: QuizListProps) {
  const [filters, setFilters] = useState<FilterState>({});

  const {
    data,
    isLoading,
    isError,
    error,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    refetch,
  } = useInfiniteQuery({
    queryKey: [
      role === "instructor" ? "instructor" : "quizzes",
      "quizzes",
      filters,
    ],
    queryFn: ({ pageParam }) =>
      fetchQuizList({
        pageParam,
        status: filters.status,
        courseId: filters.courseId,
      }),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) =>
      lastPage.pagination.hasMore ? lastPage.pagination.cursor : undefined,
  });

  const handleFilterChange = useCallback((newFilters: FilterState) => {
    setFilters(newFilters);
  }, []);

  const handleClearFilters = useCallback(() => {
    setFilters({});
  }, []);

  // Flatten pages into single array
  const quizzes = data?.pages.flatMap((page) => page.data) ?? [];
  const isEmpty = !isLoading && quizzes.length === 0;

  // Loading state
  if (isLoading) {
    return (
      <div className={cn("space-y-6", className)}>
        <QuizListSkeleton />
      </div>
    );
  }

  // Error state
  if (isError) {
    return (
      <div
        role="alert"
        className={cn(
          "flex flex-col items-center justify-center py-16 px-4",
          className
        )}
      >
        <div className="mb-4 rounded-full bg-[var(--color-error-100)] p-4 dark:bg-[var(--color-error-900)]">
          <RefreshCw className="h-8 w-8 text-[var(--color-error-600)]" />
        </div>
        <h3 className="text-lg font-semibold mb-2">퀴즈를 불러오지 못했습니다</h3>
        <p className="text-sm text-[var(--color-muted-foreground)] text-center max-w-md mb-6">
          {error.message}
        </p>
        <Button onClick={() => refetch()} variant="outline">
          <RefreshCw className="h-4 w-4 mr-2" />
          다시 시도
        </Button>
      </div>
    );
  }

  // Empty state
  if (isEmpty) {
    return (
      <div className={cn("space-y-6", className)}>
        <QuizFilters
          onFilterChange={handleFilterChange}
          role={role}
        />
        <div
          role="status"
          aria-label="이용 가능한 퀴즈 없음"
          className="flex flex-col items-center justify-center py-16 px-4"
        >
          <div className="mb-6 rounded-full bg-[var(--color-neutral-100)] dark:bg-[var(--color-neutral-900)] p-6">
            {hasActiveFilters ? (
              <SearchX className="h-12 w-12 text-[var(--color-muted-foreground)]" />
            ) : (
              <FileQuestion className="h-12 w-12 text-[var(--color-muted-foreground)]" />
            )}
          </div>
          <h3 className="text-lg font-semibold mb-2">
            {hasActiveFilters
              ? "필터 조건에 맞는 퀴즈가 없습니다"
              : "아직 퀴즈가 없습니다"}
          </h3>
          <p className="text-sm text-[var(--color-muted-foreground)] text-center max-w-md mb-6">
            {hasActiveFilters
              ? "필터 조건을 변경해 보세요."
              : role === "instructor"
                ? "첫 번째 퀴즈를 만들어 시작하세요."
                : "현재 이용 가능한 퀴즈가 없습니다."}
          </p>
          <div className="flex flex-col sm:flex-row gap-3">
            {hasActiveFilters && (
              <Button variant="outline" onClick={handleClearFilters}>
                필터 초기화
              </Button>
            )}
            {!hasActiveFilters && role === "instructor" && (
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                퀴즈 만들기
              </Button>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Success state with data
  return (
    <div className={cn("space-y-6", className)}>
      {/* Filters */}
      <QuizFilters
        onFilterChange={handleFilterChange}
        role={role}
        initialFilters={filters}
      />

      {/* Quiz list region */}
      <section
        role="region"
        aria-label="퀴즈 목록"
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
      >
        {quizzes.map((quiz) => (
          <QuizCard
            key={quiz.id}
            quiz={quiz}
            role={role}
            testId={`quiz-card-${quiz.id}`}
          />
        ))}

        {/* Loading more skeleton */}
        {isFetchingNextPage && (
          <>
            <QuizCardSkeleton testId="quiz-card-skeleton-more-1" />
            <QuizCardSkeleton testId="quiz-card-skeleton-more-2" />
            <QuizCardSkeleton testId="quiz-card-skeleton-more-3" />
          </>
        )}
      </section>

      {/* Load more button */}
      {hasNextPage && !isFetchingNextPage && (
        <div className="flex justify-center pt-4">
          <Button
            variant="outline"
            onClick={() => fetchNextPage()}
            aria-label="퀴즈 더 보기"
          >
            더 보기
          </Button>
        </div>
      )}
    </div>
  );
}
