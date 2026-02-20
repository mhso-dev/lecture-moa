/**
 * AnswerCard Component
 * TASK-025: Individual answer display with actions
 *
 * Renders a single answer with author info, content, and actions.
 */

"use client";

import { useState } from "react";
import { Card, CardContent } from "~/components/ui/card";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import { Avatar, AvatarImage, AvatarFallback } from "~/components/ui/avatar";
import { MarkdownRenderer } from "~/components/markdown/MarkdownRenderer";
import { useUpvoteAnswer, useAcceptAnswer } from "~/hooks/qa";
import { useAuthStore } from "~/stores/auth.store";
import {
  ThumbsUp,
  Check,
  MoreVertical,
  Trash2,
  Sparkles,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "~/components/ui/dropdown-menu";
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
import type { QAAnswer, UserRole } from "@shared";

interface AnswerCardProps {
  answer: QAAnswer;
  questionId: string;
  questionAuthorId: string;
  questionStatus: "OPEN" | "RESOLVED" | "CLOSED";
  onAccept?: () => void;
  onDelete?: () => void;
  className?: string;
}

/**
 * Role badge styling
 */
const roleBadgeVariant: Record<UserRole, "instructor" | "student"> = {
  instructor: "instructor",
  student: "student",
  admin: "instructor",
};

/**
 * Format relative time
 */
function formatRelativeTime(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMinutes = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMinutes / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMinutes < 60) return `${diffMinutes.toString()}분 전`;
  if (diffHours < 24) return `${diffHours.toString()}시간 전`;
  if (diffDays < 7) return `${diffDays.toString()}일 전`;

  return date.toLocaleDateString("ko-KR", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

/**
 * Get initials from name
 */
function getInitials(name: string): string {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

/**
 * AnswerCard - Individual answer display
 *
 * Features:
 * - AI generated indicator
 * - Accepted answer badge
 * - Author info with role badge
 * - Markdown content
 * - Upvote button
 * - Accept action (question author only)
 * - Delete action (author or instructor)
 */
export function AnswerCard({
  answer,
  questionId,
  questionAuthorId,
  questionStatus,
  onAccept,
  onDelete,
  className,
}: AnswerCardProps) {
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  const { user, role } = useAuthStore();
  const upvoteMutation = useUpvoteAnswer(questionId);
  const acceptMutation = useAcceptAnswer(questionId);

  const isAuthor = user?.id === answer.authorId;
  const isQuestionAuthor = user?.id === questionAuthorId;
  const isInstructor = role === "instructor";
  const canAccept = isQuestionAuthor && !answer.isAccepted && questionStatus === "OPEN";
  const canDelete = isAuthor || isInstructor;
  const canUpvote = user && !isAuthor;

  const handleUpvote = () => {
    if (canUpvote) {
      upvoteMutation.mutate(answer.id);
    }
  };

  const handleAccept = () => {
    if (canAccept) {
      acceptMutation.mutate(answer.id, {
        onSuccess: () => {
          onAccept?.();
        },
      });
    }
  };

  const handleDelete = () => {
    setShowDeleteDialog(true);
  };

  const confirmDelete = () => {
    onDelete?.();
    setShowDeleteDialog(false);
  };

  return (
    <>
      <Card
        className={cn(
          "relative transition-colors",
          answer.isAccepted && "border-success bg-success/5",
          answer.isAiGenerated && "border-purple-200 bg-purple-50/50 dark:border-purple-800 dark:bg-purple-950/20",
          className
        )}
      >
        {/* Accepted badge */}
        {answer.isAccepted && (
          <div className="absolute -top-3 left-4">
            <Badge variant="success" className="gap-1">
              <Check className="h-3 w-3" />
              채택된 답변
            </Badge>
          </div>
        )}

        <CardContent className="pt-6">
          {/* Header: Author info and actions */}
          <div className="flex items-start gap-3 mb-4">
            <Avatar size="sm">
              {answer.author.avatarUrl && (
                <AvatarImage src={answer.author.avatarUrl} alt={answer.author.name} />
              )}
              <AvatarFallback>{getInitials(answer.author.name)}</AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-medium">{answer.author.name}</span>
                <Badge variant={roleBadgeVariant[answer.author.role]} className="text-xs">
                  {answer.author.role === "instructor" ? "강사" : "학생"}
                </Badge>
                {answer.isAiGenerated && (
                  <Badge variant="outline" className="text-xs gap-1 text-purple-600 border-purple-300">
                    <Sparkles className="h-3 w-3" />
                    AI 생성
                  </Badge>
                )}
              </div>
              <span className="text-sm text-muted-foreground">
                {formatRelativeTime(answer.createdAt)}
              </span>
            </div>

            {/* Action menu */}
            {canDelete && !answer.isAiGenerated && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-8 w-8">
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={handleDelete} className="text-destructive">
                    <Trash2 className="h-4 w-4 mr-2" />
                    삭제
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>

          {/* Content */}
          <div className="prose prose-sm max-w-none dark:prose-invert mb-4">
            <MarkdownRenderer content={answer.content} />
          </div>

          {/* Footer: Actions */}
          <div className="flex items-center gap-3 pt-3 border-t">
            {/* Upvote */}
            <Button
              variant={answer.isUpvoted ? "default" : "outline"}
              size="sm"
              onClick={handleUpvote}
              disabled={!canUpvote || upvoteMutation.isPending}
            >
              <ThumbsUp className={cn("h-4 w-4 mr-2", answer.isUpvoted && "fill-current")} />
              {answer.upvoteCount}
            </Button>

            {/* Accept button */}
            {canAccept && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleAccept}
                disabled={acceptMutation.isPending}
                className="text-success border-success hover:bg-success/10"
              >
                <Check className="h-4 w-4 mr-2" />
                채택하기
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Delete confirmation dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>답변 삭제</AlertDialogTitle>
            <AlertDialogDescription>
              정말 이 답변을 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>취소</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-destructive text-destructive-foreground">
              삭제
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
