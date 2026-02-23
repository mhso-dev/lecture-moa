/**
 * ResultsBreakdown Component
 * REQ-FE-622: Question-by-Question Review
 *
 * Displays detailed breakdown of each question result including
 * student answer, correct answer (if allowed), and explanation.
 */

import * as React from "react";
import { cn } from "~/lib/utils";
import { Badge } from "~/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { CheckCircle, XCircle, Clock } from "lucide-react";
import type { QuestionResult, QuestionType } from "@shared";

interface ResultsBreakdownProps {
  results: QuestionResult[];
  showAnswers: boolean;
  className?: string;
  testId?: string;
}

/**
 * Format question type for display
 */
function formatQuestionType(type: QuestionType): string {
  const typeMap: Record<QuestionType, string> = {
    multiple_choice: "객관식",
    true_false: "참/거짓",
    short_answer: "단답형",
    fill_in_the_blank: "빈칸 채우기",
  };
  return typeMap[type] || type;
}

/**
 * Format student answer for display based on type
 */
function formatStudentAnswer(result: QuestionResult): string {
  const { studentAnswer } = result;

  switch (studentAnswer.type) {
    case "multiple_choice":
      return studentAnswer.selectedOptionId ?? "미응답";
    case "true_false":
      return studentAnswer.selectedAnswer !== null
        ? studentAnswer.selectedAnswer
          ? "참"
          : "거짓"
        : "미응답";
    case "short_answer":
      return studentAnswer.text || "답변 없음";
    case "fill_in_the_blank": {
      const filled = Object.values(studentAnswer.filledAnswers).join(", ");
      return filled || "미응답";
    }
    default:
      return "Unknown";
  }
}

/**
 * Format correct answer for display
 */
function formatCorrectAnswer(result: QuestionResult): string {
  const { correctAnswer, type } = result;

  if (correctAnswer === null || correctAnswer === undefined) {
    return "N/A";
  }

  switch (type) {
    case "multiple_choice": {
      const answer = correctAnswer as { text?: string; correctOptionId?: string } | string;
      if (typeof answer === "object") {
        return answer.text ?? "N/A";
      }
      if (typeof answer === "string") {
        return answer;
      }
      return "N/A";
    }
    case "true_false": {
      const answer = correctAnswer as boolean;
      return answer ? "참" : "거짓";
    }
    case "short_answer": {
      const answer = correctAnswer as string;
      return answer;
    }
    case "fill_in_the_blank": {
      const answer = correctAnswer as Record<string, string>;
      return Object.values(answer).join(", ");
    }
    default:
      return "Unknown";
  }
}

/**
 * Get status icon for question result
 */
function StatusIcon({
  isCorrect,
  type,
}: {
  isCorrect: boolean | null;
  type: QuestionType;
}) {
  // Short answer questions need manual grading
  if (type === "short_answer" && isCorrect === null) {
    return (
      <div className="flex items-center gap-2 text-amber-600">
        <Clock className="h-5 w-5" data-testid="clock" />
        <span className="text-sm">수동 채점 대기 중</span>
      </div>
    );
  }

  if (isCorrect === null) {
    return null;
  }

  return isCorrect ? (
    <CheckCircle className="h-5 w-5 text-green-600" data-testid="check-circle" />
  ) : (
    <XCircle className="h-5 w-5 text-red-600" data-testid="x-circle" />
  );
}

/**
 * Single question result card
 */
function QuestionResultCard({
  result,
  index,
  showAnswers,
}: {
  result: QuestionResult;
  index: number;
  showAnswers: boolean;
}) {
  const statusIcon = (
    <StatusIcon isCorrect={result.isCorrect} type={result.type} />
  );

  const isUnanswered =
    (result.studentAnswer.type === "multiple_choice" &&
      result.studentAnswer.selectedOptionId === null) ||
    (result.studentAnswer.type === "true_false" &&
      result.studentAnswer.selectedAnswer === null);

  return (
    <Card className="mb-4">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 space-y-2">
            <div className="flex items-center gap-3">
              <CardTitle className="text-lg">문항 {index + 1}</CardTitle>
              <Badge variant="outline">{formatQuestionType(result.type)}</Badge>
            </div>
            <p className="text-base">{result.questionText}</p>
          </div>
          <div className="flex flex-col items-end gap-2">
            {statusIcon}
            <div className="text-sm font-medium">
              {result.earnedPoints} / {result.points} pts
            </div>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Student Answer */}
        {showAnswers && (
          <div className="space-y-1">
            <div className="text-sm font-medium text-muted-foreground">
              나의 답변
            </div>
            <div
              className={cn(
                "rounded-md p-3 text-sm",
                result.isCorrect === true && "bg-green-50 border border-green-200",
                result.isCorrect === false && "bg-red-50 border border-red-200",
                result.isCorrect === null && "bg-amber-50 border border-amber-200"
              )}
            >
              {formatStudentAnswer(result)}
            </div>
          </div>
        )}

        {/* Correct Answer - only shown if showAnswers is true */}
        {showAnswers && result.isCorrect === false && (
          <div className="space-y-1">
            <div className="text-sm font-medium text-muted-foreground">
              정답
            </div>
            <div className="rounded-md bg-green-50 border border-green-200 p-3 text-sm text-green-800">
              {formatCorrectAnswer(result)}
            </div>
          </div>
        )}

        {/* Unanswered indicator */}
        {isUnanswered && (
          <div className="text-sm text-muted-foreground italic">
            미응답
          </div>
        )}

        {/* Explanation */}
        {showAnswers && result.explanation && (
          <div className="space-y-1">
            <div className="text-sm font-medium text-muted-foreground">
              해설
            </div>
            <div className="rounded-md bg-muted p-3 text-sm">
              {result.explanation}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export function ResultsBreakdown({
  results,
  showAnswers,
  className,
  testId,
}: ResultsBreakdownProps) {
  // Empty state
  if (results.length === 0) {
    return (
      <div
        className={cn("text-center py-8 text-muted-foreground", className)}
        data-testid={testId}
      >
        표시할 문항이 없습니다
      </div>
    );
  }

  return (
    <div className={cn("space-y-4", className)} data-testid={testId}>
      {results.map((result, index) => (
        <QuestionResultCard
          key={result.questionId}
          result={result}
          index={index}
          showAnswers={showAnswers}
        />
      ))}
    </div>
  );
}
