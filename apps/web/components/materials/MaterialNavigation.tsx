"use client";

import { useEffect, useCallback } from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "~/lib/utils";

interface NavigationItem {
  id: string;
  title: string;
}

interface MaterialNavigationProps {
  /** Course ID for link generation */
  courseId: string;
  /** Previous material, if any */
  previous: NavigationItem | null;
  /** Next material, if any */
  next: NavigationItem | null;
  /** Additional CSS classes */
  className?: string;
  /** Callback when navigation occurs (optional) */
  onNavigate?: () => void;
}

/**
 * MaterialNavigation Component
 * REQ-FE-322: Previous/Next material navigation
 *
 * Features:
 * - Previous/Next material links at bottom
 * - Truncated titles
 * - Keyboard shortcuts (left/right arrows)
 * - Disabled state when no prev/next
 *
 * @example
 * ```tsx
 * <MaterialNavigation
 *   courseId={courseId}
 *   previous={materials[index - 1]}
 *   next={materials[index + 1]}
 * />
 * ```
 */
export function MaterialNavigation({
  courseId,
  previous,
  next,
  className,
  onNavigate,
}: MaterialNavigationProps) {
  // Truncate title to max characters
  const truncateTitle = (title: string, maxLen = 40) => {
    if (title.length <= maxLen) return title;
    return `${title.slice(0, maxLen)}...`;
  };

  // Keyboard navigation
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      // Ignore if focus is in input/textarea
      const target = e.target as HTMLElement;
      if (
        target.tagName === "INPUT" ||
        target.tagName === "TEXTAREA" ||
        target.isContentEditable
      ) {
        return;
      }

      if (e.key === "ArrowLeft" && previous) {
        onNavigate?.();
        window.location.href = `/courses/${courseId}/materials/${previous.id}`;
      } else if (e.key === "ArrowRight" && next) {
        onNavigate?.();
        window.location.href = `/courses/${courseId}/materials/${next.id}`;
      }
    },
    [courseId, previous, next, onNavigate]
  );

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown);
    return () => { window.removeEventListener("keydown", handleKeyDown); };
  }, [handleKeyDown]);

  return (
    <nav
      className={cn(
        "flex items-center justify-between gap-4 border-t border-[var(--color-border)] pt-6",
        className
      )}
      aria-label="Material navigation"
    >
      {/* Previous */}
      <div className="flex-1">
        {previous ? (
          <Link
            href={`/courses/${courseId}/materials/${previous.id}`}
            onClick={onNavigate}
            className={cn(
              "group flex items-center gap-2 rounded-lg p-3",
              "text-[var(--color-muted-foreground)] hover:bg-[var(--color-neutral-100)]",
              "dark:hover:bg-[var(--color-neutral-800)]",
              "transition-colors duration-150"
            )}
            aria-label={`Previous: ${previous.title}`}
          >
            <ChevronLeft className="h-5 w-5 shrink-0 transition-transform group-hover:-translate-x-1" />
            <div className="min-w-0 text-left">
              <div className="text-xs uppercase tracking-wide opacity-60">
                Previous
              </div>
              <div className="truncate text-sm font-medium text-[var(--color-foreground)]">
                {truncateTitle(previous.title)}
              </div>
            </div>
          </Link>
        ) : (
          <div className="p-3 opacity-40">
            <div className="flex items-center gap-2">
              <ChevronLeft className="h-5 w-5" />
              <div>
                <div className="text-xs uppercase tracking-wide">Previous</div>
                <div className="text-sm">No previous material</div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Next */}
      <div className="flex-1 text-right">
        {next ? (
          <Link
            href={`/courses/${courseId}/materials/${next.id}`}
            onClick={onNavigate}
            className={cn(
              "group flex items-center justify-end gap-2 rounded-lg p-3",
              "text-[var(--color-muted-foreground)] hover:bg-[var(--color-neutral-100)]",
              "dark:hover:bg-[var(--color-neutral-800)]",
              "transition-colors duration-150"
            )}
            aria-label={`Next: ${next.title}`}
          >
            <div className="min-w-0 text-right">
              <div className="text-xs uppercase tracking-wide opacity-60">
                Next
              </div>
              <div className="truncate text-sm font-medium text-[var(--color-foreground)]">
                {truncateTitle(next.title)}
              </div>
            </div>
            <ChevronRight className="h-5 w-5 shrink-0 transition-transform group-hover:translate-x-1" />
          </Link>
        ) : (
          <div className="p-3 opacity-40">
            <div className="flex items-center justify-end gap-2">
              <div>
                <div className="text-xs uppercase tracking-wide">Next</div>
                <div className="text-sm">No next material</div>
              </div>
              <ChevronRight className="h-5 w-5" />
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}
