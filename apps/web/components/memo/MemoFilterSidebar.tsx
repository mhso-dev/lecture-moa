/* eslint-disable @typescript-eslint/prefer-nullish-coalescing */
/* eslint-disable react-hooks/exhaustive-deps */
/**
 * MemoFilterSidebar Component
 * REQ-FE-751, REQ-FE-752: Desktop filter panel for personal memo list
 *
 * Features:
 * - Search input with 300ms debounce
 * - Course/Material cascading dropdowns
 * - Tag multi-select chips
 * - Visibility toggle (Personal/Team)
 * - Active filters displayed as dismissible chips
 * - Clear all button
 * - Desktop only (shown on lg: breakpoint and up)
 */

"use client";

import { useState, useEffect } from "react";
import { Search, X, Filter } from "lucide-react";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";
import { Badge } from "~/components/ui/badge";
import { Switch } from "~/components/ui/switch";
import { cn } from "~/lib/utils";
import { useDebounce } from "~/hooks/useDebounce";
import type { MemoFilterParams } from "@shared/types/memo.types";

/**
 * Course type for filter dropdown
 */
interface Course {
  id: string;
  name: string;
}

/**
 * Material type for filter dropdown
 */
interface Material {
  id: string;
  title: string;
  courseId: string;
}

/**
 * Props for MemoFilterSidebar component
 */
interface MemoFilterSidebarProps {
  /** Current filter values */
  filters: MemoFilterParams;
  /** Callback when filters change */
  onFiltersChange: (filters: MemoFilterParams) => void;
  /** Available courses for dropdown */
  courses: Course[];
  /** Available materials (filtered by selected course) */
  materials: Material[];
  /** Available tags for autocomplete */
  availableTags: string[];
  /** Additional CSS classes */
  className?: string;
}

/**
 * MemoFilterSidebar - Desktop filter panel for memo list
 * REQ-FE-751: Two-column layout on desktop (filter sidebar)
 * REQ-FE-752: Filter controls with debounced search
 *
 * @param props - Component props
 * @returns MemoFilterSidebar component
 *
 * @example
 * ```tsx
 * <MemoFilterSidebar
 *   filters={filters}
 *   onFiltersChange={setFilters}
 *   courses={userCourses}
 *   materials={courseMaterials}
 *   availableTags={allTags}
 * />
 * ```
 */
export function MemoFilterSidebar({
  filters,
  onFiltersChange,
  courses,
  materials,
  availableTags,
  className,
}: MemoFilterSidebarProps) {
  const [searchValue, setSearchValue] = useState(filters.search || "");
  const [selectedTags, setSelectedTags] = useState<string[]>(filters.tags || []);
  const [tagInput, setTagInput] = useState("");

  // Debounce search input (300ms)
  const debouncedSearch = useDebounce(searchValue, 300);

  // Update parent when debounced search changes
  useEffect(() => {
    onFiltersChange({
      ...filters,
      search: debouncedSearch || undefined,
    });
  }, [debouncedSearch]);

  // Update parent when tags change
  useEffect(() => {
    onFiltersChange({
      ...filters,
      tags: selectedTags.length > 0 ? selectedTags : undefined,
    });
  }, [selectedTags]);

  /**
   * Handle course change - reset material selection
   */
  const handleCourseChange = (courseId: string) => {
    onFiltersChange({
      ...filters,
      courseId: courseId || undefined,
      materialId: undefined,
    });
  };

  /**
   * Handle material change
   */
  const handleMaterialChange = (materialId: string) => {
    onFiltersChange({
      ...filters,
      materialId: materialId || undefined,
    });
  };

  /**
   * Handle visibility toggle
   */
  const handleVisibilityChange = (checked: boolean) => {
    onFiltersChange({
      ...filters,
      visibility: checked ? "team" : "personal",
    });
  };

  /**
   * Add tag to selection
   */
  const handleAddTag = (tag: string) => {
    const normalizedTag = tag.trim().toLowerCase();
    if (normalizedTag && !selectedTags.includes(normalizedTag) && selectedTags.length < 10) {
      setSelectedTags([...selectedTags, normalizedTag]);
      setTagInput("");
    }
  };

  /**
   * Remove tag from selection
   */
  const handleRemoveTag = (tag: string) => {
    setSelectedTags(selectedTags.filter((t) => t !== tag));
  };

  /**
   * Clear all filters
   */
  const handleClearAll = () => {
    setSearchValue("");
    setSelectedTags([]);
    onFiltersChange({
      visibility: "personal",
    });
  };

  // Filter materials by selected course
  const filteredMaterials = filters.courseId
    ? materials.filter((m) => m.courseId === filters.courseId)
    : materials;

  // Count active filters
  const activeFilterCount =
    (filters.search ? 1 : 0) +
    (filters.courseId ? 1 : 0) +
    (filters.materialId ? 1 : 0) +
    (selectedTags.length > 0 ? 1 : 0);

  return (
    <aside className={cn("w-64 border-r border-[var(--color-border)] p-6", className)}>
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Filter className="h-5 w-5 text-[var(--color-muted-foreground)]" />
          <h3 className="font-semibold">Filters</h3>
        </div>
        {activeFilterCount > 0 && (
          <Button
            variant="ghost"
            size="sm"
            onClick={handleClearAll}
            className="h-8 text-xs text-[var(--color-muted-foreground)]"
          >
            Clear all
          </Button>
        )}
      </div>

      <div className="space-y-6">
        {/* Search */}
        <div className="space-y-2">
          <Label htmlFor="memo-search">Search</Label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--color-muted-foreground)]" />
            <Input
              id="memo-search"
              placeholder="Search memos..."
              value={searchValue}
              onChange={(e) => { setSearchValue(e.target.value); }}
              className="pl-10"
            />
          </div>
        </div>

        {/* Visibility Toggle */}
        <div className="flex items-center justify-between">
          <Label htmlFor="visibility-toggle">Show Team Memos</Label>
          <Switch
            id="visibility-toggle"
            checked={filters.visibility === "team"}
            onCheckedChange={handleVisibilityChange}
          />
        </div>

        {/* Course Filter */}
        <div className="space-y-2">
          <Label>Course</Label>
          <Select
            value={filters.courseId || ""}
            onValueChange={handleCourseChange}
          >
            <SelectTrigger>
              <SelectValue placeholder="All courses" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">All courses</SelectItem>
              {courses.map((course) => (
                <SelectItem key={course.id} value={course.id}>
                  {course.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Material Filter */}
        <div className="space-y-2">
          <Label>Material</Label>
          <Select
            value={filters.materialId || ""}
            onValueChange={handleMaterialChange}
            disabled={!filters.courseId}
          >
            <SelectTrigger>
              <SelectValue placeholder={filters.courseId ? "All materials" : "Select course first"} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">All materials</SelectItem>
              {filteredMaterials.map((material) => (
                <SelectItem key={material.id} value={material.id}>
                  {material.title}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Tag Filter */}
        <div className="space-y-2">
          <Label>Tags (max 10)</Label>
          <Input
            placeholder="Add a tag..."
            value={tagInput}
            onChange={(e) => { setTagInput(e.target.value); }}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                handleAddTag(tagInput);
              }
            }}
            disabled={selectedTags.length >= 10}
          />
          {selectedTags.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {selectedTags.map((tag) => (
                <Badge
                  key={tag}
                  variant="secondary"
                  className="gap-1 pr-1"
                >
                  {tag}
                  <button
                    onClick={() => { handleRemoveTag(tag); }}
                    className="ml-1 rounded-full p-0.5 hover:bg-[var(--color-muted)]"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              ))}
            </div>
          )}
          {availableTags.length > 0 && selectedTags.length === 0 && (
            <div className="space-y-1">
              <p className="text-xs text-[var(--color-muted-foreground)]">Popular:</p>
              <div className="flex flex-wrap gap-1.5">
                {availableTags.slice(0, 5).map((tag) => (
                  <Badge
                    key={tag}
                    variant="outline"
                    className="cursor-pointer hover:bg-[var(--color-secondary)]"
                    onClick={() => { handleAddTag(tag); }}
                  >
                    {tag}
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </aside>
  );
}

export type { MemoFilterSidebarProps, Course, Material };
