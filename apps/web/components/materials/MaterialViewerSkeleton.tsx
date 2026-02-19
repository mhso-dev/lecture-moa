"use client";

import { Skeleton } from "~/components/ui/skeleton";
import { cn } from "~/lib/utils";

interface MaterialViewerSkeletonProps {
  /** Additional CSS classes */
  className?: string;
}

/**
 * MaterialViewerSkeleton Component
 * REQ-FE-324: Loading skeleton for material viewer
 *
 * Features:
 * - Toolbar skeleton
 * - ToC skeleton (desktop)
 * - Title skeleton
 * - Paragraph skeleton lines (8-12 rows)
 * - Metadata skeleton
 *
 * @example
 * ```tsx
 * if (isLoading) return <MaterialViewerSkeleton />;
 * ```
 */
export function MaterialViewerSkeleton({ className }: MaterialViewerSkeletonProps) {
  return (
    <div className={cn("min-h-screen", className)}>
      {/* Reading progress bar skeleton */}
      <Skeleton className="fixed top-0 left-0 z-50 h-[3px] w-full" />

      {/* Toolbar skeleton */}
      <header className="sticky top-0 z-40 border-b border-[var(--color-border)] bg-[var(--color-background)] px-4 py-3">
        <div className="flex items-center gap-2">
          {/* Back link skeleton */}
          <Skeleton className="h-4 w-20" />

          {/* Separator */}
          <Skeleton className="h-4 w-2" />

          {/* Title skeleton */}
          <Skeleton className="h-5 flex-1 max-w-[200px]" />

          {/* Action buttons skeleton */}
          <div className="flex items-center gap-2">
            <Skeleton className="h-8 w-8 rounded-md hidden xl:block" />
            <Skeleton className="h-8 w-8 rounded-md" />
            <Skeleton className="h-8 w-8 rounded-md" />
            <Skeleton className="h-8 w-8 rounded-md" />
            <Skeleton className="h-8 w-16 rounded-md" />
          </div>
        </div>
      </header>

      {/* Main content area */}
      <div className="flex">
        {/* Content */}
        <main className="flex-1 max-w-3xl mx-auto px-4 py-8">
          {/* Metadata skeleton */}
          <header className="space-y-4 mb-8">
            <Skeleton className="h-9 w-3/4" />

            {/* Author/date row */}
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Skeleton className="h-6 w-6 rounded-full" />
                <Skeleton className="h-4 w-24" />
              </div>
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-4 w-16" />
            </div>

            {/* Tags skeleton */}
            <div className="flex gap-2">
              <Skeleton className="h-6 w-16 rounded-full" />
              <Skeleton className="h-6 w-20 rounded-full" />
              <Skeleton className="h-6 w-14 rounded-full" />
            </div>
          </header>

          {/* Content skeleton */}
          <div className="space-y-6">
            {/* Paragraph 1 */}
            <div className="space-y-2">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-5/6" />
              <Skeleton className="h-4 w-4/5" />
            </div>

            {/* Heading skeleton */}
            <Skeleton className="h-7 w-1/3 mt-8" />

            {/* Paragraph 2 */}
            <div className="space-y-2">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-3/4" />
            </div>

            {/* Code block skeleton */}
            <Skeleton className="h-32 w-full rounded-lg" />

            {/* Paragraph 3 */}
            <div className="space-y-2">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-5/6" />
            </div>

            {/* Heading skeleton */}
            <Skeleton className="h-6 w-1/4 mt-8" />

            {/* Paragraph 4 */}
            <div className="space-y-2">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-2/3" />
            </div>

            {/* List skeleton */}
            <div className="space-y-2 pl-4">
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-4 w-2/3" />
              <Skeleton className="h-4 w-4/5" />
            </div>

            {/* Paragraph 5 */}
            <div className="space-y-2">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-5/6" />
              <Skeleton className="h-4 w-full" />
            </div>

            {/* Callout skeleton */}
            <div className="flex gap-3 p-4 rounded-lg bg-[var(--color-neutral-100)] dark:bg-[var(--color-neutral-800)]">
              <Skeleton className="h-5 w-5 rounded" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-1/4" />
                <Skeleton className="h-4 w-3/4" />
              </div>
            </div>
          </div>

          {/* Navigation skeleton */}
          <div className="flex justify-between pt-6 mt-8 border-t border-[var(--color-border)]">
            <div className="flex items-center gap-2">
              <Skeleton className="h-5 w-5" />
              <div className="space-y-1">
                <Skeleton className="h-3 w-12" />
                <Skeleton className="h-4 w-32" />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className="space-y-1 text-right">
                <Skeleton className="h-3 w-8 ml-auto" />
                <Skeleton className="h-4 w-28" />
              </div>
              <Skeleton className="h-5 w-5" />
            </div>
          </div>
        </main>

        {/* ToC skeleton (desktop only) */}
        <aside className="hidden xl:block w-[240px] shrink-0">
          <div className="sticky top-20 py-4 space-y-3">
            <Skeleton className="h-4 w-24" />
            <div className="space-y-2">
              <Skeleton className="h-3 w-full" />
              <Skeleton className="h-3 w-3/4 pl-3" />
              <Skeleton className="h-3 w-full" />
              <Skeleton className="h-3 w-2/3 pl-3" />
              <Skeleton className="h-3 w-5/6" />
              <Skeleton className="h-3 w-4/5 pl-3" />
              <Skeleton className="h-3 w-full" />
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
