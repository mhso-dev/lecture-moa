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
    return "Past due";
  } else if (diffDays === 0) {
    return "Due today";
  } else if (diffDays === 1) {
    return "Due in 1 day";
  } else if (diffDays < 7) {
    return `Due in ${String(diffDays)} days`;
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
          aria-label={`View results for ${quiz.title}`}
        >
          View Results
        </Button>
      );
    }

    return (
      <Button
        variant="default"
        size="sm"
        onClick={() => { handleAction("take"); }}
        disabled={pastDue}
        aria-label={`Take quiz ${quiz.title}`}
      >
        Take Quiz
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
          aria-label={`Edit quiz ${quiz.title}`}
        >
          Edit
        </Button>
      );
    }

    return (
      <Button
        variant="default"
        size="sm"
        onClick={() => { handleAction("manage"); }}
        aria-label={`Manage quiz ${quiz.title}`}
      >
        Manage
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
            {quiz.questionCount} questions
          </span>
          {quiz.timeLimitMinutes && (
            <span className="flex items-center gap-1">
              <Clock className="h-4 w-4" aria-hidden="true" />
              {quiz.timeLimitMinutes} min
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
            {pastDue && "Past due"}
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
              <Badge variant="secondary">Not attempted</Badge>
            )
          ) : (
            <>
              <QuizStatusBadge status={quiz.status} />
              <span className="text-sm text-[var(--color-muted-foreground)]">
                {quiz.attemptCount} submissions
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
