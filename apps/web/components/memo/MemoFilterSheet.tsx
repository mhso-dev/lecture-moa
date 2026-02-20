/* eslint-disable @typescript-eslint/prefer-nullish-coalescing */
/**
 * MemoFilterSheet Component
 * REQ-FE-751: Mobile bottom sheet for memo filters
 *
 * Features:
 * - Same filters as MemoFilterSidebar
 * - Bottom sheet presentation (shadcn/ui Sheet)
 * - "Apply filters" button to close sheet
 * - Mobile only (shown below lg: breakpoint)
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
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  SheetFooter,
} from "~/components/ui/sheet";
import type { MemoFilterParams } from "@shared/types/memo.types";
import type { Course, Material } from "./MemoFilterSidebar";

/**
 * Props for MemoFilterSheet component
 */
interface MemoFilterSheetProps {
  /** Current filter values */
  filters: MemoFilterParams;
  /** Callback when filters change (applied on "Apply") */
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
 * MemoFilterSheet - Mobile filter bottom sheet
 * REQ-FE-751: Mobile bottom sheet (shown below lg: breakpoint)
 *
 * @param props - Component props
 * @returns MemoFilterSheet component
 *
 * @example
 * ```tsx
 * <MemoFilterSheet
 *   filters={filters}
 *   onFiltersChange={setFilters}
 *   courses={userCourses}
 *   materials={courseMaterials}
 *   availableTags={allTags}
 * />
 * ```
 */
export function MemoFilterSheet({
  filters,
  onFiltersChange,
  courses,
  materials,
  availableTags: _availableTags,
  className,
}: MemoFilterSheetProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [tempFilters, setTempFilters] = useState<MemoFilterParams>(filters);
  const [searchValue, setSearchValue] = useState(filters.search || "");
  const [selectedTags, setSelectedTags] = useState<string[]>(filters.tags || []);
  const [tagInput, setTagInput] = useState("");

  // Reset temp filters when sheet opens
  useEffect(() => {
    if (isOpen) {
      setTempFilters(filters);
      setSearchValue(filters.search || "");
      setSelectedTags(filters.tags || []);
    }
  }, [isOpen, filters]);

  /**
   * Apply filters and close sheet
   */
  const handleApply = () => {
    onFiltersChange({
      ...tempFilters,
      search: searchValue || undefined,
      tags: selectedTags.length > 0 ? selectedTags : undefined,
    });
    setIsOpen(false);
  };

  /**
   * Clear all filters
   */
  const handleClearAll = () => {
    setSearchValue("");
    setSelectedTags([]);
    setTempFilters({
      visibility: "personal",
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

  // Count active filters
  const activeFilterCount =
    (filters.search ? 1 : 0) +
    (filters.courseId ? 1 : 0) +
    (filters.materialId ? 1 : 0) +
    ((filters.tags?.length || 0) > 0 ? 1 : 0);

  // Filter materials by selected course
  const filteredMaterials = tempFilters.courseId
    ? materials.filter((m) => m.courseId === tempFilters.courseId)
    : materials;

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>
        <Button variant="outline" size="sm" className={cn("gap-2", className)}>
          <Filter className="h-4 w-4" />
          Filters
          {activeFilterCount > 0 && (
            <Badge variant="secondary" className="ml-1 h-5 w-5 rounded-full p-0 text-xs">
              {activeFilterCount}
            </Badge>
          )}
        </Button>
      </SheetTrigger>
      <SheetContent side="bottom" className="h-[85vh] overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Filter Memos</SheetTitle>
          <SheetDescription>
            Apply filters to find the memos you need.
          </SheetDescription>
        </SheetHeader>

        <div className="mt-6 space-y-6 px-4">
          {/* Search */}
          <div className="space-y-2">
            <Label htmlFor="memo-search-mobile">Search</Label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--color-muted-foreground)]" />
              <Input
                id="memo-search-mobile"
                placeholder="Search memos..."
                value={searchValue}
                onChange={(e) => { setSearchValue(e.target.value); }}
                className="pl-10"
              />
            </div>
          </div>

          {/* Visibility Toggle */}
          <div className="flex items-center justify-between">
            <Label htmlFor="visibility-toggle-mobile">Show Team Memos</Label>
            <Switch
              id="visibility-toggle-mobile"
              checked={tempFilters.visibility === "team"}
              onCheckedChange={(checked) =>
                { setTempFilters({ ...tempFilters, visibility: checked ? "team" : "personal" }); }
              }
            />
          </div>

          {/* Course Filter */}
          <div className="space-y-2">
            <Label>Course</Label>
            <Select
              value={tempFilters.courseId || ""}
              onValueChange={(value) =>
                { setTempFilters({
                  ...tempFilters,
                  courseId: value || undefined,
                  materialId: undefined,
                }); }
              }
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
              value={tempFilters.materialId || ""}
              onValueChange={(value) =>
                { setTempFilters({ ...tempFilters, materialId: value || undefined }); }
              }
              disabled={!tempFilters.courseId}
            >
              <SelectTrigger>
                <SelectValue placeholder={tempFilters.courseId ? "All materials" : "Select course first"} />
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
                  <Badge key={tag} variant="secondary" className="gap-1 pr-1">
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
          </div>
        </div>

        <SheetFooter className="mt-6 flex-row gap-2 px-4">
          <Button variant="outline" onClick={handleClearAll} className="flex-1">
            Clear All
          </Button>
          <Button onClick={handleApply} className="flex-1">
            Apply Filters
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}

// Import cn for className merging
import { cn } from "~/lib/utils";

export type { MemoFilterSheetProps };
