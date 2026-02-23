/**
 * DashboardWidget Component
 * REQ-FE-240: Generic widget wrapper component for consistent widget layout and styling
 */

import type { ReactNode } from "react";
import { Card, CardHeader, CardDescription, CardContent } from "~/components/ui/card";
import { Skeleton } from "~/components/ui/skeleton";
import { AlertCircle } from "lucide-react";
import { cn } from "~/lib/utils";

export interface DashboardWidgetProps {
  /** Widget title displayed in header */
  title: string;
  /** Optional subtitle/description */
  subtitle?: string;
  /** Optional action element in header (e.g., button, link) */
  headerAction?: ReactNode;
  /** Loading state - shows skeleton */
  isLoading?: boolean;
  /** Error message to display */
  error?: string | null;
  /** Retry callback for error state */
  onRetry?: () => void;
  /** Widget content */
  children: ReactNode;
  /** Additional CSS classes */
  className?: string;
  /** Test ID for testing */
  testId?: string;
}

/**
 * DashboardWidget provides a consistent wrapper for all dashboard widgets.
 * It handles loading states with skeletons, error states with retry options,
 * and maintains a uniform layout across all dashboard views.
 *
 * @example
 * ```tsx
 * <DashboardWidget
 *   title="Recent Activity"
 *   subtitle="Your latest interactions"
 *   headerAction={<Button>View All</Button>}
 *   isLoading={isLoading}
 *   error={error?.message}
 *   onRetry={refetch}
 * >
 *   <ActivityList items={data} />
 * </DashboardWidget>
 * ```
 */
export function DashboardWidget({
  title,
  subtitle,
  headerAction,
  isLoading = false,
  error = null,
  onRetry,
  children,
  className,
  testId,
}: DashboardWidgetProps) {
  return (
    <Card className={cn(className)} data-testid={testId}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <div className="space-y-1">
          <h3 className="text-base font-semibold leading-none tracking-tight">
            {title}
          </h3>
          {subtitle && <CardDescription>{subtitle}</CardDescription>}
        </div>
        {headerAction}
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-2">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center py-6 text-center">
            <AlertCircle className="h-8 w-8 text-destructive mb-2" />
            <p className="text-sm text-muted-foreground mb-3">{error}</p>
            {onRetry && (
              <button
                type="button"
                onClick={onRetry}
                className="text-sm text-primary hover:underline"
              >
                다시 시도
              </button>
            )}
          </div>
        ) : (
          children
        )}
      </CardContent>
    </Card>
  );
}
