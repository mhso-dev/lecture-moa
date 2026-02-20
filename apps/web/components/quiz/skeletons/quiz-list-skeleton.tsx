/**
 * QuizListSkeleton Component
 * REQ-FE-602: Skeleton loading for quiz list
 */

import { QuizCardSkeleton } from "./quiz-card-skeleton";

interface QuizListSkeletonProps {
  count?: number;
  testId?: string;
}

/**
 * QuizListSkeleton - Loading placeholder for quiz list with multiple cards
 */
export function QuizListSkeleton({
  count = 6,
  testId = "quiz-list-skeleton",
}: QuizListSkeletonProps) {
  return (
    <div
      data-testid={testId}
      className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
    >
      {Array.from({ length: count }).map((_, index) => (
        <QuizCardSkeleton key={index} testId={`quiz-card-skeleton-${String(index)}`} />
      ))}
    </div>
  );
}
