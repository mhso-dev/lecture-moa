/**
 * QuizCardSkeleton Component
 * REQ-FE-602: Skeleton loading for quiz cards
 */

import { Card, CardContent } from "~/components/ui/card";
import { Skeleton } from "~/components/ui/skeleton";

interface QuizCardSkeletonProps {
  testId?: string;
}

/**
 * QuizCardSkeleton - Loading placeholder for QuizCard
 */
export function QuizCardSkeleton({ testId = "quiz-card-skeleton" }: QuizCardSkeletonProps) {
  return (
    <Card data-testid={testId} className="h-full overflow-hidden">
      <CardContent className="p-4 space-y-3">
        {/* Course name skeleton */}
        <Skeleton className="h-4 w-24" data-testid="skeleton-course" />

        {/* Title skeleton */}
        <Skeleton className="h-6 w-full" data-testid="skeleton-title" />
        <Skeleton className="h-6 w-3/4" data-testid="skeleton-title-2" />

        {/* Stats skeleton */}
        <div className="flex gap-4">
          <Skeleton className="h-4 w-20" data-testid="skeleton-questions" />
          <Skeleton className="h-4 w-16" data-testid="skeleton-time" />
        </div>

        {/* Due date skeleton */}
        <Skeleton className="h-4 w-28" data-testid="skeleton-due" />

        {/* Score badge skeleton */}
        <Skeleton className="h-6 w-20 rounded-full" data-testid="skeleton-score" />

        {/* Action button skeleton */}
        <Skeleton className="h-10 w-full mt-2" data-testid="skeleton-action" />
      </CardContent>
    </Card>
  );
}
