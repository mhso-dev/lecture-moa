/**
 * QuizTakingShell Component
 * REQ-FE-610 to REQ-FE-619: Quiz Taking Interface
 *
 * Main container for quiz-taking experience
 */

"use client";

import * as React from "react";
import { Button } from "~/components/ui/button";
import { useQuizTakingStore } from "~/stores/quiz-taking.store";
import { useQuizTimer } from "~/hooks/quiz/useQuizTimer";
import { useQuizAutoSave } from "~/hooks/quiz/useQuizAutoSave";
import { useQuizSubmission } from "~/hooks/quiz/useQuizSubmission";
import { useFocusDetection } from "~/hooks/quiz/useFocusDetection";
import { cn } from "~/lib/utils";

import { QuestionDisplay } from "./question-display";
import { QuestionNavigator } from "./question-navigator";
import { QuizTimer } from "./quiz-timer";
import { QuizProgressBar } from "./quiz-progress-bar";
import { QuizSubmitDialog } from "./quiz-submit-dialog";
import { FocusWarningDialog } from "./focus-warning-dialog";

import type { QuizDetail, QuizAttempt, DraftAnswer } from "@shared";

// ============================================================================
// Types
// ============================================================================

export interface QuizTakingShellProps {
  /** Quiz data */
  quiz: QuizDetail;
  /** Current attempt data */
  attempt: QuizAttempt;
  /** Callback when quiz is submitted */
  onSubmit?: () => void;
  /** Callback when timer expires */
  onTimerExpire?: () => void;
  /** Custom className */
  className?: string;
  /** Test ID for testing */
  testId?: string;
  /** Children to render (optional) */
  children?: React.ReactNode;
}

// ============================================================================
// Keyboard Shortcuts Hook
// ============================================================================

interface UseKeyboardShortcutsOptions {
  currentIndex: number;
  totalQuestions: number;
  currentQuestion: { id: string; type: string } | null;
  onNavigate: (index: number) => void;
  onAnswer: (answer: DraftAnswer) => void;
  onCloseDialog: () => void;
  enabled: boolean;
}

function useKeyboardShortcuts({
  currentIndex,
  totalQuestions,
  currentQuestion,
  onNavigate,
  onAnswer,
  onCloseDialog,
  enabled,
}: UseKeyboardShortcutsOptions): void {
  React.useEffect(() => {
    if (!enabled) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if typing in input/textarea
      const target = e.target as HTMLElement;
      if (
        target.tagName === "INPUT" ||
        target.tagName === "TEXTAREA" ||
        target.isContentEditable
      ) {
        return;
      }

      switch (e.key) {
        case "ArrowLeft":
          e.preventDefault();
          if (currentIndex > 0) {
            onNavigate(currentIndex - 1);
          }
          break;

        case "ArrowRight":
          e.preventDefault();
          if (currentIndex < totalQuestions - 1) {
            onNavigate(currentIndex + 1);
          }
          break;

        case "Escape":
          e.preventDefault();
          onCloseDialog();
          break;

        // Number keys 1-9 for MCQ options
        case "1":
        case "2":
        case "3":
        case "4":
        case "5":
        case "6":
        case "7":
        case "8":
        case "9":
          if (currentQuestion?.type === "multiple_choice") {
            e.preventDefault();
            // This would need access to options - handled by AnswerInput instead
          }
          break;

        // T for True
        case "t":
        case "T":
          if (currentQuestion?.type === "true_false") {
            e.preventDefault();
            onAnswer({
              questionId: currentQuestion.id,
              type: "true_false",
              selectedAnswer: true,
            });
          }
          break;

        // F for False
        case "f":
        case "F":
          if (currentQuestion?.type === "true_false") {
            e.preventDefault();
            onAnswer({
              questionId: currentQuestion.id,
              type: "true_false",
              selectedAnswer: false,
            });
          }
          break;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => { window.removeEventListener("keydown", handleKeyDown); };
  }, [
    enabled,
    currentIndex,
    totalQuestions,
    currentQuestion,
    onNavigate,
    onAnswer,
    onCloseDialog,
  ]);
}

// ============================================================================
// Component
// ============================================================================

/**
 * Quiz Taking Shell Component
 *
 * Main container for the quiz-taking experience:
 * - Header with title, timer, progress
 * - Question display area
 * - Navigation sidebar/bottom sheet
 * - Submit dialog
 * - Focus warning dialog
 * - Keyboard shortcuts (REQ-FE-619)
 *
 * @param props - Component props
 * @returns Quiz taking shell component
 *
 * @example
 * ```tsx
 * <QuizTakingShell
 *   quiz={quizData}
 *   attempt={attemptData}
 *   onSubmit={handleSubmit}
 * />
 * ```
 */
export function QuizTakingShell({
  quiz,
  attempt,
  onSubmit,
  onTimerExpire,
  className,
  testId,
  children,
}: QuizTakingShellProps): React.JSX.Element {
  // Get state and actions from store
  const questions = useQuizTakingStore((state) => state.questions);
  const currentQuestionIndex = useQuizTakingStore((state) => state.currentQuestionIndex);
  const answers = useQuizTakingStore((state) => state.answers);
  const remainingSeconds = useQuizTakingStore((state) => state.remainingSeconds);
  const timerStatus = useQuizTakingStore((state) => state.timerStatus);
  const focusLossCount = useQuizTakingStore((state) => state.focusLossCount);
  const isDirty = useQuizTakingStore((state) => state.isDirty);
  const setAnswer = useQuizTakingStore((state) => state.setAnswer);
  const navigateToQuestion = useQuizTakingStore((state) => state.navigateToQuestion);
  const reset = useQuizTakingStore((state) => state.reset);

  // Use quiz questions if store is empty (initial render)
  const displayQuestions = questions.length > 0 ? questions : quiz.questions;
  const currentQuestion = displayQuestions[currentQuestionIndex] ?? null;

  // Auto-save hook
  const { isSaving } = useQuizAutoSave({
    quizId: quiz.id,
    attemptId: attempt.id,
    isDirty,
    answers,
    focusLossCount,
    enabled: attempt.status === "in_progress",
  });

  // Submission hook
  const {
    isSubmitting,
    showConfirmDialog,
    openConfirmDialog,
    closeConfirmDialog,
    confirmSubmit,
  } = useQuizSubmission({
    quizId: quiz.id,
    attemptId: attempt.id,
    answers,
    totalQuestions: displayQuestions.length,
  });

  // Focus detection hook
  const { isWarningOpen, closeWarning } = useFocusDetection({
    enabled: quiz.focusLossWarning,
  });

  // Timer expiration handler
  const handleTimerExpire = React.useCallback(() => {
    // Auto-submit when timer expires
    void confirmSubmit();
    onTimerExpire?.();
  }, [confirmSubmit, onTimerExpire]);

  // Timer hook
  useQuizTimer({
    onExpire: handleTimerExpire,
  });

  // Calculate answered count
  const answeredCount = Object.values(answers).filter((a) => {
    switch (a.type) {
      case "multiple_choice":
        return a.selectedOptionId !== null;
      case "true_false":
        return a.selectedAnswer !== null;
      case "short_answer":
        return a.text.length > 0;
      case "fill_in_the_blank":
        return Object.values(a.filledAnswers).some((v) => v.length > 0);
      default:
        return false;
    }
  }).length;

  // Handle answer change
  const handleAnswerChange = React.useCallback(
    (answer: DraftAnswer) => {
      setAnswer(answer.questionId, answer);
    },
    [setAnswer]
  );

  // Handle navigation
  const handleNavigate = React.useCallback(
    (index: number) => {
      navigateToQuestion(index);
    },
    [navigateToQuestion]
  );

  // Handle submit confirmation
  const handleSubmitConfirm = React.useCallback(async () => {
    const result = await confirmSubmit();
    if (result) {
      onSubmit?.();
    }
  }, [confirmSubmit, onSubmit]);

  // Close all dialogs
  const handleCloseDialog = React.useCallback(() => {
    closeConfirmDialog();
    closeWarning();
  }, [closeConfirmDialog, closeWarning]);

  // Keyboard shortcuts
  useKeyboardShortcuts({
    currentIndex: currentQuestionIndex,
    totalQuestions: displayQuestions.length,
    currentQuestion,
    onNavigate: handleNavigate,
    onAnswer: handleAnswerChange,
    onCloseDialog: handleCloseDialog,
    enabled: true,
  });

  // Cleanup on unmount
  React.useEffect(() => {
    return () => {
      // Reset store when leaving quiz
      reset();
    };
  }, [reset]);

  return (
    <div
      className={cn(
        "min-h-screen flex flex-col lg:flex-row",
        className
      )}
      data-testid={testId}
    >
      {/* Main content area */}
      <main className="flex-1 p-4 lg:p-6" role="main">
        {/* Header */}
        <header className="mb-6 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold">{quiz.title}</h1>
              <p className="text-muted-foreground">{quiz.courseName}</p>
            </div>
            <div className="flex items-center gap-4">
              {/* Timer */}
              {quiz.timeLimitMinutes !== null && (
                <QuizTimer
                  remainingSeconds={remainingSeconds}
                  status={timerStatus}
                  onExpire={handleTimerExpire}
                />
              )}
              {/* Save indicator */}
              {isSaving && (
                <span className="text-sm text-muted-foreground">저장 중...</span>
              )}
            </div>
          </div>

          {/* Progress bar */}
          <QuizProgressBar answered={answeredCount} total={displayQuestions.length} />
        </header>

        {/* Question display */}
        {currentQuestion && (
          <QuestionDisplay
            question={currentQuestion}
            questionNumber={currentQuestionIndex + 1}
            totalQuestions={displayQuestions.length}
            answer={answers[currentQuestion.id]}
            onChange={handleAnswerChange}
            className="mb-6"
          />
        )}

        {/* Navigation buttons */}
        <div className="flex items-center justify-between">
          <Button
            variant="outline"
            onClick={() => { handleNavigate(currentQuestionIndex - 1); }}
            disabled={currentQuestionIndex === 0}
          >
            이전
          </Button>
          <div className="flex gap-2">
            {currentQuestionIndex < displayQuestions.length - 1 ? (
              <Button onClick={() => { handleNavigate(currentQuestionIndex + 1); }}>
                다음
              </Button>
            ) : (
              <Button onClick={() => { openConfirmDialog(); }} variant="default">
                퀴즈 제출
              </Button>
            )}
          </div>
        </div>

        {children}
      </main>

      {/* Desktop navigator sidebar */}
      <nav className="hidden lg:block" role="navigation" aria-label="문항 내비게이션">
        <QuestionNavigator
          questions={displayQuestions}
          answers={answers}
          currentIndex={currentQuestionIndex}
          onNavigate={handleNavigate}
          className="p-4"
        />
      </nav>

      {/* Mobile navigator (bottom sheet) */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 p-4 bg-background border-t">
        <QuestionNavigator
          questions={displayQuestions}
          answers={answers}
          currentIndex={currentQuestionIndex}
          onNavigate={handleNavigate}
        />
      </div>

      {/* Submit dialog */}
      <QuizSubmitDialog
        open={showConfirmDialog}
        onOpenChange={closeConfirmDialog}
        answeredCount={answeredCount}
        totalCount={displayQuestions.length}
        onConfirm={handleSubmitConfirm}
        isSubmitting={isSubmitting}
      />

      {/* Focus warning dialog */}
      <FocusWarningDialog
        open={isWarningOpen}
        onOpenChange={closeWarning}
      />
    </div>
  );
}
