/**
 * CourseGrid Component
 * TASK-018: Responsive grid layout for courses
 *
 * REQ-FE-400: Course List Display
 * REQ-FE-401: Grid and List View Toggle
 */

import { CourseCard, CourseCardSkeleton } from "./CourseCard";
import { CourseEmptyState } from "./CourseEmptyState";
import type { CourseListItem } from "@shared";

interface CourseGridProps {
  courses: CourseListItem[];
  showProgress?: boolean;
  progressMap?: Record<string, number>;
  isLoading?: boolean;
  skeletonCount?: number;
}

/**
 * CourseGrid - Responsive grid layout for course cards
 *
 * Responsive breakpoints:
 * - Mobile: 1 column
 * - Tablet (md): 2 columns
 * - Desktop (lg): 3 columns
 * - Large Desktop (xl): 4 columns
 */
export function CourseGrid({
  courses,
  showProgress = false,
  progressMap = {},
  isLoading = false,
  skeletonCount = 8,
}: CourseGridProps) {
  // Loading state with skeletons
  if (isLoading) {
    return (
      <div
        data-testid="course-grid"
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4"
        role="list"
        aria-label="Course list"
      >
        {Array.from({ length: skeletonCount }).map((_, index) => (
          <CourseCardSkeleton key={index} variant="grid" />
        ))}
      </div>
    );
  }

  // Empty state
  if (courses.length === 0) {
    return <CourseEmptyState />;
  }

  return (
    <div
      data-testid="course-grid"
      className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4"
      role="list"
      aria-label="Course list"
    >
      {courses.map((course) => (
        <div key={course.id} role="listitem">
          <CourseCard
            course={course}
            variant="grid"
            showProgress={showProgress}
            progressPercent={progressMap[course.id] ?? 0}
          />
        </div>
      ))}
    </div>
  );
}
