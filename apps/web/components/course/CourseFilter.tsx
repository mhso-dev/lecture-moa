/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * CourseFilter Component
 * TASK-020: Category filter tabs and sort select dropdown
 *
 * REQ-FE-403: Category Filter
 * REQ-FE-404: Sort Options
 */

"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { Button } from "~/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";
import type { CourseCategory, CourseSortOption } from "@shared";

interface CourseFilterProps {
  selectedCategory?: CourseCategory | null;
  selectedSort?: CourseSortOption;
  onCategoryChange?: (category: CourseCategory | null) => void;
  onSortChange?: (sort: CourseSortOption) => void;
}

const CATEGORIES: { value: CourseCategory | null; label: string }[] = [
  { value: null, label: "전체" },
  { value: "programming", label: "프로그래밍" },
  { value: "design", label: "디자인" },
  { value: "business", label: "비즈니스" },
  { value: "science", label: "과학" },
  { value: "language", label: "언어" },
  { value: "other", label: "기타" },
];

const SORT_OPTIONS: { value: CourseSortOption; label: string }[] = [
  { value: "recent", label: "최신순" },
  { value: "popular", label: "인기순" },
  { value: "alphabetical", label: "가나다순" },
];

/**
 * CourseFilter - Category tabs and sort dropdown
 */
export function CourseFilter({
  selectedCategory = null,
  selectedSort = "recent",
  onCategoryChange,
  onSortChange,
}: CourseFilterProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();

  const handleCategoryChange = (category: CourseCategory | null) => {
    onCategoryChange?.(category);

    // Update URL params
    const params = new URLSearchParams(searchParams.toString());
    if (category) {
      params.set("category", category);
    } else {
      params.delete("category");
    }
    params.set("page", "1"); // Reset to first page
    router.replace(`${pathname}?${params.toString()}` as any);
  };

  const handleSortChange = (sort: CourseSortOption) => {
    onSortChange?.(sort);

    // Update URL params
    const params = new URLSearchParams(searchParams.toString());
    params.set("sort", sort);
    router.replace(`${pathname}?${params.toString()}` as any);
  };

  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
      {/* Category Tabs */}
      <div
        role="tablist"
        aria-label="카테고리별 필터"
        className="flex flex-wrap gap-1"
      >
        {CATEGORIES.map((category) => {
          const isSelected =
            category.value === selectedCategory ||
            (category.value === null && selectedCategory === null);

          return (
            <Button
              key={category.label}
              role="tab"
              aria-selected={isSelected}
              variant={isSelected ? "default" : "ghost"}
              size="sm"
              onClick={() => { handleCategoryChange(category.value); }}
              className="text-sm"
            >
              {category.label}
            </Button>
          );
        })}
      </div>

      {/* Sort Select */}
      <Select value={selectedSort} onValueChange={handleSortChange}>
        <SelectTrigger
          className="w-[180px]"
          aria-label="강의 정렬"
        >
          <SelectValue placeholder="정렬" />
        </SelectTrigger>
        <SelectContent>
          {SORT_OPTIONS.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
