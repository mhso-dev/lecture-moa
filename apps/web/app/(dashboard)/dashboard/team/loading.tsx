/**
 * Team Dashboard Loading Skeleton
 * REQ-FE-203: Dashboard loading states matching widget grid layout
 */

import { DashboardGrid } from "~/components/dashboard/DashboardGrid";
import { Card, CardHeader, CardContent } from "~/components/ui/card";
import { Skeleton } from "~/components/ui/skeleton";

/**
 * Widget Skeleton Component
 * Renders a placeholder card with skeleton lines matching typical widget content
 */
function WidgetSkeleton() {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <Skeleton className="h-5 w-32" />
        <Skeleton className="h-4 w-16" />
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-center space-x-3">
          <Skeleton className="h-10 w-10 rounded-full" />
          <div className="space-y-2 flex-1">
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-3 w-1/2" />
          </div>
        </div>
        <div className="flex items-center space-x-3">
          <Skeleton className="h-10 w-10 rounded-full" />
          <div className="space-y-2 flex-1">
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-3 w-1/2" />
          </div>
        </div>
        <div className="flex items-center space-x-3">
          <Skeleton className="h-10 w-10 rounded-full" />
          <div className="space-y-2 flex-1">
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-3 w-1/2" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

/**
 * Team Overview Skeleton Component
 * Renders a placeholder for team overview widget
 */
function TeamOverviewSkeleton() {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <Skeleton className="h-5 w-32" />
        <Skeleton className="h-4 w-20" />
      </CardHeader>
      <CardContent className="space-y-3">
        <Skeleton className="h-6 w-48" />
        <Skeleton className="h-4 w-32" />
        <div className="flex items-center gap-4 pt-2">
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-4 w-24" />
        </div>
        <Skeleton className="h-3 w-full" />
      </CardContent>
    </Card>
  );
}

/**
 * Team Dashboard Loading Skeleton
 *
 * Matches the grid layout of the actual dashboard:
 * - 2-column grid on desktop
 * - 2-column grid on tablet
 * - 1-column grid on mobile
 *
 * Prevents layout shift during loading
 */
export default function TeamDashboardLoading() {
  return (
    <div className="space-y-6">
      {/* Header skeleton */}
      <div className="space-y-2">
        <Skeleton className="h-8 w-40" />
        <Skeleton className="h-4 w-64" />
      </div>

      {/* Widget grid skeleton - 2 columns max for team dashboard */}
      <DashboardGrid columns={{ mobile: 1, tablet: 2, desktop: 2 }}>
        <TeamOverviewSkeleton />
        <WidgetSkeleton />
        <WidgetSkeleton />
        <WidgetSkeleton />
      </DashboardGrid>
    </div>
  );
}
