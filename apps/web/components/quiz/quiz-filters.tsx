/**
 * QuizFilters Component
 * REQ-FE-603: Quiz List Filtering
 * REQ-FE-603: URL sync with useSearchParams
 */

"use client";

import type { Route } from "next";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";
import { cn } from "~/lib/utils";
import type { QuizStatus } from "@shared";

interface CourseOption {
  id: string;
  name: string;
}

interface FilterState {
  status?: QuizStatus | "all";
  courseId?: string;
}

interface QuizFiltersProps {
  onFilterChange: (filters: FilterState) => void;
  initialFilters?: FilterState;
  courses?: CourseOption[];
  role?: "student" | "instructor";
  className?: string;
}

/**
 * Status options for students
 */
const STUDENT_STATUS_OPTIONS = [
  { value: "all", label: "전체" },
  { value: "published", label: "예정" },
  { value: "submitted", label: "완료" },
] as const;

/**
 * Status options for instructors
 */
const INSTRUCTOR_STATUS_OPTIONS = [
  { value: "all", label: "전체" },
  { value: "draft", label: "초안" },
  { value: "published", label: "게시됨" },
  { value: "closed", label: "마감" },
] as const;

/**
 * QuizFilters - Filter controls for quiz list
 */
export function QuizFilters({
  onFilterChange,
  initialFilters,
  courses = [],
  role = "student",
  className,
}: QuizFiltersProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();

  // Get current values from URL or initial filters
  const currentStatus = searchParams.get("status") ?? initialFilters?.status ?? "all";
  const currentCourseId = searchParams.get("courseId") ?? initialFilters?.courseId ?? "all";

  const statusOptions = role === "instructor"
    ? INSTRUCTOR_STATUS_OPTIONS
    : STUDENT_STATUS_OPTIONS;

  const updateUrlParams = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString());

    if (value && value !== "all") {
      params.set(key, value);
    } else {
      params.delete(key);
    }

    // Update URL without full page reload
    router.replace(`${pathname}?${params.toString()}` as Route, { scroll: false });
  };

  const handleStatusChange = (value: string) => {
    updateUrlParams("status", value);
    onFilterChange({
      status: value as QuizStatus | "all",
      courseId: currentCourseId === "all" ? undefined : currentCourseId,
    });
  };

  const handleCourseChange = (value: string) => {
    updateUrlParams("courseId", value);
    onFilterChange({
      status: currentStatus as QuizStatus | "all",
      courseId: value === "all" ? undefined : value,
    });
  };

  return (
    <div
      className={cn(
        "flex flex-col sm:flex-row sm:items-center gap-4",
        className
      )}
    >
      {/* Status Filter */}
      <div className="flex items-center gap-2">
        <label htmlFor="status-filter" className="text-sm font-medium sr-only">
          Status
        </label>
        <Select value={currentStatus} onValueChange={handleStatusChange}>
          <SelectTrigger
            id="status-filter"
            className="w-[160px]"
            aria-label="상태별 필터"
          >
            <SelectValue placeholder="상태" />
          </SelectTrigger>
          <SelectContent>
            {statusOptions.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Course Filter */}
      {courses.length > 0 && (
        <div className="flex items-center gap-2">
          <label htmlFor="course-filter" className="text-sm font-medium sr-only">
            강의
          </label>
          <Select value={currentCourseId} onValueChange={handleCourseChange}>
            <SelectTrigger
              id="course-filter"
              className="w-[200px]"
              aria-label="강의별 필터"
            >
              <SelectValue placeholder="전체 강의" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">전체 강의</SelectItem>
              {courses.map((course) => (
                <SelectItem key={course.id} value={course.id}>
                  {course.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}
    </div>
  );
}

export type { FilterState, CourseOption };
