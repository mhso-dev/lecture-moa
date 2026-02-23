"use client";

/**
 * EnrolledCoursesWidget Component
 * REQ-FE-211: Enrolled Courses Progress Widget
 */

import type { Route } from "next";
import Link from "next/link";
import { BookOpen, ChevronRight } from "lucide-react";
import { DashboardWidget } from "../DashboardWidget";
import { EmptyState } from "../EmptyState";
import { useEnrolledCourses } from "~/hooks/dashboard/useStudentDashboard";
import { Progress } from "~/components/ui/progress";

/**
 * Maximum number of courses to display in the widget
 */
const MAX_DISPLAYED_COURSES = 5;

/**
 * EnrolledCoursesWidget displays a list of courses the student is enrolled in
 * with progress indicators.
 *
 * Features:
 * - Course name, instructor name, progress percentage
 * - Maximum 5 courses displayed
 * - "View all courses" link to /courses
 * - Empty state with CTA to browse courses
 *
 * @example
 * ```tsx
 * <EnrolledCoursesWidget />
 * ```
 */
export function EnrolledCoursesWidget() {
  const { data: courses, isLoading, error, refetch } = useEnrolledCourses();

  // Limit to MAX_DISPLAYED_COURSES
  const displayedCourses = courses?.slice(0, MAX_DISPLAYED_COURSES);
  const hasMore = (courses?.length ?? 0) > MAX_DISPLAYED_COURSES;

  return (
    <DashboardWidget
      title="내 강의"
      subtitle="수강 중인 강의"
      headerAction={
        courses && courses.length > 0 ? (
          <Link
            href={"/courses" as Route}
            className="text-sm text-primary hover:underline flex items-center gap-1"
          >
            전체 보기
            <ChevronRight className="h-4 w-4" />
          </Link>
        ) : undefined
      }
      isLoading={isLoading}
      error={error?.message ?? null}
      onRetry={() => void refetch()}
      testId="enrolled-courses-widget"
    >
      {displayedCourses && displayedCourses.length > 0 ? (
        <div className="space-y-4">
          {displayedCourses.map((course) => (
            <Link
              key={course.id}
              href={`/courses/${course.id}` as Route}
              className="block group"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <h4 className="text-sm font-medium truncate group-hover:text-primary transition-colors">
                    {course.title}
                  </h4>
                  <p className="text-xs text-muted-foreground truncate">
                    {course.instructorName}
                  </p>
                  <div className="mt-2 flex items-center gap-2">
                    <Progress
                      value={course.progressPercent}
                      className="h-1.5 flex-1"
                    />
                    <span className="text-xs font-medium text-muted-foreground w-8 text-right">
                      {course.progressPercent}%
                    </span>
                  </div>
                </div>
              </div>
            </Link>
          ))}

          {hasMore && courses && (
            <Link
              href={"/courses" as Route}
              className="block text-sm text-center text-primary hover:underline pt-2"
            >
              {courses.length - MAX_DISPLAYED_COURSES}개의 강의 더 보기
            </Link>
          )}
        </div>
      ) : (
        <EmptyState
          icon={BookOpen}
          title="아직 수강 중인 강의가 없습니다"
          description="강의를 둘러보고 수강 신청하세요."
          action={{ label: "강의 둘러보기", href: "/courses" as Route }}
        />
      )}
    </DashboardWidget>
  );
}
