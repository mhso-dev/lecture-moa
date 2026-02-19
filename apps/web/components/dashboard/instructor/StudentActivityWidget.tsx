/**
 * StudentActivityWidget Component
 * REQ-FE-222: Student Enrollment & Activity Widget
 */

import { Users, Activity, BarChart3, Clock } from "lucide-react";
import { DashboardWidget } from "../DashboardWidget";
import { useStudentActivity } from "~/hooks/dashboard/useInstructorDashboard";

/**
 * StudentActivityWidget displays aggregated student enrollment and activity metrics
 * across the instructor's courses.
 *
 * Features:
 * - Total enrolled students
 * - Active students (last 7 days)
 * - Average course completion rate
 * - Total study sessions this week
 * - Summary cards with metric + label layout
 * - No empty state (shows zeros)
 *
 * @example
 * ```tsx
 * <StudentActivityWidget />
 * ```
 */
export function StudentActivityWidget() {
  const { data: stats, isLoading, error, refetch } = useStudentActivity();

  return (
    <DashboardWidget
      title="Student Activity"
      subtitle="Enrollment and engagement"
      isLoading={isLoading}
      error={error?.message ?? null}
      onRetry={() => void refetch()}
      testId="student-activity-widget"
    >
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Users className="h-4 w-4 text-muted-foreground" />
            <span className="text-2xl font-bold">
              {stats?.totalStudents ?? 0}
            </span>
          </div>
          <p className="text-xs text-muted-foreground">Total Students</p>
        </div>

        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Activity className="h-4 w-4 text-muted-foreground" />
            <span className="text-2xl font-bold">
              {stats?.activeStudents7d ?? 0}
            </span>
          </div>
          <p className="text-xs text-muted-foreground">Active 7d</p>
        </div>

        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
            <span className="text-2xl font-bold">
              {stats?.avgCompletionRate.toFixed(1) ?? 0}%
            </span>
          </div>
          <p className="text-xs text-muted-foreground">Avg Completion</p>
        </div>

        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-muted-foreground" />
            <span className="text-2xl font-bold">
              {stats?.studySessions7d ?? 0}
            </span>
          </div>
          <p className="text-xs text-muted-foreground">Sessions 7d</p>
        </div>
      </div>
    </DashboardWidget>
  );
}
