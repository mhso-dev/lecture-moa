"use client";

/**
 * SharedMemosFeedWidget Component
 * REQ-FE-233: Shared Memos Feed Widget
 */

import type { Route } from "next";
import Link from "next/link";
import { FileText, ChevronRight, Plus } from "lucide-react";
import { DashboardWidget } from "../DashboardWidget";
import { EmptyState } from "../EmptyState";
import { useSharedMemos, useTeamOverview } from "~/hooks/dashboard/useTeamDashboard";
import { formatDistanceToNow } from "~/lib/date-utils";

/**
 * Maximum number of memos to display in the widget
 */
const MAX_DISPLAYED_MEMOS = 5;

/**
 * Maximum characters for excerpt display
 */
const MAX_EXCERPT_LENGTH = 100;

/**
 * Truncate text to max length with ellipsis
 */
function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength) + "...";
}

/**
 * Props for SharedMemosFeedWidget
 */
interface SharedMemosFeedWidgetProps {
  /** Team ID to fetch shared memos for */
  teamId?: string;
}

/**
 * SharedMemosFeedWidget displays team memos feed.
 *
 * Features:
 * - Memo list: title, author, excerpt (max 100 chars), updated time
 * - Max 5 memos displayed, "View all memos" link
 * - "Create Memo" button
 * - Empty state with "Create the first memo" CTA
 *
 * @example
 * ```tsx
 * <SharedMemosFeedWidget teamId="team-123" />
 * ```
 */
export function SharedMemosFeedWidget({ teamId = "" }: SharedMemosFeedWidgetProps) {
  const { data: overview } = useTeamOverview(teamId);
  const { data: memosData, isLoading, error, refetch } = useSharedMemos({ teamId, page: 1 });

  // Don't render if no team
  if (!overview && !isLoading) {
    return null;
  }

  // Limit to MAX_DISPLAYED_MEMOS
  const memoItems = memosData?.items;
  const displayedMemos = memoItems?.slice(0, MAX_DISPLAYED_MEMOS);
  const hasMore = (memoItems?.length ?? 0) > MAX_DISPLAYED_MEMOS;

  return (
    <DashboardWidget
      title="Shared Memos"
      subtitle="Team collaboration notes"
      headerAction={
        memoItems && memoItems.length > 0 ? (
          <Link
            href={`/teams/${overview?.id ?? ""}/memos` as Route}
            className="text-sm text-primary hover:underline flex items-center gap-1"
          >
            View all memos
            <ChevronRight className="h-4 w-4" />
          </Link>
        ) : undefined
      }
      isLoading={isLoading}
      error={error?.message ?? null}
      onRetry={() => void refetch()}
      testId="shared-memos-widget"
    >
      {displayedMemos && displayedMemos.length > 0 ? (
        <div className="space-y-4">
          {displayedMemos.map((memo) => (
            <Link
              key={memo.id}
              href={`/teams/${overview?.id ?? ""}/memos/${memo.id}` as Route}
              className="block group"
            >
              <div className="space-y-1">
                <h4 className="text-sm font-medium group-hover:text-primary transition-colors truncate">
                  {memo.title}
                </h4>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <span>{memo.authorName}</span>
                  <span>•</span>
                  <span>{formatDistanceToNow(new Date(memo.updatedAt))} ago</span>
                </div>
                <p className="text-xs text-muted-foreground line-clamp-2">
                  {truncateText(memo.excerpt, MAX_EXCERPT_LENGTH)}
                </p>
              </div>
            </Link>
          ))}

          {hasMore && memoItems && (
            <Link
              href={`/teams/${overview?.id ?? ""}/memos` as Route}
              className="block text-sm text-center text-primary hover:underline pt-2"
            >
              View {memoItems.length - MAX_DISPLAYED_MEMOS} more memos
            </Link>
          )}

          {/* Create Memo Button */}
          <Link
            href={`/teams/${overview?.id ?? ""}/memos/new` as Route}
            className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-9 px-4 py-2 w-full mt-2"
          >
            <Plus className="h-4 w-4" />
            Create Memo
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          <EmptyState
            icon={FileText}
            title="No shared memos yet"
            description="Create a memo to share notes with your team."
          />
          <Link
            href={`/teams/${overview?.id ?? ""}/memos/new` as Route}
            className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-9 px-4 py-2 w-full"
          >
            <Plus className="h-4 w-4" />
            Create the first memo
          </Link>
        </div>
      )}
    </DashboardWidget>
  );
}
