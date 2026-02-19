/**
 * AnswerThread Component
 * TASK-026: Answer list container with sorting
 *
 * Renders the list of answers with sorting options.
 */

"use client";

import { useState } from "react";
import { AnswerCard } from "./AnswerCard";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";
import { MessageSquare, ArrowUpDown } from "lucide-react";
import { cn } from "~/lib/utils";
import type { QAAnswer, QAQuestion } from "@shared";

type SortOption = "newest" | "oldest" | "upvotes" | "accepted";

interface AnswerThreadProps {
  question: QAQuestion;
  answers: QAAnswer[];
  onAnswerAccept?: () => void;
  onAnswerDelete?: (answerId: string) => void;
  className?: string;
}

/**
 * Sort answers based on selected option
 */
function sortAnswers(answers: QAAnswer[], sort: SortOption): QAAnswer[] {
  const sorted = [...answers];

  switch (sort) {
    case "newest":
      return sorted.sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
    case "oldest":
      return sorted.sort(
        (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
      );
    case "upvotes":
      return sorted.sort((a, b) => b.upvoteCount - a.upvoteCount);
    case "accepted":
      // Accepted first, then by upvotes
      return sorted.sort((a, b) => {
        if (a.isAccepted && !b.isAccepted) return -1;
        if (!a.isAccepted && b.isAccepted) return 1;
        return b.upvoteCount - a.upvoteCount;
      });
    default:
      return sorted;
  }
}

/**
 * AnswerThread - Answer list container
 *
 * Features:
 * - Sort options (newest, oldest, upvotes, accepted)
 * - Answer count display
 * - Empty state
 * - Accepted answer highlight
 */
export function AnswerThread({
  question,
  answers,
  onAnswerAccept,
  onAnswerDelete,
  className,
}: AnswerThreadProps) {
  const [sortBy, setSortBy] = useState<SortOption>("accepted");

  const sortedAnswers = sortAnswers(answers, sortBy);
  const acceptedCount = answers.filter((a) => a.isAccepted).length;

  return (
    <div className={cn("space-y-4", className)}>
      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <MessageSquare className="h-5 w-5 text-muted-foreground" />
          <h2 className="text-lg font-semibold">
            답변 {answers.length}개
          </h2>
          {acceptedCount > 0 && (
            <span className="text-sm text-success">
              ({acceptedCount}개 채택됨)
            </span>
          )}
        </div>

        {/* Sort dropdown */}
        <Select
          value={sortBy}
          onValueChange={(value) => setSortBy(value as SortOption)}
        >
          <SelectTrigger className="w-[160px]">
            <ArrowUpDown className="h-4 w-4 mr-2" />
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="accepted">채택 우선</SelectItem>
            <SelectItem value="newest">최신순</SelectItem>
            <SelectItem value="oldest">오래된순</SelectItem>
            <SelectItem value="upvotes">추천순</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Answer list */}
      {sortedAnswers.length === 0 ? (
        <div className="text-center py-8 border rounded-lg bg-muted/30">
          <MessageSquare className="h-10 w-10 mx-auto text-muted-foreground mb-3" />
          <p className="text-muted-foreground mb-1">아직 답변이 없습니다</p>
          <p className="text-sm text-muted-foreground">
            첫 번째 답변을 작성해보세요!
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {sortedAnswers.map((answer) => (
            <AnswerCard
              key={answer.id}
              answer={answer}
              questionId={question.id}
              questionAuthorId={question.authorId}
              questionStatus={question.status}
              onAccept={onAnswerAccept}
              onDelete={() => onAnswerDelete?.(answer.id)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
