/**
 * DashboardGrid Component
 * REQ-FE-241: Responsive grid layout component for dashboard widget composition
 */

import type { ReactNode } from "react";
import { cn } from "~/lib/utils";

export interface DashboardGridProps {
  /** Grid children (widgets) */
  children: ReactNode;
  /** Column configuration for responsive breakpoints */
  columns?: {
    /** Mobile (< 768px) - default: 1 */
    mobile?: 1 | 2;
    /** Tablet (768px - 1279px) - default: 2 */
    tablet?: 1 | 2 | 3;
    /** Desktop (>= 1280px) - default: 3 */
    desktop?: 1 | 2 | 3 | 4;
  };
  /** Additional CSS classes */
  className?: string;
  /** Test ID for testing */
  testId?: string;
}

/**
 * DashboardGrid provides a responsive CSS Grid layout for dashboard widgets.
 * It supports configurable column counts at mobile, tablet, and desktop breakpoints.
 *
 * Default configuration:
 * - Mobile (< 768px): 1 column
 * - Tablet (768px - 1279px): 2 columns
 * - Desktop (>= 1280px): 3 columns
 *
 * Gap configuration:
 * - Mobile: 16px (gap-4)
 * - Tablet: 20px (gap-5)
 * - Desktop: 24px (gap-6)
 *
 * @example
 * ```tsx
 * // Default 3-column grid
 * <DashboardGrid>
 *   <EnrolledCoursesWidget />
 *   <RecentQAWidget />
 *   <QuizScoresWidget />
 * </DashboardGrid>
 *
 * // Team dashboard 2-column grid
 * <DashboardGrid columns={{ mobile: 1, tablet: 2, desktop: 2 }}>
 *   <TeamOverviewWidget />
 *   <TeamMembersWidget />
 * </DashboardGrid>
 * ```
 */
export function DashboardGrid({
  children,
  columns = { mobile: 1, tablet: 2, desktop: 3 },
  className,
  testId,
}: DashboardGridProps) {
  const mobile = columns.mobile ?? 1;
  const tablet = columns.tablet ?? 2;
  const desktop = columns.desktop ?? 3;

  // Map column numbers to Tailwind classes
  const mobileColClass = `grid-cols-${String(mobile)}`;
  const tabletColClass = `md:grid-cols-${String(tablet)}`;
  const desktopColClass = `xl:grid-cols-${String(desktop)}`;

  return (
    <div
      className={cn(
        "grid",
        mobileColClass,
        tabletColClass,
        desktopColClass,
        "gap-4 md:gap-5 xl:gap-6",
        className
      )}
      data-testid={testId}
    >
      {children}
    </div>
  );
}
