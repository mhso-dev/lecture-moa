/**
 * QuizCard Component
 * REQ-FE-604: Quiz Card Display
 * REQ-FE-602: Quiz List Data Fetching
 */

import { Card, CardContent } from "~/components/ui/card";
import { Button } from "~/components/ui/button";
import { Badge } from "~/components/ui/badge";
import { Clock, HelpCircle, Calendar, AlertTriangle } from "lucide-react";
import { cn } from "~/lib/utils";
import { formatDistanceToNow, isPast } from "~/lib/date-utils";
import { QuizStatusBadge } from "./quiz-status-badge";
import type { QuizListItem } from "@shared";

interface QuizCardProps {
  quiz: QuizListItem;
  role: "student" | "instructor";
  onAction?: (action: string) => void;
  testId?: string;
}

/**
 * Get due date display text
 */
const getDueDateText = (dueDate: string | null): string | null => {
  if (!dueDate) return null;

  const date = new Date(dueDate);
  const now = new Date();
  const diffMs = date.getTime() - now.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays < 0) {
    return "마감됨";
  } else if (diffDays === 0) {
    return "오늘 마감";
  } else if (diffDays === 1) {
    return "내일 마감";
  } else if (diffDays < 7) {
    return `${String(diffDays)}일 후 마감`;
  } else {
    return `Due ${formatDistanceToNow(date, { addSuffix: false })}`;
  }
};

/**
 * Check if quiz is past due
 */
const isPastDue = (quiz: QuizListItem): boolean => {
  if (!quiz.dueDate) return false;
  return isPast(new Date(quiz.dueDate)) && quiz.myLastAttemptScore === null;
};

/**
 * QuizCard - Displays quiz information in card format
 */
export function QuizCard({
  quiz,
  role,
  onAction,
  testId,
}: QuizCardProps) {
  const pastDue = isPastDue(quiz);
  const dueDateText = getDueDateText(quiz.dueDate);

  const handleAction = (action: string): void => {
    onAction?.(action);
  };

  const renderStudentActions = () => {
    if (quiz.myLastAttemptScore !== null) {
      return (
        <Button
          variant="default"
          size="sm"
          onClick={() => { handleAction("view-results"); }}
          aria-label={`${quiz.title} 결과 보기`}
        >
          결과 보기
        </Button>
      );
    }

    return (
      <Button
        variant="default"
        size="sm"
        onClick={() => { handleAction("take"); }}
        disabled={pastDue}
        aria-label={`${quiz.title} 퀴즈 풀기`}
      >
        퀴즈 풀기
      </Button>
    );
  };

  const renderInstructorActions = () => {
    if (quiz.status === "draft") {
      return (
        <Button
          variant="default"
          size="sm"
          onClick={() => { handleAction("edit"); }}
          aria-label={`${quiz.title} 퀴즈 편집`}
        >
          편집
        </Button>
      );
    }

    return (
      <Button
        variant="default"
        size="sm"
        onClick={() => { handleAction("manage"); }}
        aria-label={`${quiz.title} 퀴즈 관리`}
      >
        관리
      </Button>
    );
  };

  // Generate unique ID for the quiz title for aria-labelledby
  const titleId = `quiz-title-${quiz.id}`;

  return (
    <Card
      data-testid={testId}
      className={cn(
        "h-full overflow-hidden transition-all hover:shadow-md",
        pastDue && "opacity-75"
      )}
      role="article"
      aria-labelledby={titleId}
    >
      <CardContent className="p-4 space-y-3">
        {/* Course name */}
        <p className="text-sm text-[var(--color-muted-foreground)]">
          {quiz.courseName}
        </p>

        {/* Title */}
        <h3 id={titleId} className="font-semibold line-clamp-2">{quiz.title}</h3>

        {/* Stats row */}
        <div className="flex items-center gap-4 text-sm text-[var(--color-muted-foreground)]">
          <span className="flex items-center gap-1">
            <HelpCircle className="h-4 w-4" aria-hidden="true" />
            {quiz.questionCount}문항
          </span>
          {quiz.timeLimitMinutes && (
            <span className="flex items-center gap-1">
              <Clock className="h-4 w-4" aria-hidden="true" />
              {quiz.timeLimitMinutes}분
            </span>
          )}
        </div>

        {/* Due date - only show if not submitted (student) or always for instructor */}
        {dueDateText && !(role === "student" && quiz.myLastAttemptScore !== null) && (
          <div
            className={cn(
              "flex items-center gap-1 text-sm",
              pastDue
                ? "text-[var(--color-error-600)]"
                : "text-[var(--color-muted-foreground)]"
            )}
          >
            {pastDue && <AlertTriangle className="h-4 w-4" aria-hidden="true" />}
            <Calendar className="h-4 w-4" aria-hidden="true" />
            {pastDue && "마감됨"}
            {!pastDue && dueDateText}
          </div>
        )}

        {/* Score/Status row */}
        <div className="flex items-center justify-between">
          {role === "student" ? (
            quiz.myLastAttemptScore !== null ? (
              <Badge variant="success">
                {quiz.myLastAttemptScore}%
              </Badge>
            ) : (
              <Badge variant="secondary">미응시</Badge>
            )
          ) : (
            <>
              <QuizStatusBadge status={quiz.status} />
              <span className="text-sm text-[var(--color-muted-foreground)]">
                {quiz.attemptCount}건 제출
              </span>
            </>
          )}
        </div>

        {/* Action button */}
        {role === "student" ? renderStudentActions() : renderInstructorActions()}
      </CardContent>
    </Card>
  );
}
