/**
 * CourseProgressBar Component
 * TASK-025: Visual progress bar with percentage label
 *
 * REQ-FE-413: Student Enrollment Status
 * REQ-FE-443: Course Progress Display
 */

import { Progress } from "~/components/ui/progress";
import { cn } from "~/lib/utils";

interface CourseProgressBarProps {
  percent: number;
  size?: "sm" | "default" | "lg";
  showLabel?: boolean;
}

/**
 * CourseProgressBar - Visual progress indicator
 *
 * Displays a progress bar with optional percentage label.
 * Percent values are clamped between 0 and 100.
 */
export function CourseProgressBar({
  percent,
  size = "default",
  showLabel = true,
}: CourseProgressBarProps) {
  // Clamp percent between 0 and 100
  const clampedPercent = Math.max(0, Math.min(100, percent));

  const sizeClasses: Record<string, string> = {
    sm: "h-1",
    default: "h-2",
    lg: "h-3",
  };

  return (
    <div className="flex items-center gap-2">
      <Progress
        value={clampedPercent}
        className={cn("flex-1", sizeClasses[size])}
        role="progressbar"
        aria-valuenow={clampedPercent}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label="Course progress"
      />
      {showLabel && (
        <span className="text-sm font-medium text-[var(--color-muted-foreground)] min-w-[3ch]">
          {clampedPercent}%
        </span>
      )}
    </div>
  );
}
