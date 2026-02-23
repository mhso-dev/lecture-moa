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
      aria-label="이용 가능한 강의 없음"
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
        {hasSearchQuery ? "검색 결과가 없습니다" : "아직 강의가 없습니다"}
      </h3>

      {/* Description */}
      <p className="text-sm text-[var(--color-muted-foreground)] text-center max-w-md mb-6">
        {hasSearchQuery
          ? "검색어나 필터를 조정해 보세요."
          : "현재 이용 가능한 강의가 없습니다. 나중에 다시 확인하거나 직접 강의를 만들어 보세요."}
      </p>

      {/* CTAs */}
      <div className="flex flex-col sm:flex-row gap-3">
        {hasSearchQuery && onClearSearch && (
          <Button variant="outline" onClick={onClearSearch}>
            검색 초기화
          </Button>
        )}

        {isInstructor && !hasSearchQuery && (
          <Button onClick={handleCreateCourse}>
            <Plus className="h-4 w-4 mr-2" />
            강의 만들기
          </Button>
        )}
      </div>
    </div>
  );
}
