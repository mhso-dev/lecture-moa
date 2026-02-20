/**
 * QAListSkeleton Component
 * TASK-019: Skeleton loading state for Q&A list
 *
 * Displays placeholder skeleton cards while Q&A list is loading.
 */

import { Skeleton } from "~/components/ui/skeleton";
import { Card, CardContent } from "~/components/ui/card";

interface QAListSkeletonProps {
  count?: number;
}

/**
 * QAListSkeleton - Loading skeleton for Q&A list
 *
 * @param count - Number of skeleton cards to display (default: 5)
 *
 * @example
 * ```tsx
 * <QAListSkeleton />
 * <QAListSkeleton count={10} />
 * ```
 */
export function QAListSkeleton({ count = 5 }: QAListSkeletonProps) {
  return (
    <div className="space-y-4" role="status" aria-label="Q&A 목록 로딩 중">
      {Array.from({ length: count }).map((_, index) => (
        <Card key={index} className="overflow-hidden">
          <CardContent className="p-4">
            <div className="flex items-start gap-4">
              {/* Avatar skeleton */}
              <Skeleton className="h-10 w-10 rounded-full shrink-0" />

              {/* Content skeleton */}
              <div className="flex-1 min-w-0 space-y-3">
                {/* Status badge + title row */}
                <div className="flex items-center gap-2">
                  <Skeleton className="h-5 w-16 rounded-full" />
                  <Skeleton className="h-5 flex-1 max-w-[300px]" />
                </div>

                {/* Context snippet */}
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-3/4" />

                {/* Meta row */}
                <div className="flex items-center gap-4 pt-2">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-4 w-20" />
                  <Skeleton className="h-4 w-16" />
                  <div className="flex-1" />
                  <Skeleton className="h-4 w-12" />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
      <span className="sr-only">Q&A 목록을 불러오는 중입니다...</span>
    </div>
  );
}
