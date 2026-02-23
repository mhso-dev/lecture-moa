/**
 * Team Memo Board Component
 * REQ-FE-740, REQ-FE-744, REQ-FE-745: Main memo board with infinite scroll
 */

/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-floating-promises */
/* eslint-disable @typescript-eslint/restrict-template-expressions */
"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { Plus, FileText } from "lucide-react";
import { Button } from "~/components/ui/button";
import { Skeleton } from "~/components/ui/skeleton";
import { MemoCard } from "~/components/memo/MemoCard";
import { LiveIndicator } from "~/components/team/LiveIndicator";
import { useTeamMemos } from "~/hooks/memo/useMemos";
import { useAuth } from "~/hooks/useAuth";
import type { Memo } from "@shared/types/memo.types";
import type { TeamMemberRole } from "@shared/types/dashboard.types";

/**
 * Props for TeamMemoBoard component
 */
interface TeamMemoBoardProps {
  /** Team ID */
  teamId: string;
  /** Current user's role in the team */
  currentUserRole?: TeamMemberRole;
  /** WebSocket connection status */
  socketStatus: "connected" | "disconnected" | "connecting" | "error";
  /** Callback when edit memo is triggered */
  onEditMemo?: (memoId: string) => void;
  /** Callback when delete memo is triggered */
  onDeleteMemo?: (memoId: string) => void;
  /** Additional CSS classes */
  className?: string;
}

/**
 * Loading skeleton for memo cards
 */
function MemoCardSkeleton() {
  return (
    <div className="space-y-3 rounded-lg border p-4">
      <div className="flex items-center gap-3">
        <Skeleton className="h-10 w-10 rounded-full" />
        <div className="space-y-1">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-3 w-16" />
        </div>
      </div>
      <Skeleton className="h-5 w-3/4" />
      <Skeleton className="h-16 w-full" />
      <div className="flex gap-1.5">
        <Skeleton className="h-5 w-12" />
        <Skeleton className="h-5 w-12" />
      </div>
    </div>
  );
}

/**
 * Empty state component
 * REQ-FE-745: Empty state with illustration and create button
 */
function EmptyState({ onCreateMemo }: { onCreateMemo?: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="mb-4 rounded-full bg-muted p-6">
        <FileText className="h-12 w-12 text-muted-foreground" />
      </div>
      <h3 className="mb-2 text-lg font-semibold">아직 팀 메모가 없습니다</h3>
      <p className="mb-6 max-w-sm text-sm text-muted-foreground">
        팀원들과 인사이트와 노트를 공유하세요.
      </p>
      {onCreateMemo && (
        <Button onClick={onCreateMemo}>
          <Plus className="mr-2 h-4 w-4" />
          첫 번째 메모 작성
        </Button>
      )}
    </div>
  );
}

/**
 * TeamMemoBoard - Main memo board component
 * REQ-FE-740: Displays all memos shared within a team
 * REQ-FE-744: Infinite scroll with Intersection Observer
 * REQ-FE-745: Empty state with create prompt
 *
 * @param props - Component props
 * @returns TeamMemoBoard component
 *
 * @example
 * ```tsx
 * const { status } = useTeamMemoSocket(teamId);
 *
 * <TeamMemoBoard
 *   teamId={teamId}
 *   currentUserRole="member"
 *   socketStatus={status}
 *   onEditMemo={handleEdit}
 *   onDeleteMemo={handleDelete}
 * />
 * ```
 */
export function TeamMemoBoard({
  teamId,
  currentUserRole,
  socketStatus,
  onEditMemo,
  onDeleteMemo,
  className,
}: TeamMemoBoardProps) {
  const router = useRouter();
  const { user } = useAuth();
  const {
    data,
    isLoading,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useTeamMemos(teamId);

  // Intersection Observer for infinite scroll
  const observerTarget = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting && hasNextPage && !isFetchingNextPage) {
          fetchNextPage();
        }
      },
      { threshold: 0.1 }
    );

    if (observerTarget.current) {
      observer.observe(observerTarget.current);
    }

    return () => { observer.disconnect(); };
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  /**
   * Flatten pages to single memo array
   */
  const memos: Memo[] = data?.pages.flatMap((page) => page.data) ?? [];
  const isTeamLeader = currentUserRole === "leader";

  /**
   * Handle create new memo
   */
  const handleCreateMemo = () => {
    // Navigate to memo editor with team context
    router.push(`/memos/new?teamId=${teamId}` as any);
  };

  /**
   * Handle edit memo
   */
  const handleEdit = (memoId: string) => {
    router.push(`/memos/${memoId}/edit` as any);
    onEditMemo?.(memoId);
  };

  /**
   * Handle delete memo
   */
  const handleDelete = (memoId: string) => {
    onDeleteMemo?.(memoId);
  };

  // Loading state
  if (isLoading) {
    return (
      <div className={className}>
        <div className="mb-4 flex items-center justify-between">
          <Skeleton className="h-6 w-32" />
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <MemoCardSkeleton key={i} />
          ))}
        </div>
      </div>
    );
  }

  // Empty state
  if (memos.length === 0) {
    return (
      <div className={className}>
        <div className="mb-4 flex items-center gap-2">
          <h2 className="text-xl font-semibold">팀 메모</h2>
          <LiveIndicator status={socketStatus} />
        </div>
        <EmptyState onCreateMemo={handleCreateMemo} />
      </div>
    );
  }

  return (
    <div className={className}>
      {/* Header with Live Indicator */}
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h2 className="text-xl font-semibold">팀 메모</h2>
          <LiveIndicator status={socketStatus} />
        </div>
        <Button onClick={handleCreateMemo}>
          <Plus className="mr-2 h-4 w-4" />
          새 팀 메모
        </Button>
      </div>

      {/* Memo Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {memos.map((memo) => (
          <MemoCard
            key={memo.id}
            memo={memo}
            currentUserId={user?.id ?? ""}
            isTeamLeader={isTeamLeader}
            onEdit={handleEdit}
            onDelete={handleDelete}
          />
        ))}

        {/* Loading skeletons for next page */}
        {isFetchingNextPage &&
          Array.from({ length: 3 }).map((_, i) => (
            <MemoCardSkeleton key={`loading-${i}`} />
          ))}
      </div>

      {/* Infinite scroll trigger */}
      <div ref={observerTarget} className="h-8" />

      {/* Load more indicator */}
      {hasNextPage && !isFetchingNextPage && (
        <div className="flex justify-center py-4">
          <Button
            variant="ghost"
            onClick={() => fetchNextPage()}
            disabled={isFetchingNextPage}
          >
            더 보기
          </Button>
        </div>
      )}
    </div>
  );
}

export type { TeamMemoBoardProps };
