/**
 * QAListItem Component
 * TASK-018: List item card for Q&A questions
 *
 * Displays question preview with status, metadata, and context.
 */

"use client";

import Link from "next/link";
import { Card, CardContent } from "~/components/ui/card";
import { Badge } from "~/components/ui/badge";
import { Avatar, AvatarImage, AvatarFallback } from "~/components/ui/avatar";
import { QAStatusBadge } from "./QAStatusBadge";
import { MessageSquare, ThumbsUp, Sparkles } from "lucide-react";
import { cn } from "~/lib/utils";
import type { QAListItem as QAListItemType, UserRole } from "@shared";

interface QAListItemProps {
  question: QAListItemType;
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
  const diffSeconds = Math.floor(diffMs / 1000);
  const diffMinutes = Math.floor(diffSeconds / 60);
  const diffHours = Math.floor(diffMinutes / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffSeconds < 60) return "방금 전";
  if (diffMinutes < 60) return `${diffMinutes}분 전`;
  if (diffHours < 24) return `${diffHours}시간 전`;
  if (diffDays < 7) return `${diffDays}일 전`;

  // Format as date for older items
  return date.toLocaleDateString("ko-KR", {
    month: "short",
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
 * QAListItem - Question list card for Q&A
 *
 * Displays:
 * - Status badge
 * - Question title (truncated 2 lines)
 * - Author avatar + name + role badge
 * - Course/Material label
 * - Context snippet (1 line)
 * - Answer count, upvote count with icons
 * - Relative timestamp
 * - AI suggestion sparkle icon
 *
 * @param question - Question data
 * @param className - Optional additional classes
 */
export function QAListItem({ question, className }: QAListItemProps) {
  const {
    id,
    title,
    author,
    courseName,
    materialTitle,
    context,
    status,
    upvoteCount,
    answerCount,
    hasAiSuggestion,
    createdAt,
  } = question;

  return (
    <Link href={`/qa/${id}`} className="block group">
      <Card
        className={cn(
          "transition-all duration-200 hover:border-primary/50 hover:shadow-md",
          className
        )}
      >
        <CardContent className="p-4">
          <div className="flex items-start gap-4">
            {/* Author avatar */}
            <Avatar size="md" className="shrink-0">
              {author.avatarUrl && <AvatarImage src={author.avatarUrl} alt={author.name} />}
              <AvatarFallback>{getInitials(author.name)}</AvatarFallback>
            </Avatar>

            {/* Content */}
            <div className="flex-1 min-w-0">
              {/* Status + Title */}
              <div className="flex items-start gap-2 mb-2">
                <QAStatusBadge status={status} className="shrink-0 mt-0.5" />
                <h3 className="font-medium line-clamp-2 group-hover:text-primary transition-colors">
                  {title}
                </h3>
              </div>

              {/* Context snippet */}
              {context.selectedText && (
                <p className="text-sm text-muted-foreground line-clamp-1 mb-2 pl-3 border-l-2 border-muted">
                  {context.selectedText}
                </p>
              )}

              {/* Course / Material */}
              <div className="text-xs text-muted-foreground mb-3">
                <span className="font-medium">{courseName}</span>
                <span className="mx-1">/</span>
                <span>{materialTitle}</span>
              </div>

              {/* Meta row */}
              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                {/* Author */}
                <div className="flex items-center gap-2">
                  <span className="font-medium text-foreground">{author.name}</span>
                  <Badge variant={roleBadgeVariant[author.role]} className="text-[10px] px-1.5 py-0">
                    {author.role === "instructor" ? "강사" : "학생"}
                  </Badge>
                </div>

                {/* Time */}
                <span>{formatRelativeTime(createdAt)}</span>

                <div className="flex-1" />

                {/* AI suggestion indicator */}
                {hasAiSuggestion && (
                  <span className="flex items-center gap-1 text-primary">
                    <Sparkles className="h-4 w-4" />
                    <span className="text-xs">AI</span>
                  </span>
                )}

                {/* Answer count */}
                <span className="flex items-center gap-1">
                  <MessageSquare className="h-4 w-4" />
                  {answerCount}
                </span>

                {/* Upvote count */}
                <span className="flex items-center gap-1">
                  <ThumbsUp className="h-4 w-4" />
                  {upvoteCount}
                </span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
