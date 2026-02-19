/**
 * QAFilterBar Component
 * TASK-016: Filter controls for Q&A list
 *
 * Provides filtering by course, material, status, and search.
 * Mobile variant collapses into a Sheet.
 */

"use client";

import { useState, useCallback } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";
import { Input } from "~/components/ui/input";
import { Button } from "~/components/ui/button";
import { Badge } from "~/components/ui/badge";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "~/components/ui/sheet";
import { Tabs, TabsList, TabsTrigger } from "~/components/ui/tabs";
import { useCourses } from "~/hooks/useCourses";
import { useMaterials } from "~/hooks/materials/useMaterials";
import { Search, Filter, X } from "lucide-react";
import { cn } from "~/lib/utils";
import type { QAStatus } from "@shared";

interface QAFilterBarProps {
  className?: string;
}

const statusOptions: { value: QAStatus | "ALL"; label: string }[] = [
  { value: "ALL", label: "전체" },
  { value: "OPEN", label: "진행 중" },
  { value: "RESOLVED", label: "해결됨" },
];

const sortOptions = [
  { value: "newest", label: "최신순" },
  { value: "upvotes", label: "추천순" },
  { value: "answers", label: "답변순" },
  { value: "unanswered", label: "미답변" },
] as const;

/**
 * QAFilterBar - Filter controls for Q&A list
 *
 * Features:
 * - Course dropdown
 * - Material dropdown (disabled when no course selected)
 * - Status tabs: All | Open | Resolved
 * - Search input (debounced 300ms)
 * - URL search params persistence
 * - Mobile: collapse into Sheet
 *
 * @param className - Optional additional classes
 */
export function QAFilterBar({ className }: QAFilterBarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // Current filter values from URL
  const courseId = searchParams.get("courseId") || undefined;
  const materialId = searchParams.get("materialId") || undefined;
  const status = (searchParams.get("status") as QAStatus | "ALL") || "ALL";
  const q = searchParams.get("q") || "";
  const sort = searchParams.get("sort") || "newest";

  // Local search state with debounce
  const [searchInput, setSearchInput] = useState(q);

  // Fetch courses for dropdown
  const { data: coursesData } = useCourses({});
  const courses = coursesData?.data ?? [];

  // Fetch materials when a course is selected
  const { data: materialsData } = useMaterials(courseId ?? "", { limit: 100 });
  const materials = materialsData?.data ?? [];

  // Find selected course for display
  const selectedCourse = courses.find((c) => c.id === courseId);

  // Update URL params
  const updateParams = useCallback(
    (updates: Record<string, string | undefined>) => {
      const params = new URLSearchParams(searchParams.toString());

      Object.entries(updates).forEach(([key, value]) => {
        if (value === undefined || value === "" || value === "ALL") {
          params.delete(key);
        } else {
          params.set(key, value);
        }
      });

      // Reset to page 1 when filters change
      params.delete("page");

      router.push(`${pathname}?${params.toString()}`);
    },
    [router, pathname, searchParams]
  );

  // Handle search input change
  const handleSearchChange = (value: string) => {
    setSearchInput(value);
    updateParams({ q: value || undefined });
  };

  // Clear all filters
  const clearFilters = () => {
    setSearchInput("");
    router.push(pathname);
  };

  const hasActiveFilters = courseId || materialId || status !== "ALL" || q || sort !== "newest";

  // Filter content (shared between desktop and mobile)
  const FilterContent = ({ inSheet = false }: { inSheet?: boolean }) => (
    <div className={cn("space-y-4", inSheet && "pt-4")}>
      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="질문 검색..."
          value={searchInput}
          onChange={(e) => handleSearchChange(e.target.value)}
          className="pl-9"
        />
        {searchInput && (
          <Button
            variant="ghost"
            size="sm"
            className="absolute right-1 top-1/2 h-7 w-7 -translate-y-1/2 p-0"
            onClick={() => handleSearchChange("")}
          >
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>

      {/* Course and Material dropdowns */}
      <div className="flex flex-col sm:flex-row gap-3">
        <Select
          value={courseId || "all"}
          onValueChange={(value) =>
            updateParams({
              courseId: value === "all" ? undefined : value,
              materialId: undefined, // Reset material when course changes
            })
          }
        >
          <SelectTrigger className="w-full sm:w-[180px]">
            <SelectValue placeholder="강의 선택" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">전체 강의</SelectItem>
            {courses.map((course) => (
              <SelectItem key={course.id} value={course.id}>
                {course.title}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={materialId || "all"}
          onValueChange={(value) =>
            updateParams({ materialId: value === "all" ? undefined : value })
          }
          disabled={!courseId}
        >
          <SelectTrigger className="w-full sm:w-[180px]" disabled={!courseId}>
            <SelectValue placeholder={courseId ? "자료 선택" : "강의를 먼저 선택"} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">전체 자료</SelectItem>
            {materials.map((material) => (
              <SelectItem key={material.id} value={material.id}>
                {material.title}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Sort */}
        <Select
          value={sort}
          onValueChange={(value) => updateParams({ sort: value })}
        >
          <SelectTrigger className="w-full sm:w-[120px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {sortOptions.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Status tabs */}
      <Tabs
        value={status}
        onValueChange={(value: string) => updateParams({ status: value })}
      >
        <TabsList>
          {statusOptions.map((option) => (
            <TabsTrigger key={option.value} value={option.value}>
              {option.label}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      {/* Clear filters */}
      {hasActiveFilters && (
        <Button variant="ghost" size="sm" onClick={clearFilters}>
          <X className="mr-2 h-4 w-4" />
          필터 초기화
        </Button>
      )}
    </div>
  );

  return (
    <div className={cn("space-y-4", className)}>
      {/* Desktop: Full filter bar */}
      <div className="hidden md:block">
        <FilterContent />
      </div>

      {/* Mobile: Compact with Sheet */}
      <div className="md:hidden">
        <div className="flex items-center gap-2">
          {/* Search on mobile */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="질문 검색..."
              value={searchInput}
              onChange={(e) => handleSearchChange(e.target.value)}
              className="pl-9"
            />
          </div>

          {/* Filter button */}
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="outline" size="icon" className="shrink-0">
                <Filter className="h-4 w-4" />
                {hasActiveFilters && (
                  <span className="absolute -right-1 -top-1 h-4 w-4 rounded-full bg-primary text-[10px] font-medium text-primary-foreground flex items-center justify-center">
                    !
                  </span>
                )}
              </Button>
            </SheetTrigger>
            <SheetContent side="bottom" className="max-h-[80vh] overflow-y-auto">
              <SheetHeader>
                <SheetTitle>필터</SheetTitle>
              </SheetHeader>
              <FilterContent inSheet />
            </SheetContent>
          </Sheet>
        </div>

        {/* Active filters display */}
        {hasActiveFilters && (
          <div className="flex flex-wrap gap-2 mt-3">
            {courseId && selectedCourse && (
              <Badge variant="secondary" className="gap-1">
                {selectedCourse.title}
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-auto p-0 ml-1"
                  onClick={() => updateParams({ courseId: undefined, materialId: undefined })}
                >
                  <X className="h-3 w-3" />
                </Button>
              </Badge>
            )}
            {status !== "ALL" && (
              <Badge variant="secondary" className="gap-1">
                {statusOptions.find((o) => o.value === status)?.label}
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-auto p-0 ml-1"
                  onClick={() => updateParams({ status: undefined })}
                >
                  <X className="h-3 w-3" />
                </Button>
              </Badge>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
