"use client";

import type { ReactNode } from "react";
import { cn } from "@shared/utils";
import { useSidebarCollapsed } from "~/stores/navigation.store";
import { useMediaQuery } from "~/hooks/useMediaQuery";

/**
 * ContentLayout Props
 */
interface ContentLayoutProps {
  /** Page content */
  children: ReactNode;
  /** Optional page title */
  title?: string;
  /** Optional page description */
  description?: string;
  /** Optional header actions */
  actions?: ReactNode;
  /** Whether to use full width (no max-width constraint) */
  fullWidth?: boolean;
  /** Whether to remove default padding */
  noPadding?: boolean;
  /** Custom className */
  className?: string;
}

/**
 * ContentLayout Component
 * REQ-FE-022: Responsive content area with proper margins
 *
 * Features:
 * - Responsive padding (16px mobile, 24px tablet, 32px desktop)
 * - Max-width constraint (1280px) unless fullWidth is true
 * - Proper margins for sidebar states
 * - Optional page header with title, description, and actions
 *
 * @example
 * ```tsx
 * <ContentLayout
 *   title="Dashboard"
 *   description="Overview of your courses"
 *   actions={<Button>Create Course</Button>}
 * >
 *   {content}
 * </ContentLayout>
 * ```
 */
export function ContentLayout({
  children,
  title,
  description,
  actions,
  fullWidth = false,
  noPadding = false,
  className,
}: ContentLayoutProps) {
  const isCollapsed = useSidebarCollapsed();
  const { isMobile } = useMediaQuery();

  // Calculate margin based on sidebar state and viewport
  const sidebarMargin = isMobile
    ? "ml-0" // Mobile: No sidebar
    : isCollapsed
      ? "ml-sidebar-collapsed" // Tablet/Desktop collapsed
      : "ml-sidebar"; // Desktop expanded

  return (
    <main
      className={cn(
        "flex min-h-screen flex-col",
        // Margin adjustments for sidebar
        "transition-all duration-normal ease-out",
        sidebarMargin,
        // Mobile bottom tab space
        "pb-bottom-tab md:pb-0",
        className
      )}
    >
      {/* Page Header */}
      {(title ?? description ?? actions) && (
        <header
          className={cn(
            "sticky top-0 z-sticky",
            "border-b border-border bg-background/95 backdrop-blur-sm",
            "supports-[backdrop-filter]:bg-background/60",
            !noPadding && [
              "px-4 py-4",
              "md:px-6 md:py-5",
              "lg:px-8 lg:py-6",
            ]
          )}
        >
          <div
            className={cn(
              "flex items-center justify-between gap-4",
              !fullWidth && "max-w-container mx-auto"
            )}
          >
            {/* Title and Description */}
            <div className="min-w-0 flex-1">
              {title && (
                <h1 className="text-h2 font-semibold text-foreground truncate">
                  {title}
                </h1>
              )}
              {description && (
                <p className="mt-1 text-body text-neutral-500 dark:text-neutral-400">
                  {description}
                </p>
              )}
            </div>

            {/* Actions */}
            {actions && (
              <div className="flex shrink-0 items-center gap-2">{actions}</div>
            )}
          </div>
        </header>
      )}

      {/* Content Area */}
      <div
        className={cn(
          "flex-1",
          // Responsive padding
          !noPadding && [
            "p-4",
            "md:p-6",
            "lg:p-8",
          ],
          // Max width constraint
          !fullWidth && "max-w-container mx-auto w-full"
        )}
      >
        {children}
      </div>
    </main>
  );
}

/**
 * Simplified content wrapper without header
 */
interface ContentWrapperProps {
  children: ReactNode;
  className?: string;
}

export function ContentWrapper({ children, className }: ContentWrapperProps) {
  return (
    <ContentLayout noPadding className={className}>
      {children}
    </ContentLayout>
  );
}
