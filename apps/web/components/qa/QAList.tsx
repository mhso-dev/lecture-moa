/**
 * QAList Component
 * Client component for rendering Q&A list with infinite scroll
 */

"use client";

import { useEffect, useRef } from "react";
import { useQAList, type QAListResponse } from "~/hooks/qa";
import { QAListItem } from "./QAListItem";
import { QAListSkeleton } from "./QAListSkeleton";
import { Button } from "~/components/ui/button";
import { useSearchParams } from "next/navigation";
import type { QAListFilter, QAListItem as QAListItemType } from "@shared";

/**
 * QAList - Renders Q&A list with infinite scroll
 *
 * Features:
 * - Infinite scroll pagination
 * - Loading skeleton
 * - Empty state
 * - Error state
 */
export function QAList() {
  const searchParams = useSearchParams();

  // Build filter from URL params
  const filter: QAListFilter = {
    courseId: searchParams.get("courseId") ?? undefined,
    materialId: searchParams.get("materialId") ?? undefined,
    status: (searchParams.get("status") as QAListFilter["status"]) ?? "ALL",
    q: searchParams.get("q") ?? undefined,
    sort: (searchParams.get("sort") as QAListFilter["sort"]) ?? "newest",
    page: 1,
    limit: 20,
  };

  const {
    data,
    isLoading,
    isError,
    error,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useQAList(filter);

  // Intersection observer for infinite scroll
  const observerRef = useRef<IntersectionObserver | null>(null);
  const loadMoreRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!hasNextPage || isFetchingNextPage) return;

    observerRef.current = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          void fetchNextPage();
        }
      },
      { threshold: 0.1 }
    );

    if (loadMoreRef.current) {
      observerRef.current.observe(loadMoreRef.current);
    }

    return () => {
      observerRef.current?.disconnect();
    };
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  // Loading state
  if (isLoading) {
    return <QAListSkeleton count={5} />;
  }

  // Error state
  if (isError) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground mb-4">
          Q&A 목록을 불러오는 중 오류가 발생했습니다.
        </p>
        <p className="text-sm text-destructive">{error.message}</p>
      </div>
    );
  }

  // Flatten pages into single array
  const pages = (data as { pages: QAListResponse[] } | undefined)?.pages ?? [];
  const questions: QAListItemType[] = pages.flatMap((page) => page.data);

  // Empty state
  if (questions.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="mx-auto w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
          <span className="text-2xl">?</span>
        </div>
        <h3 className="font-medium mb-2">아직 질문이 없습니다</h3>
        <p className="text-muted-foreground mb-4">
          첫 번째 질문을 작성해보세요!
        </p>
        <Button asChild>
          <a href="/qa/new">질문하기</a>
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Question count */}
      <div className="text-sm text-muted-foreground">
        총 {pages[0]?.pagination.total ?? questions.length}개의 질문
      </div>

      {/* Question list */}
      {questions.map((question: QAListItemType) => (
        <QAListItem key={question.id} question={question} />
      ))}

      {/* Load more trigger */}
      <div ref={loadMoreRef} className="py-4">
        {isFetchingNextPage && <QAListSkeleton count={3} />}
        {hasNextPage && !isFetchingNextPage && (
          <div className="text-center">
            <Button variant="outline" onClick={() => fetchNextPage()}>
              더 보기
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
