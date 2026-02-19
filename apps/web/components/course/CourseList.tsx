/**
 * CourseList Component
 * TASK-018: List layout for courses
 *
 * REQ-FE-400: Course List Display
 * REQ-FE-401: Grid and List View Toggle
 */

import { CourseCard, CourseCardSkeleton } from "./CourseCard";
import { CourseEmptyState } from "./CourseEmptyState";
import type { CourseListItem } from "@shared";

interface CourseListProps {
  courses: CourseListItem[];
  showProgress?: boolean;
  progressMap?: Record<string, number>;
  isLoading?: boolean;
  skeletonCount?: number;
}

/**
 * CourseList - Vertical stack layout for course cards
 */
export function CourseList({
  courses,
  showProgress = false,
  progressMap = {},
  isLoading = false,
  skeletonCount = 5,
}: CourseListProps) {
  // Loading state with skeletons
  if (isLoading) {
    return (
      <div
        data-testid="course-list"
        className="flex flex-col gap-4"
        role="list"
        aria-label="Course list"
      >
        {Array.from({ length: skeletonCount }).map((_, index) => (
          <CourseCardSkeleton key={index} variant="list" />
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
      data-testid="course-list"
      className="flex flex-col gap-4"
      role="list"
      aria-label="Course list"
    >
      {courses.map((course) => (
        <div key={course.id} role="listitem">
          <CourseCard
            course={course}
            variant="list"
            showProgress={showProgress}
            progressPercent={progressMap[course.id] ?? 0}
          />
        </div>
      ))}
    </div>
  );
}
