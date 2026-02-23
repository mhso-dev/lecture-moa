/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * Memo Card Component
 * REQ-FE-741: Displays memo summary in team memo board
 */

"use client";

import { useRouter } from "next/navigation";
import { formatDistanceToNow } from "date-fns";
import { MoreVertical, Edit, Trash2 } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "~/components/ui/avatar";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "~/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "~/components/ui/dropdown-menu";
import { cn } from "~/lib/utils";
import type { Memo } from "@shared/types/memo.types";
import { stripMarkdown } from "@shared/utils/markdown";

/**
 * Props for MemoCard component
 */
interface MemoCardProps {
  /** Memo data */
  memo: Memo;
  /** Current user ID for permission checks */
  currentUserId: string;
  /** Whether current user is team leader */
  isTeamLeader?: boolean;
  /** Callback when edit is clicked */
  onEdit?: (memoId: string) => void;
  /** Callback when delete is clicked */
  onDelete?: (memoId: string) => void;
  /** Additional CSS classes */
  className?: string;
}

/**
 * MemoCard - Displays memo summary with action menu
 * REQ-FE-741: Shows author, title, preview, tags, timestamp
 *
 * Actions:
 * - Edit: visible to author only
 * - Delete: visible to author or team leader only
 *
 * Click on card: navigates to /memos/{memoId}
 *
 * @param props - Component props
 * @returns MemoCard component
 *
 * @example
 * ```tsx
 * <MemoCard
 *   memo={memo}
 *   currentUserId={user.id}
 *   isTeamLeader={isLeader}
 *   onEdit={handleEdit}
 *   onDelete={handleDelete}
 * />
 * ```
 */
export function MemoCard({
  memo,
  currentUserId,
  isTeamLeader = false,
  onEdit,
  onDelete,
  className,
}: MemoCardProps) {
  const router = useRouter();

  const isAuthor = memo.authorId === currentUserId;
  const canEdit = isAuthor;
  const canDelete = isAuthor || isTeamLeader;

  /**
   * Handle card click - navigate to memo detail
   */
  const handleCardClick = () => {
    router.push(`/memos/${memo.id}` as any);
  };

  /**
   * Handle edit action
   */
  const handleEdit = (e: React.MouseEvent) => {
    e.stopPropagation();
    onEdit?.(memo.id);
  };

  /**
   * Handle delete action
   */
  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    onDelete?.(memo.id);
  };

  /**
   * Get author initials for avatar fallback
   */
  const getAuthorInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  /**
   * Format relative time
   */
  const formattedTime = formatDistanceToNow(
    typeof memo.updatedAt === "string" ? new Date(memo.updatedAt) : memo.updatedAt,
    { addSuffix: true }
  );

  /**
   * Strip Markdown and truncate content for preview
   * REQ-FE-N704: Display plain text preview, no Markdown symbols
   */
  const contentPreview = stripMarkdown(memo.content, 150);

  return (
    <Card
      className={cn(
        "cursor-pointer transition-shadow hover:shadow-md",
        className
      )}
      onClick={handleCardClick}
    >
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          {/* Author info */}
          <div className="flex items-center gap-3">
            <Avatar className="h-10 w-10">
              <AvatarImage
                src={memo.authorAvatarUrl}
                alt={memo.authorName}
              />
              <AvatarFallback>
                {getAuthorInitials(memo.authorName)}
              </AvatarFallback>
            </Avatar>
            <div>
              <p className="text-sm font-medium">{memo.authorName}</p>
              <p className="text-xs text-muted-foreground">{formattedTime}</p>
            </div>
          </div>

          {/* Action menu */}
          {(canEdit || canDelete) && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild onClick={(e) => { e.stopPropagation(); }}>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  aria-label="메모 작업"
                >
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {canEdit && (
                  <DropdownMenuItem onClick={handleEdit}>
                    <Edit className="mr-2 h-4 w-4" />
                    수정
                  </DropdownMenuItem>
                )}
                {canDelete && (
                  <DropdownMenuItem
                    onClick={handleDelete}
                    className="text-destructive"
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    삭제
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-3">
        {/* Memo title */}
        <CardTitle className="text-lg line-clamp-2">{memo.title}</CardTitle>

        {/* Content preview - Markdown stripped */}
        <CardDescription className="line-clamp-3">
          {contentPreview}
        </CardDescription>

        {/* Tags */}
        {memo.tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {memo.tags.slice(0, 3).map((tag) => (
              <Badge key={tag} variant="secondary" className="text-xs">
                {tag}
              </Badge>
            ))}
            {memo.tags.length > 3 && (
              <Badge variant="outline" className="text-xs">
                +{memo.tags.length - 3}
              </Badge>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export type { MemoCardProps };
