"use client";

import { cn } from "~/lib/utils";

interface ReadingProgressBarProps {
  /** Progress percentage (0-100) */
  progress: number;
  /** Additional CSS classes */
  className?: string;
}

/**
 * ReadingProgressBar Component
 * REQ-FE-318: Thin progress bar showing scroll position
 *
 * Features:
 * - 3px height, full width
 * - Primary brand color
 * - Accessible progress bar with ARIA attributes
 *
 * @example
 * ```tsx
 * const progress = useReadingProgress();
 * return <ReadingProgressBar progress={progress} />;
 * ```
 */
export function ReadingProgressBar({
  progress,
  className,
}: ReadingProgressBarProps) {
  return (
    <div
      role="progressbar"
      aria-valuenow={progress}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label="Reading progress"
      className={cn(
        "fixed top-0 left-0 z-50 h-[3px] w-full bg-transparent",
        className
      )}
    >
      <div
        className="h-full bg-[var(--color-primary-500)] transition-[width] duration-100 ease-out"
        style={{ width: `${String(Math.min(100, Math.max(0, progress)))}%` }}
      />
    </div>
  );
}
