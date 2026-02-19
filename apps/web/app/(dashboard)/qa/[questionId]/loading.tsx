/**
 * Q&A Detail Loading State
 */

import { Skeleton } from "~/components/ui/skeleton";

export default function QADetailLoading() {
  return (
    <div className="container py-6 max-w-4xl">
      {/* Back button skeleton */}
      <Skeleton className="h-9 w-24 mb-4" />

      {/* Question card skeleton */}
      <div className="border rounded-lg p-6 mb-6">
        {/* Status badge */}
        <div className="flex justify-end mb-4">
          <Skeleton className="h-6 w-16" />
        </div>

        {/* Title */}
        <Skeleton className="h-8 w-3/4 mb-4" />

        {/* Author info */}
        <div className="flex items-center gap-3 mb-4">
          <Skeleton className="h-10 w-10 rounded-full" />
          <div>
            <Skeleton className="h-5 w-24 mb-1" />
            <Skeleton className="h-4 w-32" />
          </div>
        </div>

        {/* Context block */}
        <div className="bg-muted/50 rounded-lg p-4 mb-4">
          <Skeleton className="h-4 w-48 mb-2" />
          <Skeleton className="h-4 w-full" />
        </div>

        {/* Content */}
        <div className="space-y-2 mb-4">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-3/4" />
        </div>

        {/* Actions */}
        <div className="flex items-center gap-4 pt-4 border-t">
          <Skeleton className="h-9 w-20" />
          <Skeleton className="h-5 w-24" />
        </div>
      </div>

      {/* Answer section skeleton */}
      <Skeleton className="h-6 w-32 mb-4" />
      <div className="space-y-4">
        <div className="border rounded-lg p-4">
          <div className="flex items-center gap-3 mb-3">
            <Skeleton className="h-8 w-8 rounded-full" />
            <div>
              <Skeleton className="h-4 w-20 mb-1" />
              <Skeleton className="h-3 w-24" />
            </div>
          </div>
          <div className="space-y-2">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-5/6" />
          </div>
        </div>
        <div className="border rounded-lg p-4">
          <div className="flex items-center gap-3 mb-3">
            <Skeleton className="h-8 w-8 rounded-full" />
            <div>
              <Skeleton className="h-4 w-20 mb-1" />
              <Skeleton className="h-3 w-24" />
            </div>
          </div>
          <div className="space-y-2">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-4/6" />
          </div>
        </div>
      </div>

      {/* Answer form skeleton */}
      <div className="border rounded-lg mt-6">
        <div className="p-4 border-b">
          <Skeleton className="h-6 w-24" />
        </div>
        <div className="p-4">
          <Skeleton className="h-32 w-full mb-4" />
          <div className="flex justify-end">
            <Skeleton className="h-9 w-24" />
          </div>
        </div>
      </div>
    </div>
  );
}
