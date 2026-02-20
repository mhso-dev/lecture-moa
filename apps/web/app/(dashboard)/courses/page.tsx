/**
 * Course List Page
 * TASK-023: Course List Page
 *
 * REQ-FE-400 to REQ-FE-408: Course catalog with search, filter, and pagination
 */

"use client";

import { useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "~/hooks/useAuth";
import { Grid, List, Plus } from "lucide-react";
import { useCourses } from "~/hooks/useCourses";
import { useCourseStore } from "~/stores/course.store";
import {
  CourseSearchBar,
  CourseFilter,
  CourseGrid,
  CourseList,
  CoursePagination,
} from "~/components/course";
import { Button } from "~/components/ui/button";
import type { CourseListParams, CourseListItem } from "@shared";

/**
 * CourseListPage - Main course catalog page
 *
 * Features:
 * - Grid and list view toggle with persistence
 * - Search with URL params
 * - Category filter and sort options
 * - Pagination support
 * - Role-based create button for instructors
 * - Loading and error states
 */
export default function CourseListPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { role } = useAuth();

  // Extract URL params for query
  const params = useMemo<CourseListParams>(() => {
    const page = Number(searchParams.get("page")) || 1;
    const search = searchParams.get("search") ?? undefined;
    const category = searchParams.get("category") ?? undefined;
    const sort = (searchParams.get("sort") as CourseListParams["sort"]) ?? "recent";

    return {
      page,
      limit: 20,
      search,
      category: category as CourseListParams["category"],
      sort,
    };
  }, [searchParams]);

  // Get UI state from Zustand
  const viewMode = useCourseStore((state) => state.viewMode);
  const setViewMode = useCourseStore((state) => state.setViewMode);

  // Fetch courses
  const { data, isLoading, error } = useCourses(params);

  // Handlers
  const handleSearch = (query: string) => {
    const newParams = new URLSearchParams(searchParams.toString());
    if (query) {
      newParams.set("search", query);
    } else {
      newParams.delete("search");
    }
    newParams.set("page", "1"); // Reset to first page on search
    router.push(`/courses?${newParams.toString()}`);
  };

  const handleViewToggle = () => {
    setViewMode(viewMode === "grid" ? "list" : "grid");
  };

  const handleCreateCourse = () => {
    router.push("/courses/create");
  };

  // Role check
  const isInstructor = role === "instructor";

  // Data extraction
  const courses = data?.data ?? [];
  const total = data?.total ?? 0;

  // Early return for loading state
  if (isLoading) {
    return (
      <div className="space-y-6">
        <PageHeader />
        <div className="flex items-center gap-4">
          <CourseSearchBar onSearchChange={handleSearch} />
          <CourseFilter />
        </div>
        <CourseLayout viewMode={viewMode} isLoading={true} />
      </div>
    );
  }

  // Early return for error state
  if (error) {
    return (
      <div className="flex h-96 items-center justify-center">
        <p className="text-body text-neutral-500">
          Error loading courses. Please try again.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        isInstructor={isInstructor}
        viewMode={viewMode}
        onViewToggle={handleViewToggle}
        onCreateCourse={handleCreateCourse}
      />

      <div className="flex items-center gap-4">
        <CourseSearchBar onSearchChange={handleSearch} />
        <CourseFilter />
      </div>

      <CourseLayout
        viewMode={viewMode}
        courses={courses}
        isLoading={false}
      />

      {total > 20 && (
        <CoursePagination
          currentPage={params.page ?? 1}
          totalPages={Math.ceil(total / 20)}
        />
      )}
    </div>
  );
}

// Component parts for better organization

interface PageHeaderProps {
  isInstructor?: boolean;
  viewMode?: "grid" | "list";
  onViewToggle?: () => void;
  onCreateCourse?: () => void;
}

function PageHeader({
  isInstructor,
  viewMode,
  onViewToggle,
  onCreateCourse,
}: PageHeaderProps) {
  return (
    <div className="flex items-center justify-between">
      <div>
        <h1 className="text-h1 font-semibold text-foreground">Courses</h1>
        <p className="mt-2 text-body text-neutral-500">
          Browse and enroll in courses
        </p>
      </div>

      <div className="flex items-center gap-2">
        {onViewToggle && viewMode && (
          <Button
            variant="outline"
            size="icon"
            onClick={onViewToggle}
            aria-label={`Switch to ${viewMode === "grid" ? "list" : "grid"} view`}
          >
            {viewMode === "grid" ? (
              <List className="h-4 w-4" />
            ) : (
              <Grid className="h-4 w-4" />
            )}
          </Button>
        )}

        {isInstructor && onCreateCourse && (
          <Button onClick={onCreateCourse}>
            <Plus className="mr-2 h-4 w-4" />
            Create Course
          </Button>
        )}
      </div>
    </div>
  );
}

interface CourseLayoutProps {
  viewMode: "grid" | "list";
  courses?: CourseListItem[];
  isLoading: boolean;
}

function CourseLayout({ viewMode, courses = [], isLoading }: CourseLayoutProps) {
  return viewMode === "grid" ? (
    <CourseGrid courses={courses} isLoading={isLoading} />
  ) : (
    <CourseList courses={courses} isLoading={isLoading} />
  );
}
