"use client";

import { Skeleton } from "~/components/ui/skeleton";
import { Card, CardContent, CardHeader } from "~/components/ui/card";
import { cn } from "~/lib/utils";

interface MaterialCardSkeletonProps {
  /** Additional CSS classes */
  className?: string;
}

/**
 * MaterialCardSkeleton Component
 * REQ-FE-335: Loading skeleton for material card
 *
 * Matches MaterialCard layout for loading state:
 * - Title skeleton
 * - Excerpt skeleton
 * - Tags row skeleton
 * - Meta row skeleton (author, read time, date)
 *
 * @example
 * ```tsx
 * // In loading state
 * {isLoading && Array.from({ length: 4 }).map((_, i) => (
 *   <MaterialCardSkeleton key={i} />
 * ))}
 * ```
 */
export function MaterialCardSkeleton({ className }: MaterialCardSkeletonProps) {
  return (
    <Card className={cn("", className)}>
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0 space-y-2">
            {/* Title skeleton */}
            <Skeleton className="h-6 w-3/4" />
            {/* Excerpt skeleton */}
            <div className="space-y-1.5">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-5/6" />
            </div>
          </div>
          {/* Action button skeleton (instructor view) */}
          <Skeleton className="h-8 w-8 rounded-md shrink-0" />
        </div>
      </CardHeader>

      <CardContent className="pt-0">
        {/* Tags row skeleton */}
        <div className="flex flex-wrap items-center gap-2 mb-3">
          <Skeleton className="h-5 w-16 rounded-full" />
          <Skeleton className="h-5 w-20 rounded-full" />
          <Skeleton className="h-5 w-14 rounded-full" />
        </div>

        {/* Meta row skeleton */}
        <div className="flex items-center justify-between text-xs">
          {/* Author skeleton */}
          <div className="flex items-center gap-2">
            <Skeleton className="h-5 w-5 rounded-full" />
            <Skeleton className="h-3 w-16" />
          </div>

          {/* Read time skeleton */}
          <Skeleton className="h-3 w-12" />

          {/* Date skeleton */}
          <Skeleton className="h-3 w-14" />
        </div>
      </CardContent>
    </Card>
  );
}
