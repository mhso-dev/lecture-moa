/**
 * QuizProgressBar Component
 * REQ-FE-615: Progress Bar
 *
 * Displays answered/total questions with animated progress bar
 */

"use client";

import * as React from "react";
import { Progress } from "~/components/ui/progress";
import { cn } from "~/lib/utils";

// ============================================================================
// Types
// ============================================================================

export interface QuizProgressBarProps {
  /** Number of answered questions */
  answered: number;
  /** Total number of questions */
  total: number;
  /** Custom className */
  className?: string;
  /** Test ID for testing */
  testId?: string;
}

// ============================================================================
// Component
// ============================================================================

/**
 * Quiz Progress Bar Component
 *
 * Displays a progress bar showing answered vs total questions.
 * Includes fraction (X/Y) and percentage display with ARIA attributes.
 *
 * @param props - Component props
 * @returns Progress bar component
 *
 * @example
 * ```tsx
 * <QuizProgressBar answered={5} total={10} />
 * ```
 */
export function QuizProgressBar({
  answered,
  total,
  className,
  testId,
}: QuizProgressBarProps): React.JSX.Element {
  // Calculate percentage (handle division by zero)
  const percentage = total > 0 ? Math.round((answered / total) * 100) : 0;

  return (
    <div
      className={cn("space-y-2", className)}
      data-testid={testId}
    >
      <div className="flex items-center justify-between text-sm">
        <span className="font-medium">
          {answered}/{total}
        </span>
        <span className="text-muted-foreground">{percentage}%</span>
      </div>
      <Progress
        value={percentage}
        className="h-2 transition-all duration-300 ease-in-out"
      />
    </div>
  );
}
