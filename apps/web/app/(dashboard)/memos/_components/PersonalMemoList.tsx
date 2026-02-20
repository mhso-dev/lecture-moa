/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unnecessary-condition */
/**
 * PersonalMemoList Client Component
 * REQ-FE-750, REQ-FE-752, REQ-FE-753: Interactive memo list with filters
 */

"use client";

import { useState, useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Plus, FileText, SearchX } from "lucide-react";
import { Button } from "~/components/ui/button";
import { Skeleton } from "~/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";
import { useMediaQuery } from "~/hooks/useMediaQuery";
import { usePersonalMemos } from "~/hooks/memo/useMemos";
import { useAuthStore } from "~/stores/auth.store";
import { MemoFilterSidebar } from "~/components/memo/MemoFilterSidebar";
import { MemoFilterSheet } from "~/components/memo/MemoFilterSheet";
import { MemoListItem } from "~/components/memo/MemoListItem";
import type { MemoFilterParams } from "@shared/types/memo.types";

/**
 * Sort options for memo list
 */
type SortOption = "newest" | "oldest" | "modified" | "title";

/**
 * Mock data for demo (would come from API in production)
 */
const mockCourses = [
  { id: "course-1", name: "React Fundamentals" },
  { id: "course-2", name: "TypeScript Deep Dive" },
  { id: "course-3", name: "Node.js Backend" },
];

const mockMaterials = [
  { id: "mat-1", title: "Introduction to React", courseId: "course-1" },
  { id: "mat-2", title: "React Hooks Guide", courseId: "course-1" },
  { id: "mat-3", title: "TypeScript Generics", courseId: "course-2" },
  { id: "mat-4", title: "Express.js Setup", courseId: "course-3" },
];

const mockTags = ["react", "typescript", "nodejs", "hooks", "api"];

/**
 * PersonalMemoList - Interactive memo list with filters
 * REQ-FE-752: Two-column layout on Desktop, one-column on Mobile
 * REQ-FE-753: Empty states with contextual messages
 */
export function PersonalMemoList() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { isMobile } = useMediaQuery();
  const user = useAuthStore((state) => state.user);

  // Initialize filters from URL params
  const [filters, setFilters] = useState<MemoFilterParams>(() => ({
    visibility: (searchParams.get("visibility") as "personal" | "team") ?? "personal",
    search: searchParams.get("search") ?? undefined,
    courseId: searchParams.get("courseId") ?? undefined,
    materialId: searchParams.get("materialId") ?? undefined,
    tags: searchParams.get("tags")?.split(",").filter(Boolean) ?? undefined,
  }));

  const [sortBy, setSortBy] = useState<SortOption>(
    searchParams.get("sort") as SortOption ?? "modified"
  );

  // Fetch memos with TanStack Query
  const {
    data,
    isLoading,
    isError,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = usePersonalMemos(filters);

  // Flatten pages into single array
  const memos = useMemo(() => {
    const allMemos = data?.pages.flatMap((page) => page.data) ?? [];

    // Client-side sorting (server would handle this in production)
    return allMemos.sort((a, b) => {
      switch (sortBy) {
        case "newest":
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        case "oldest":
          return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
        case "modified":
          return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
        case "title":
          return a.title.localeCompare(b.title);
        default:
          return 0;
      }
    });
  }, [data, sortBy]);

  /**
   * Update filters and sync to URL
   */
  const handleFiltersChange = (newFilters: MemoFilterParams) => {
    setFilters(newFilters);

    // Sync to URL params
    const params = new URLSearchParams();
    if (newFilters.visibility) params.set("visibility", newFilters.visibility);
    if (newFilters.search) params.set("search", newFilters.search);
    if (newFilters.courseId) params.set("courseId", newFilters.courseId);
    if (newFilters.materialId) params.set("materialId", newFilters.materialId);
    if (newFilters.tags) params.set("tags", newFilters.tags.join(","));

    router.push(`/memos?${params.toString()}` as any, { scroll: false });
  };

  /**
   * Handle edit action
   */
  const handleEdit = (memoId: string) => {
    router.push(`/memos/${memoId}/edit` as any);
  };

  /**
   * Handle delete action
   */
  const handleDelete = (memoId: string) => {
    // In production, this would call useDeleteMemo mutation
    console.log("Delete memo:", memoId);
  };

  /**
   * Render loading skeleton
   */
  const renderSkeleton = () => (
    <div className="space-y-4">
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="rounded-lg border border-[var(--color-border)] p-4">
          <Skeleton className="h-5 w-3/4 mb-2" />
          <Skeleton className="h-4 w-full mb-1" />
          <Skeleton className="h-4 w-2/3 mb-3" />
          <div className="flex justify-between">
            <Skeleton className="h-3 w-24" />
            <Skeleton className="h-3 w-16" />
          </div>
        </div>
      ))}
    </div>
  );

  /**
   * Render empty state - no memos at all
   */
  const renderEmptyNoMemos = () => (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="rounded-full bg-[var(--color-muted)] p-4 mb-4">
        <FileText className="h-8 w-8 text-[var(--color-muted-foreground)]" />
      </div>
      <h3 className="text-lg font-semibold mb-2">No memos yet</h3>
      <p className="text-[var(--color-muted-foreground)] mb-6 max-w-sm">
        You haven't created any memos yet. Start documenting your learning journey!
      </p>
      <Button onClick={() => { router.push("/memos/new" as any); }} className="gap-2">
        <Plus className="h-4 w-4" />
        Create your first memo
      </Button>
    </div>
  );

  /**
   * Render empty state - no results for filters
   */
  const renderEmptyNoResults = () => (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="rounded-full bg-[var(--color-muted)] p-4 mb-4">
        <SearchX className="h-8 w-8 text-[var(--color-muted-foreground)]" />
      </div>
      <h3 className="text-lg font-semibold mb-2">No memos match your filters</h3>
      <p className="text-[var(--color-muted-foreground)] mb-6 max-w-sm">
        Try adjusting your search or filters to find what you're looking for.
      </p>
      <Button
        variant="outline"
        onClick={() => { handleFiltersChange({ visibility: "personal" }); }}
      >
        Clear filters
      </Button>
    </div>
  );

  return (
    <div className="flex h-full">
      {/* Desktop: Filter Sidebar */}
      {!isMobile && (
        <MemoFilterSidebar
          filters={filters}
          onFiltersChange={handleFiltersChange}
          courses={mockCourses}
          materials={mockMaterials}
          availableTags={mockTags}
        />
      )}

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto">
        <div className="container max-w-4xl py-6 px-4 md:px-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-2xl font-bold">My Memos</h1>
              <p className="text-[var(--color-muted-foreground)]">
                {filters.visibility === "team" ? "Team memos you've authored" : "Your personal study notes"}
              </p>
            </div>

            <div className="flex items-center gap-2">
              {/* Mobile: Filter Sheet */}
              {isMobile && (
                <MemoFilterSheet
                  filters={filters}
                  onFiltersChange={handleFiltersChange}
                  courses={mockCourses}
                  materials={mockMaterials}
                  availableTags={mockTags}
                />
              )}

              {/* Create New Button */}
              <Button onClick={() => { router.push("/memos/new" as any); }} className="gap-2">
                <Plus className="h-4 w-4" />
                <span className="hidden sm:inline">New Memo</span>
              </Button>
            </div>
          </div>

          {/* Sort Controls */}
          <div className="flex items-center gap-4 mb-6">
            <label className="text-sm font-medium">Sort by:</label>
            <Select value={sortBy} onValueChange={(v) => { setSortBy(v as SortOption); }}>
              <SelectTrigger className="w-[180px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="modified">Last modified</SelectItem>
                <SelectItem value="newest">Newest</SelectItem>
                <SelectItem value="oldest">Oldest</SelectItem>
                <SelectItem value="title">Title A-Z</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Memo List */}
          {isLoading ? (
            renderSkeleton()
          ) : isError ? (
            <div className="text-center py-16 text-[var(--color-destructive)]">
              Failed to load memos. Please try again.
            </div>
          ) : memos.length === 0 ? (
            // Show different empty states based on filters
            filters.search || filters.courseId || filters.materialId || (filters.tags && filters.tags.length > 0)
              ? renderEmptyNoResults()
              : renderEmptyNoMemos()
          ) : (
            <div className="space-y-4">
              {memos.map((memo) => (
                <MemoListItem
                  key={memo.id}
                  memo={memo}
                  currentUserId={user?.id ?? ""}
                  onEdit={handleEdit}
                  onDelete={handleDelete}
                />
              ))}

              {/* Load More */}
              {hasNextPage && (
                <div className="flex justify-center pt-4">
                  <Button
                    variant="outline"
                    onClick={() => fetchNextPage()}
                    disabled={isFetchingNextPage}
                  >
                    {isFetchingNextPage ? "Loading..." : "Load more memos"}
                  </Button>
                </div>
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
