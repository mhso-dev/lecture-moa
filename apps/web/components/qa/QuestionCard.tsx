/**
 * QuestionCard Component
 * TASK-023: Full question display on detail page
 *
 * Renders complete question with context, content, and actions.
 */

"use client";

import { useState } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader } from "~/components/ui/card";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import { Avatar, AvatarImage, AvatarFallback } from "~/components/ui/avatar";
import { QAStatusBadge } from "./QAStatusBadge";
import { QuestionEditForm } from "./QuestionEditForm";
import { MarkdownRenderer } from "~/components/markdown/MarkdownRenderer";
import { useUpvoteQuestion } from "~/hooks/qa";
import { useAuthStore } from "~/stores/auth.store";
import {
  ThumbsUp,
  MessageSquare,
  MoreVertical,
  Pencil,
  Trash2,
  ExternalLink,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
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
import type { QAQuestion, UserRole } from "@shared";

interface QuestionCardProps {
  question: QAQuestion;
  className?: string;
  onStatusChange?: (status: "OPEN" | "RESOLVED" | "CLOSED") => void;
  onDelete?: () => void;
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
 * QuestionCard - Full question display for detail page
 *
 * Features:
 * - Status badge
 * - Question title
 * - Context block with material link
 * - Markdown content
 * - Author info
 * - Upvote button
 * - Action menu (edit, delete)
 */
export function QuestionCard({
  question,
  className,
  onStatusChange,
  onDelete,
}: QuestionCardProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  const { user, role } = useAuthStore();
  const upvoteMutation = useUpvoteQuestion(question.id);

  const isAuthor = user?.id === question.authorId;
  const isInstructor = role === "instructor";
  const canEdit = isAuthor;
  const canDelete = isAuthor || isInstructor;
  const canUpvote = user && !isAuthor;

  const handleUpvote = () => {
    if (canUpvote) {
      upvoteMutation.mutate();
    }
  };

  const handleEdit = () => {
    setIsEditing(true);
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
  };

  const handleSaveEdit = () => {
    setIsEditing(false);
    // The mutation will invalidate the query and refetch
  };

  const handleDelete = () => {
    setShowDeleteDialog(true);
  };

  const confirmDelete = () => {
    onDelete?.();
    setShowDeleteDialog(false);
  };

  // Editing mode
  if (isEditing) {
    return (
      <QuestionEditForm
        question={question}
        onSave={handleSaveEdit}
        onCancel={handleCancelEdit}
        className={className}
      />
    );
  }

  return (
    <>
      <Card className={cn("relative", className)}>
        <CardHeader className="pb-4">
          {/* Status badge - top right */}
          <div className="absolute top-4 right-4">
            <QAStatusBadge status={question.status} />
          </div>

          {/* Title */}
          <h1 className="text-2xl font-bold pr-24">{question.title}</h1>

          {/* Author info */}
          <div className="flex items-center gap-3 mt-4">
            <Avatar size="md">
              {question.author.avatarUrl && (
                <AvatarImage src={question.author.avatarUrl} alt={question.author.name} />
              )}
              <AvatarFallback>{getInitials(question.author.name)}</AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <span className="font-medium">{question.author.name}</span>
                <Badge variant={roleBadgeVariant[question.author.role]} className="text-xs">
                  {question.author.role === "instructor" ? "강사" : "학생"}
                </Badge>
              </div>
              <span className="text-sm text-muted-foreground">
                {formatRelativeTime(question.createdAt)}에 질문
              </span>
            </div>

            {/* Action menu */}
            {(canEdit || canDelete) && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon">
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  {canEdit && (
                    <DropdownMenuItem onClick={handleEdit}>
                      <Pencil className="h-4 w-4 mr-2" />
                      수정
                    </DropdownMenuItem>
                  )}
                  {canEdit && canDelete && <DropdownMenuSeparator />}
                  {canDelete && (
                    <DropdownMenuItem onClick={handleDelete} className="text-destructive">
                      <Trash2 className="h-4 w-4 mr-2" />
                      삭제
                    </DropdownMenuItem>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Context block */}
          <div className="bg-muted/50 rounded-lg p-4 border-l-4 border-primary">
            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
              <span className="font-medium">{question.materialTitle}</span>
              {question.context.headingId && (
                <>
                  <span>/</span>
                  <Link
                    href={`/courses/${question.courseId}/materials/${question.materialId}#${question.context.headingId}`}
                    className="hover:underline flex items-center gap-1"
                  >
                    관련 섹션
                    <ExternalLink className="h-3 w-3" />
                  </Link>
                </>
              )}
            </div>
            <blockquote className="text-sm italic">
              "{question.context.selectedText}"
            </blockquote>
          </div>

          {/* Question content */}
          <div className="prose prose-sm max-w-none dark:prose-invert">
            <MarkdownRenderer content={question.content} />
          </div>

          {/* Actions */}
          <div className="flex items-center gap-4 pt-4 border-t">
            {/* Upvote */}
            <Button
              variant={question.isUpvoted ? "default" : "outline"}
              size="sm"
              onClick={handleUpvote}
              disabled={!canUpvote || upvoteMutation.isPending}
            >
              <ThumbsUp className={cn("h-4 w-4 mr-2", question.isUpvoted && "fill-current")} />
              {question.upvoteCount}
            </Button>

            {/* Answer count */}
            <div className="flex items-center text-muted-foreground">
              <MessageSquare className="h-4 w-4 mr-2" />
              <span>{question.answerCount}개의 답변</span>
            </div>

            <div className="flex-1" />

            {/* Status change (instructor only) */}
            {isInstructor && onStatusChange && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm">
                    상태 변경
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  <DropdownMenuItem onClick={() => { onStatusChange("OPEN"); }}>
                    진행 중
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => { onStatusChange("RESOLVED"); }}>
                    해결됨
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => { onStatusChange("CLOSED"); }}>
                    종료
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Delete confirmation dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>질문 삭제</AlertDialogTitle>
            <AlertDialogDescription>
              정말 이 질문을 삭제하시겠습니까? 모든 답변도 함께 삭제되며, 이 작업은 되돌릴 수
              없습니다.
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
