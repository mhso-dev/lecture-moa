/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * MemoListItem Component
 * REQ-FE-754: Memo item for personal memo list
 *
 * Features:
 * - Title, content preview (100 chars), tags (up to 3, +N more)
 * - Linked material name
 * - Last modified timestamp
 * - Hover actions: Edit, Delete
 * - Click navigates to /memos/{memoId}
 */

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { formatDistanceToNow } from "date-fns";
import { Edit, Trash2, FileText } from "lucide-react";
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
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "~/components/ui/alert-dialog";
import { cn } from "~/lib/utils";
import { stripMarkdown } from "@shared/utils/markdown";
import type { Memo } from "@shared/types/memo.types";

/**
 * Props for MemoListItem component
 */
interface MemoListItemProps {
  /** Memo data */
  memo: Memo;
  /** Current user ID for permission checks */
  currentUserId: string;
  /** Callback when edit is clicked */
  onEdit?: (memoId: string) => void;
  /** Callback when delete is confirmed */
  onDelete?: (memoId: string) => void;
  /** Additional CSS classes */
  className?: string;
}

/**
 * MemoListItem - Displays memo summary with hover actions
 * REQ-FE-754: Personal memo list item with edit/delete actions
 *
 * Actions:
 * - Edit: visible to author only (hover)
 * - Delete: visible to author only with confirmation (hover)
 *
 * Click on item: navigates to /memos/{memoId}
 *
 * @param props - Component props
 * @returns MemoListItem component
 *
 * @example
 * ```tsx
 * <MemoListItem
 *   memo={memo}
 *   currentUserId={user.id}
 *   onEdit={handleEdit}
 *   onDelete={handleDelete}
 * />
 * ```
 */
export function MemoListItem({
  memo,
  currentUserId,
  onEdit,
  onDelete,
  className,
}: MemoListItemProps) {
  const router = useRouter();
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  const isAuthor = memo.authorId === currentUserId;

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
   * Handle delete action (open confirmation)
   */
  const handleDeleteClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowDeleteDialog(true);
  };

  /**
   * Confirm delete action
   */
  const handleDeleteConfirm = () => {
    onDelete?.(memo.id);
    setShowDeleteDialog(false);
  };

  /**
   * Format relative time
   */
  const formattedTime = formatDistanceToNow(
    typeof memo.updatedAt === "string" ? new Date(memo.updatedAt) : memo.updatedAt,
    { addSuffix: true }
  );

  /**
   * Strip Markdown and truncate content for preview (100 chars)
   * REQ-FE-N704: Display plain text preview, no Markdown symbols
   */
  const contentPreview = stripMarkdown(memo.content, 100);

  /**
   * Format tags for display (up to 3, +N more)
   */
  const displayTags = memo.tags.slice(0, 3);
  const remainingTags = memo.tags.length - 3;

  return (
    <>
      <Card
        className={cn(
          "cursor-pointer transition-all hover:shadow-md",
          className
        )}
        onClick={handleCardClick}
        onMouseEnter={() => { setIsHovered(true); }}
        onMouseLeave={() => { setIsHovered(false); }}
      >
        <CardHeader className="pb-2">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              {/* Title */}
              <CardTitle className="text-base line-clamp-1 mb-2">
                {memo.title}
              </CardTitle>

              {/* Content preview - Markdown stripped (100 chars) */}
              <CardDescription className="line-clamp-2 text-sm">
                {contentPreview}
              </CardDescription>
            </div>

            {/* Hover actions - only for author */}
            {isAuthor && isHovered && (
              <div className="flex gap-1 ml-2" onClick={(e) => { e.stopPropagation(); }}>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={handleEdit}
                  aria-label="메모 수정"
                >
                  <Edit className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-[var(--color-destructive)]"
                  onClick={handleDeleteClick}
                  aria-label="메모 삭제"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            )}
          </div>
        </CardHeader>

        <CardContent className="pt-2">
          {/* Tags, material link, timestamp */}
          <div className="flex items-center justify-between text-xs text-[var(--color-muted-foreground)]">
            <div className="flex items-center gap-2 flex-wrap">
              {/* Tags (up to 3, +N more) */}
              {displayTags.length > 0 && (
                <div className="flex gap-1">
                  {displayTags.map((tag) => (
                    <Badge key={tag} variant="secondary" className="text-xs">
                      {tag}
                    </Badge>
                  ))}
                  {remainingTags > 0 && (
                    <Badge variant="outline" className="text-xs">
                      +{remainingTags}개 더
                    </Badge>
                  )}
                </div>
              )}

              {/* Linked material indicator */}
              {memo.materialId && (
                <div className="flex items-center gap-1">
                  <FileText className="h-3 w-3" />
                  <span>자료 연결됨</span>
                </div>
              )}
            </div>

            {/* Last modified timestamp */}
            <span>{formattedTime}</span>
          </div>
        </CardContent>
      </Card>

      {/* Delete confirmation dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>메모를 삭제하시겠습니까?</AlertDialogTitle>
            <AlertDialogDescription>
              "{memo.title}"을(를) 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>취소</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              className="bg-[var(--color-destructive)] text-[var(--color-destructive-foreground)] hover:bg-[var(--color-destructive)]/90"
            >
              삭제
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

export type { MemoListItemProps };
