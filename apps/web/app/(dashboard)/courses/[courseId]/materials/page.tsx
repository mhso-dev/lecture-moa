/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState, useMemo, useCallback } from "react";
import { useRouter, useSearchParams, usePathname, useParams } from "next/navigation";
import Link from "next/link";
import {
  Search,
  X,
  Plus,
  FileText,
  ArrowUpDown,
  Tag,
  BookOpen,
} from "lucide-react";
import type { MaterialSortKey, SortOrder, MaterialStatus } from "@shared";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";
import { Badge } from "~/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "~/components/ui/dropdown-menu";
import { useAuthStore } from "~/stores/auth.store";
import { useCourse } from "~/hooks/useCourse";
import { useMaterials } from "~/hooks/materials";
import { useDebounce } from "~/hooks/useDebounce";
import { MaterialCard } from "~/components/materials/MaterialCard";
import { MaterialCardSkeleton } from "~/components/materials/MaterialCardSkeleton";

/**
 * MaterialsPage Component
 * REQ-FE-330, 332, 333, 334: Material list page with filtering and sorting
 *
 * Features:
 * - Search with 300ms debounce
 * - Filter by tags (multi-select), by status (published/draft, instructor only)
 * - Sort by position, title, date, read time
 * - URL search params persistence
 * - Empty state with role-based CTA
 * - Loading and error states
 */
export default function MaterialsPage() {
  const params = useParams();
  const courseId = params.courseId as string;

  // Fetch course data for title
  const { data: course } = useCourse(courseId);
  const courseTitle = course?.title ?? "강의 자료";

  // Get role from auth store
  const role = useAuthStore((state) => state.role);
  const isInstructor = role === "instructor";

  return (
    <MaterialsPageClient
      courseId={courseId}
      courseTitle={courseTitle}
      isInstructor={isInstructor}
    />
  );
}

interface MaterialsPageClientProps {
  /** Course ID */
  courseId: string;
  /** Course title for page header */
  courseTitle: string;
  /** Whether current user is an instructor */
  isInstructor: boolean;
}

/**
 * MaterialsPageClient Component
 * REQ-FE-330, 332, 333, 334: Material list page with filtering and sorting
 *
 * Features:
 * - Search with 300ms debounce
 * - Filter by tags (multi-select), by status (published/draft, instructor only)
 * - Sort by position, title, date, read time
 * - URL search params persistence
 * - Empty state with role-based CTA
 * - Loading and error states
 */
function MaterialsPageClient({
  courseId,
  courseTitle,
  isInstructor,
}: MaterialsPageClientProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // Local state for search input (before debounce)
  const [searchInput, setSearchInput] = useState(searchParams.get("search") ?? "");

  // Debounced search value
  const debouncedSearch = useDebounce(searchInput, 300);

  // Parse URL params for filters and sort
  const selectedTags = useMemo(() => {
    const tags = searchParams.get("tags");
    return tags ? tags.split(",").filter(Boolean) : [];
  }, [searchParams]);

  const selectedStatus = useMemo(() => {
    const status = searchParams.get("status");
    if (!status) return null;
    return status as MaterialStatus;
  }, [searchParams]);

  const sortKey = useMemo((): MaterialSortKey => {
    const sort = searchParams.get("sort");
    if (sort === "position" || sort === "title" || sort === "createdAt" || sort === "updatedAt" || sort === "readTimeMinutes") {
      return sort;
    }
    return "position";
  }, [searchParams]);

  const sortOrder = useMemo((): SortOrder => {
    const order = searchParams.get("order");
    if (order === "asc" || order === "desc") {
      return order;
    }
    return "asc";
  }, [searchParams]);

  // Update URL params
  const updateParams = useCallback(
    (updates: Record<string, string | null>) => {
      const params = new URLSearchParams(searchParams.toString());

      Object.entries(updates).forEach(([key, value]) => {
        if (value === null || value === "") {
          params.delete(key);
        } else {
          params.set(key, value);
        }
      });

      const url = params.toString() ? `${pathname}?${params.toString()}` : pathname;
      router.push(url as any, { scroll: false });
    },
    [pathname, router, searchParams]
  );

  // Handle search input change
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchInput(value);
  };

  // Update search params when debounced search changes
  // biome-ignore lint/correctness/useExhaustiveDependencies: Only trigger on debounced value change
  useMemo(() => {
    updateParams({ search: debouncedSearch || null });
  }, [debouncedSearch, updateParams]);

  // Handle tag toggle
  const handleTagToggle = (tag: string) => {
    const newTags = selectedTags.includes(tag)
      ? selectedTags.filter((t) => t !== tag)
      : [...selectedTags, tag];
    updateParams({ tags: newTags.length > 0 ? newTags.join(",") : null });
  };

  // Handle status change
  const handleStatusChange = (status: MaterialStatus | "all") => {
    updateParams({ status: status === "all" ? null : status });
  };

  // Handle sort change
  const handleSortChange = (key: MaterialSortKey) => {
    // If same key, toggle order
    if (sortKey === key) {
      updateParams({ order: sortOrder === "asc" ? "desc" : "asc" });
    } else {
      // Default order based on key
      const defaultOrder: SortOrder =
        key === "createdAt" || key === "updatedAt" ? "desc" : "asc";
      updateParams({ sort: key, order: defaultOrder });
    }
  };

  // Clear all filters
  const handleClearFilters = () => {
    setSearchInput("");
    router.push(pathname as any, { scroll: false });
  };

  // Fetch materials
  const { data, isLoading, isError, error, refetch } = useMaterials(courseId, {
    search: debouncedSearch || undefined,
    tags: selectedTags.length > 0 ? selectedTags : undefined,
    status: isInstructor ? selectedStatus ?? undefined : "published",
    sort: sortKey,
    order: sortOrder,
  });

  const materials = data?.data ?? [];

  // Derive allTags from materials data
  const allTags = useMemo(() => {
    const tagSet = new Set<string>();
    materials.forEach((material) => {
      material.tags.forEach((tag: string) => tagSet.add(tag));
    });
    return Array.from(tagSet);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data?.data]);

  const hasFilters =
    debouncedSearch || selectedTags.length > 0 || selectedStatus;

  // Sort label mapping
  const sortLabels: Record<MaterialSortKey, string> = {
    position: "순서",
    title: "제목",
    createdAt: "생성일",
    updatedAt: "수정일",
    readTimeMinutes: "읽기 시간",
  };

  // Error state
  if (isError) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <div className="rounded-full bg-[var(--color-danger-100)] p-4 mb-4">
          <FileText className="h-8 w-8 text-[var(--color-danger-600)]" />
        </div>
        <h2 className="text-xl font-semibold text-[var(--color-foreground)] mb-2">
          자료를 불러오지 못했습니다
        </h2>
        <p className="text-[var(--color-muted-foreground)] mb-4 max-w-md">
          {error.message ||
            "자료를 불러오는 중 오류가 발생했습니다. 다시 시도해 주세요."}
        </p>
        <Button onClick={() => refetch()}>다시 시도</Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[var(--color-foreground)]">
            자료
          </h1>
          <p className="text-sm text-[var(--color-muted-foreground)]">
            {courseTitle}
          </p>
        </div>

        {/* Upload button - instructor only */}
        {isInstructor && (
          <Button asChild>
            <Link href={`/courses/${courseId}/materials/upload`}>
              <Plus className="mr-2 h-4 w-4" />
              자료 업로드
            </Link>
          </Button>
        )}
      </div>

      {/* Search and filter bar */}
      <div className="flex flex-col sm:flex-row gap-3">
        {/* Search input */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--color-muted-foreground)]" />
          <Input
            type="search"
            placeholder="자료 검색..."
            value={searchInput}
            onChange={handleSearchChange}
            className="pl-10 pr-10"
          />
          {searchInput && (
            <button
              type="button"
              onClick={() => {
                setSearchInput("");
                updateParams({ search: null });
              }}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--color-muted-foreground)] hover:text-[var(--color-foreground)]"
              aria-label="검색 지우기"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        {/* Filter and sort controls */}
        <div className="flex gap-2">
          {/* Tag filter */}
          {allTags.length > 0 && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm">
                  <Tag className="mr-2 h-4 w-4" />
                  태그
                  {selectedTags.length > 0 && (
                    <Badge
                      variant="secondary"
                      className="ml-2 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs"
                    >
                      {selectedTags.length}
                    </Badge>
                  )}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuLabel>태그 필터</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {allTags.map((tag) => (
                  <DropdownMenuCheckboxItem
                    key={tag}
                    checked={selectedTags.includes(tag)}
                    onCheckedChange={() => {
                      handleTagToggle(tag);
                    }}
                    onSelect={(e) => {
                      e.preventDefault();
                    }}
                  >
                    {tag}
                  </DropdownMenuCheckboxItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          )}

          {/* Status filter - instructor only */}
          {isInstructor && (
            <Select
              value={selectedStatus ?? "all"}
              onValueChange={(value) => {
                handleStatusChange(value as MaterialStatus | "all");
              }}
            >
              <SelectTrigger className="w-[130px] h-9">
                <SelectValue placeholder="상태" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">전체</SelectItem>
                <SelectItem value="published">게시됨</SelectItem>
                <SelectItem value="draft">초안</SelectItem>
              </SelectContent>
            </Select>
          )}

          {/* Sort */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                <ArrowUpDown className="mr-2 h-4 w-4" />
                {sortLabels[sortKey]}
                <span className="ml-1 text-xs text-[var(--color-muted-foreground)]">
                  ({sortOrder === "asc" ? "A-Z" : "Z-A"})
                </span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>정렬</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {(Object.keys(sortLabels) as MaterialSortKey[]).map((key) => (
                <DropdownMenuCheckboxItem
                  key={key}
                  checked={sortKey === key}
                  onCheckedChange={() => {
                    handleSortChange(key);
                  }}
                  onSelect={(e) => {
                    e.preventDefault();
                  }}
                >
                  {sortLabels[key]}
                  {sortKey === key && (
                    <span className="ml-auto text-xs text-[var(--color-muted-foreground)]">
                      {sortOrder === "asc" ? "↑" : "↓"}
                    </span>
                  )}
                </DropdownMenuCheckboxItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Clear filters */}
          {hasFilters && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleClearFilters}
              className="text-[var(--color-muted-foreground)]"
            >
              <X className="mr-2 h-4 w-4" />
              초기화
            </Button>
          )}
        </div>
      </div>

      {/* Active filters display */}
      {hasFilters && (
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm text-[var(--color-muted-foreground)]">
            필터:
          </span>
          {debouncedSearch && (
            <Badge variant="secondary" className="gap-1">
              검색: {debouncedSearch}
              <button
                type="button"
                onClick={() => {
                  setSearchInput("");
                  updateParams({ search: null });
                }}
                className="ml-1 hover:text-[var(--color-foreground)]"
                aria-label="검색 필터 제거"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          )}
          {selectedTags.map((tag) => (
            <Badge key={tag} variant="secondary" className="gap-1">
              {tag}
              <button
                type="button"
                onClick={() => {
                  handleTagToggle(tag);
                }}
                className="ml-1 hover:text-[var(--color-foreground)]"
                aria-label={`${tag} 필터 제거`}
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          ))}
          {selectedStatus && (
            <Badge variant="secondary" className="gap-1">
              상태: {selectedStatus}
              <button
                type="button"
                onClick={() => {
                  updateParams({ status: null });
                }}
                className="ml-1 hover:text-[var(--color-foreground)]"
                aria-label="상태 필터 제거"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          )}
        </div>
      )}

      {/* Loading state */}
      {isLoading && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <MaterialCardSkeleton key={i} />
          ))}
        </div>
      )}

      {/* Empty state */}
      {!isLoading && materials.length === 0 && (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="rounded-full bg-[var(--color-neutral-100)] dark:bg-[var(--color-neutral-800)] p-4 mb-4">
            <BookOpen className="h-8 w-8 text-[var(--color-muted-foreground)]" />
          </div>

          {hasFilters ? (
            <>
              <h2 className="text-xl font-semibold text-[var(--color-foreground)] mb-2">
                검색 결과가 없습니다
              </h2>
              <p className="text-[var(--color-muted-foreground)] mb-4 max-w-md">
                현재 필터에 일치하는 자료가 없습니다.
                검색어나 필터를 조정해 보세요.
              </p>
              <Button variant="outline" onClick={handleClearFilters}>
                필터 초기화
              </Button>
            </>
          ) : isInstructor ? (
            <>
              <h2 className="text-xl font-semibold text-[var(--color-foreground)] mb-2">
                아직 자료가 없습니다
              </h2>
              <p className="text-[var(--color-muted-foreground)] mb-4 max-w-md">
                첫 번째 자료를 업로드하여 강의 콘텐츠를 만들어 보세요.
              </p>
              <Button asChild>
                <Link href={`/courses/${courseId}/materials/upload`}>
                  <Plus className="mr-2 h-4 w-4" />
                  자료 업로드
                </Link>
              </Button>
            </>
          ) : (
            <>
              <h2 className="text-xl font-semibold text-[var(--color-foreground)] mb-2">
                아직 자료가 없습니다
              </h2>
              <p className="text-[var(--color-muted-foreground)] mb-4 max-w-md">
                강사가 아직 자료를 업로드하지 않았습니다. 나중에 다시 확인해 주세요.
              </p>
            </>
          )}
        </div>
      )}

      {/* Material grid */}
      {!isLoading && materials.length > 0 && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {materials.map((material) => (
            <MaterialCard
              key={material.id}
              material={material}
              courseId={courseId}
              isInstructor={isInstructor}
            />
          ))}
        </div>
      )}

      {/* Results count */}
      {!isLoading && materials.length > 0 && (
        <div className="text-center text-sm text-[var(--color-muted-foreground)]">
          {materials.length}개의 자료
        </div>
      )}
    </div>
  );
}
