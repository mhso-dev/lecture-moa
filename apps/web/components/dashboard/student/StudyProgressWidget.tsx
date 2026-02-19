/**
 * StudyProgressWidget Component
 * REQ-FE-214: Study Progress Widget
 */

import { Flame, BookOpen, Calendar, Trophy } from "lucide-react";
import { DashboardWidget } from "../DashboardWidget";
import { EmptyState } from "../EmptyState";
import { useStudyProgress } from "~/hooks/dashboard/useStudentDashboard";

/**
 * Stat card component for displaying metrics
 */
function StatCard({
  icon: Icon,
  label,
  value,
  highlight = false,
}: {
  icon: React.ElementType;
  label: string;
  value: number;
  highlight?: boolean;
}) {
  return (
    <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
      <div
        className={cn(
          "flex items-center justify-center h-10 w-10 rounded-full",
          highlight
            ? "bg-orange-100 text-orange-600 dark:bg-orange-900 dark:text-orange-300"
            : "bg-muted text-muted-foreground"
        )}
      >
        <Icon className="h-5 w-5" />
      </div>
      <div>
        <p
          className={cn(
            "text-2xl font-bold",
            highlight && "text-orange-600 dark:text-orange-400"
          )}
        >
          {value}
        </p>
        <p className="text-xs text-muted-foreground">{label}</p>
      </div>
    </div>
  );
}

import { cn } from "~/lib/utils";

/**
 * StudyProgressWidget displays the student's study streak and cumulative progress metrics
 *
 * Features:
 * - Current study streak (days)
 * - Longest streak
 * - Total study sessions
 * - Total materials read
 * - Progress visualization
 * - Empty state
 *
 * @example
 * ```tsx
 * <StudyProgressWidget />
 * ```
 */
export function StudyProgressWidget() {
  const { data: progress, isLoading, error, refetch } = useStudyProgress();

  return (
    <DashboardWidget
      title="Study Progress"
      subtitle="Your learning streak"
      isLoading={isLoading}
      error={error?.message ?? null}
      onRetry={() => void refetch()}
      testId="study-progress-widget"
    >
      {progress ? (
        <div className="grid grid-cols-2 gap-3">
          <StatCard
            icon={Flame}
            label="Current Streak"
            value={progress.currentStreak}
            highlight={progress.currentStreak > 0}
          />
          <StatCard
            icon={Trophy}
            label="Longest Streak"
            value={progress.longestStreak}
          />
          <StatCard
            icon={Calendar}
            label="Total Sessions"
            value={progress.totalSessions}
          />
          <StatCard
            icon={BookOpen}
            label="Materials Read"
            value={progress.materialsRead}
          />
        </div>
      ) : (
        <EmptyState
          icon={Flame}
          title="Start your streak!"
          description="Start studying to build your streak!"
        />
      )}
    </DashboardWidget>
  );
}
