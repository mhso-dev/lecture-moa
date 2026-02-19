import { MaterialCardSkeleton } from "~/components/materials/MaterialCardSkeleton";

/**
 * Materials List Loading State
 * REQ-FE-335: Loading skeleton for material list page
 *
 * Displays 4 MaterialCardSkeleton placeholders while content is loading
 */
export default function MaterialsLoading() {
  return (
    <div className="space-y-6">
      {/* Page header skeleton */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="space-y-2">
          <div className="h-8 w-32 bg-[var(--color-neutral-200)] dark:bg-[var(--color-neutral-800)] rounded animate-pulse" />
          <div className="h-4 w-48 bg-[var(--color-neutral-200)] dark:bg-[var(--color-neutral-800)] rounded animate-pulse" />
        </div>
        <div className="h-10 w-36 bg-[var(--color-neutral-200)] dark:bg-[var(--color-neutral-800)] rounded animate-pulse" />
      </div>

      {/* Search bar skeleton */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <div className="h-10 w-full bg-[var(--color-neutral-200)] dark:bg-[var(--color-neutral-800)] rounded animate-pulse" />
        </div>
        <div className="flex gap-2">
          <div className="h-10 w-24 bg-[var(--color-neutral-200)] dark:bg-[var(--color-neutral-800)] rounded animate-pulse" />
          <div className="h-10 w-32 bg-[var(--color-neutral-200)] dark:bg-[var(--color-neutral-800)] rounded animate-pulse" />
        </div>
      </div>

      {/* Material cards grid skeleton */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <MaterialCardSkeleton key={i} />
        ))}
      </div>
    </div>
  );
}
