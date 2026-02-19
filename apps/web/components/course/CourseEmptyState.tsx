/**
 * CourseEmptyState Component
 * TASK-022: Empty state with illustration and CTA
 *
 * REQ-FE-406: Empty State
 * REQ-FE-408: Role-based Create Button
 */

import { useRouter } from "next/navigation";
import { Button } from "~/components/ui/button";
import { BookOpen, Plus, SearchX } from "lucide-react";

interface CourseEmptyStateProps {
  isInstructor?: boolean;
  hasSearchQuery?: boolean;
  onClearSearch?: () => void;
}

/**
 * CourseEmptyState - Displayed when no courses are available
 */
export function CourseEmptyState({
  isInstructor = false,
  hasSearchQuery = false,
  onClearSearch,
}: CourseEmptyStateProps) {
  const router = useRouter();

  const handleCreateCourse = () => {
    router.push("/courses/create");
  };

  return (
    <div
      role="status"
      aria-label="No courses available"
      className="flex flex-col items-center justify-center py-16 px-4"
    >
      {/* Illustration */}
      <div
        data-testid="empty-illustration"
        className="mb-6 rounded-full bg-[var(--color-neutral-100)] dark:bg-[var(--color-neutral-900)] p-6"
      >
        {hasSearchQuery ? (
          <SearchX className="h-12 w-12 text-[var(--color-muted-foreground)]" />
        ) : (
          <BookOpen className="h-12 w-12 text-[var(--color-muted-foreground)]" />
        )}
      </div>

      {/* Message */}
      <h3 className="text-lg font-semibold mb-2">
        {hasSearchQuery ? "No results found" : "No courses yet"}
      </h3>

      {/* Description */}
      <p className="text-sm text-[var(--color-muted-foreground)] text-center max-w-md mb-6">
        {hasSearchQuery
          ? "Try adjusting your search terms or filters to find what you're looking for."
          : "There are no courses available at the moment. Check back later or create your own course."}
      </p>

      {/* CTAs */}
      <div className="flex flex-col sm:flex-row gap-3">
        {hasSearchQuery && onClearSearch && (
          <Button variant="outline" onClick={onClearSearch}>
            Clear search
          </Button>
        )}

        {isInstructor && !hasSearchQuery && (
          <Button onClick={handleCreateCourse}>
            <Plus className="h-4 w-4 mr-2" />
            Create Course
          </Button>
        )}
      </div>
    </div>
  );
}
