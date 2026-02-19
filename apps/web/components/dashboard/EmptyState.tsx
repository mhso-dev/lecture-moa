/**
 * EmptyState Component
 * REQ-FE-242: Reusable empty state component for widgets with no data
 */

import type { LucideIcon } from "lucide-react";
import Link from "next/link";
import { cn } from "~/lib/utils";

export interface EmptyStateAction {
  /** Button/Link label */
  label: string;
  /** Click handler (renders as button) */
  onClick?: () => void;
  /** Link href (renders as anchor) */
  href?: string;
}

export interface EmptyStateProps {
  /** Optional icon component from Lucide React */
  icon?: LucideIcon;
  /** Title text */
  title: string;
  /** Optional description text */
  description?: string;
  /** Optional action button or link */
  action?: EmptyStateAction;
  /** Additional CSS classes */
  className?: string;
  /** Test ID for testing */
  testId?: string;
}

/**
 * EmptyState displays a centered placeholder when no data is available.
 * It supports optional icons, descriptions, and action buttons/links.
 *
 * @example
 * ```tsx
 * // Basic empty state
 * <EmptyState title="No courses" />
 *
 * // With description
 * <EmptyState
 *   title="No courses"
 *   description="You haven't enrolled in any courses yet."
 * />
 *
 * // With icon and action
 * <EmptyState
 *   icon={BookOpen}
 *   title="No courses"
 *   description="Get started by browsing available courses."
 *   action={{ label: "Browse Courses", href: "/courses" }}
 * />
 *
 * // With button action
 * <EmptyState
 *   icon={FileQuestion}
 *   title="No Q&A activity"
 *   action={{ label: "Ask a Question", onClick: handleAskQuestion }}
 * />
 * ```
 */
export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  className,
  testId,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center py-8 text-center space-y-3",
        className
      )}
      data-testid={testId}
    >
      {Icon && (
        <div className="text-muted-foreground">
          <Icon className="h-12 w-12" aria-hidden="true" />
        </div>
      )}
      <div className="space-y-1">
        <h4 className="text-sm font-medium">{title}</h4>
        {description && (
          <p className="text-sm text-muted-foreground">{description}</p>
        )}
      </div>
      {action && (
        <div>
          {action.href ? (
            <Link
              href={action.href}
              className="text-sm text-primary hover:underline"
            >
              {action.label}
            </Link>
          ) : action.onClick ? (
            <button
              type="button"
              onClick={action.onClick}
              className="text-sm text-primary hover:underline"
            >
              {action.label}
            </button>
          ) : null}
        </div>
      )}
    </div>
  );
}
