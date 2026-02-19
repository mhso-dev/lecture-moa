/**
 * MyCoursesWidget Component
 * REQ-FE-221: My Courses Overview Widget
 */

import type { Route } from "next";
import Link from "next/link";
import { BookOpen, Plus, ChevronRight, Users, FileText, MessageCircle } from "lucide-react";
import { DashboardWidget } from "../DashboardWidget";
import { EmptyState } from "../EmptyState";
import { useInstructorCourses } from "~/hooks/dashboard/useInstructorDashboard";
import { Badge } from "~/components/ui/badge";

/**
 * Maximum number of courses to display in the widget
 */
const MAX_DISPLAYED_COURSES = 5;

/**
 * MyCoursesWidget displays a list of courses the instructor has created
 * with key metrics.
 *
 * Features:
 * - Course name, student count, materials count, pending Q&A count
 * - Published/Draft status badge
 * - "Create new course" button
 * - Maximum 5 courses displayed
 * - "View all courses" link to /courses
 * - Empty state with "Create Course" CTA
 *
 * @example
 * ```tsx
 * <MyCoursesWidget />
 * ```
 */
export function MyCoursesWidget() {
  const { data: courses, isLoading, error, refetch } = useInstructorCourses();

  // Limit to MAX_DISPLAYED_COURSES
  const displayedCourses = courses?.slice(0, MAX_DISPLAYED_COURSES);
  const hasMore = (courses?.length ?? 0) > MAX_DISPLAYED_COURSES;
  const hasCourses = (courses?.length ?? 0) > 0;

  return (
    <DashboardWidget
      title="My Courses"
      subtitle="Courses you manage"
      headerAction={
        hasCourses ? (
          <Link
            href={"/courses" as Route}
            className="text-sm text-primary hover:underline flex items-center gap-1"
          >
            View all
            <ChevronRight className="h-4 w-4" />
          </Link>
        ) : (
          <Link
            href={"/courses/new" as Route}
            className="text-sm text-primary hover:underline flex items-center gap-1"
          >
            <Plus className="h-4 w-4" />
            Create
          </Link>
        )
      }
      isLoading={isLoading}
      error={error?.message ?? null}
      onRetry={() => void refetch()}
      testId="my-courses-widget"
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
                  <div className="flex items-center gap-2">
                    <h4 className="text-sm font-medium truncate group-hover:text-primary transition-colors">
                      {course.title}
                    </h4>
                    <Badge variant={course.isPublished ? "default" : "secondary"} className="text-xs">
                      {course.isPublished ? "Published" : "Draft"}
                    </Badge>
                  </div>
                  <div className="mt-2 flex items-center gap-4 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Users className="h-3 w-3" />
                      <span data-testid={`students-${course.id}`}>{course.enrolledCount}</span>
                    </span>
                    <span className="flex items-center gap-1">
                      <FileText className="h-3 w-3" />
                      <span data-testid={`materials-${course.id}`}>{course.materialsCount}</span>
                    </span>
                    <span className="flex items-center gap-1">
                      <MessageCircle className="h-3 w-3" />
                      <span data-testid={`qa-${course.id}`}>{course.pendingQACount}</span>
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
              View {courses.length - MAX_DISPLAYED_COURSES} more courses
            </Link>
          )}
        </div>
      ) : (
        <EmptyState
          icon={BookOpen}
          title="No courses yet"
          description="You haven't created any courses yet."
          action={{ label: "Create Course", href: "/courses/new" as Route }}
        />
      )}
    </DashboardWidget>
  );
}
