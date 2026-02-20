/**
 * QuestionNavigator Component
 * REQ-FE-613: Question Navigator
 *
 * Grid of question buttons with answered/unanswered/current states
 */

"use client";

import * as React from "react";
import { Button } from "~/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "~/components/ui/sheet";
import { useMediaQuery } from "~/hooks/useMediaQuery";
import { cn } from "~/lib/utils";
import type { Question, DraftAnswer } from "@shared";

// ============================================================================
// Types
// ============================================================================

export interface QuestionNavigatorProps {
  /** Array of quiz questions */
  questions: Question[];
  /** Map of answers keyed by questionId */
  answers: Record<string, DraftAnswer>;
  /** Index of currently displayed question */
  currentIndex: number;
  /** Callback when navigating to a question */
  onNavigate: (index: number) => void;
  /** Custom className */
  className?: string;
  /** Test ID for testing */
  testId?: string;
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Check if a question has been answered
 */
function isAnswered(questionId: string, answers: Record<string, DraftAnswer>): boolean {
  const answer = answers[questionId];
  if (!answer) return false;

  switch (answer.type) {
    case "multiple_choice":
      return answer.selectedOptionId !== null;
    case "true_false":
      return answer.selectedAnswer !== null;
    case "short_answer":
      return answer.text.length > 0;
    case "fill_in_the_blank":
      return Object.keys(answer.filledAnswers).length > 0;
    default:
      return false;
  }
}

/**
 * Generate aria-label for question button
 */
function getAriaLabel(
  index: number,
  answered: boolean,
  current: boolean
): string {
  const status = answered ? "answered" : "unanswered";
  const currentLabel = current ? ", current" : "";
  return `Question ${String(index + 1)}, ${status}${currentLabel}`;
}

// ============================================================================
// Question Button Grid
// ============================================================================

interface QuestionGridProps {
  questions: Question[];
  answers: Record<string, DraftAnswer>;
  currentIndex: number;
  onNavigate: (index: number) => void;
}

function QuestionGrid({
  questions,
  answers,
  currentIndex,
  onNavigate,
}: QuestionGridProps): React.JSX.Element {
  return (
    <div className="grid grid-cols-5 gap-2">
      {questions.map((question, index) => {
        const answered = isAnswered(question.id, answers);
        const current = index === currentIndex;

        return (
          <Button
            key={question.id}
            variant={answered ? "default" : "outline"}
            size="sm"
            onClick={() => { onNavigate(index); }}
            aria-label={getAriaLabel(index, answered, current)}
            className={cn(
              "h-10 w-10 p-0 font-medium",
              current && "ring-2 ring-primary ring-offset-2"
            )}
          >
            {index + 1}
          </Button>
        );
      })}
    </div>
  );
}

// ============================================================================
// Desktop Sidebar
// ============================================================================

interface DesktopNavigatorProps extends QuestionGridProps {
  className?: string;
}

function DesktopNavigator({
  questions,
  answers,
  currentIndex,
  onNavigate,
  className,
}: DesktopNavigatorProps): React.JSX.Element {
  return (
    <aside className={cn("w-60 flex-shrink-0", className)}>
      <div className="sticky top-4 space-y-4">
        <h3 className="font-semibold text-lg">Questions</h3>
        <QuestionGrid
          questions={questions}
          answers={answers}
          currentIndex={currentIndex}
          onNavigate={onNavigate}
        />
      </div>
    </aside>
  );
}

// ============================================================================
// Mobile Bottom Sheet
// ============================================================================

interface MobileNavigatorProps extends QuestionGridProps {
  className?: string;
}

function MobileNavigator({
  questions,
  answers,
  currentIndex,
  onNavigate,
  className,
}: MobileNavigatorProps): React.JSX.Element {
  const [open, setOpen] = React.useState(false);

  const handleNavigate = (index: number) => {
    onNavigate(index);
    setOpen(false);
  };

  const answeredCount = questions.filter((q) => isAnswered(q.id, answers)).length;

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="outline" className="w-full">
          {answeredCount}/{questions.length} Questions
        </Button>
      </SheetTrigger>
      <SheetContent side="bottom" className={className}>
        <SheetHeader>
          <SheetTitle>Questions ({answeredCount}/{questions.length} answered)</SheetTitle>
        </SheetHeader>
        <div className="mt-4">
          <QuestionGrid
            questions={questions}
            answers={answers}
            currentIndex={currentIndex}
            onNavigate={handleNavigate}
          />
        </div>
      </SheetContent>
    </Sheet>
  );
}

// ============================================================================
// Main Component
// ============================================================================

/**
 * Question Navigator Component
 *
 * Displays all question numbers as a grid of buttons:
 * - Desktop: Fixed sidebar (240px width)
 * - Mobile: Bottom Sheet
 *
 * Button states:
 * - Answered: filled accent color
 * - Unanswered: outline style
 * - Current: highlighted border
 *
 * @param props - Component props
 * @returns Question navigator component
 *
 * @example
 * ```tsx
 * <QuestionNavigator
 *   questions={questions}
 *   answers={answers}
 *   currentIndex={0}
 *   onNavigate={handleNavigate}
 * />
 * ```
 */
export function QuestionNavigator({
  questions,
  answers,
  currentIndex,
  onNavigate,
  className,
  testId,
}: QuestionNavigatorProps): React.JSX.Element | null {
  const { isMobile } = useMediaQuery();

  // Don't render if no questions
  if (questions.length === 0) {
    return null;
  }

  return (
    <div data-testid={testId}>
      {isMobile ? (
        <MobileNavigator
          questions={questions}
          answers={answers}
          currentIndex={currentIndex}
          onNavigate={onNavigate}
          className={className}
        />
      ) : (
        <DesktopNavigator
          questions={questions}
          answers={answers}
          currentIndex={currentIndex}
          onNavigate={onNavigate}
          className={className}
        />
      )}
    </div>
  );
}
