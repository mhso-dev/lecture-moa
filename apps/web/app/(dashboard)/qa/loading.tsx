/**
 * Q&A List Loading State
 */

import { QAListSkeleton } from "~/components/qa/QAListSkeleton";
import { Skeleton } from "~/components/ui/skeleton";

export default function QAListLoading() {
  return (
    <div className="container py-6 max-w-5xl">
      {/* Header skeleton */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <Skeleton className="h-8 w-32 mb-2" />
          <Skeleton className="h-4 w-48" />
        </div>
        <Skeleton className="h-10 w-28" />
      </div>

      {/* Filter bar skeleton */}
      <div className="flex gap-3 mb-6">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-10 w-48" />
        <Skeleton className="h-10 w-32" />
      </div>

      {/* List skeleton */}
      <QAListSkeleton count={5} />
    </div>
  );
}
