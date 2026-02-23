/**
 * ResultsSummary Component
 * REQ-FE-621: Quiz Results Summary Display
 *
 * Displays overall quiz results including score, pass/fail status,
 * time taken, and provides options to retake or go back.
 */

import * as React from "react";
import { cn } from "~/lib/utils";
import { Button } from "~/components/ui/button";
import { Badge } from "~/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { ResultsChart } from "./results-chart";
import type { QuizModuleResult, QuizDetail, QuestionResult } from "@shared";

interface ResultsSummaryProps {
  result: QuizModuleResult;
  quiz: QuizDetail;
  onRetake?: () => void;
  onBack?: () => void;
  className?: string;
  testId?: string;
}

// Helper to compute answer statistics from question results
function computeAnswerStats(questionResults: QuestionResult[]): {
  correct: number;
  incorrect: number;
  unanswered: number;
} {
  let correct = 0;
  let incorrect = 0;
  let unanswered = 0;

  for (const qr of questionResults) {
    if (qr.isCorrect === null) {
      // Check if actually unanswered vs pending grading
      const answer = qr.studentAnswer;
      const hasAnswer =
        (answer.type === "multiple_choice" && answer.selectedOptionId !== null) ||
        (answer.type === "true_false" && answer.selectedAnswer !== null) ||
        (answer.type === "short_answer" && answer.text.length > 0) ||
        (answer.type === "fill_in_the_blank" && Object.values(answer.filledAnswers).some(v => v.length > 0));

      if (!hasAnswer) {
        unanswered++;
      } else if (qr.type === "short_answer") {
        // Short answer pending grading counts as answered
        correct++; // or incorrect, will be determined after grading
      } else {
        incorrect++;
      }
    } else if (qr.isCorrect) {
      correct++;
    } else {
      incorrect++;
    }
  }

  return { correct, incorrect, unanswered };
}

export function ResultsSummary({
  result,
  quiz,
  onRetake,
  onBack,
  className,
  testId,
}: ResultsSummaryProps) {
  const canRetake = quiz.allowReattempt && quiz.status === "published";

  // Compute answer statistics from question results
  const stats = React.useMemo(
    () => computeAnswerStats(result.questionResults),
    [result.questionResults]
  );

  // Format time taken
  const formatTime = (seconds: number): string => {
    if (seconds < 60) {
      return "1분 미만";
    }
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);

    if (hours > 0) {
      return `${String(hours)}시간 ${String(minutes)}분`;
    }
    return `${String(minutes)}분`;
  };

  return (
    <Card className={cn("w-full", className)} data-testid={testId}>
      <CardHeader>
        <CardTitle className="text-2xl">
          퀴즈 완료: {quiz.title}
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Score and Badge */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="text-5xl font-bold">{result.percentage}%</div>
            {result.passed !== null && (
              <Badge
                variant={result.passed ? "default" : "destructive"}
                className="text-lg px-4 py-2"
              >
                {result.passed ? "합격" : "불합격"}
              </Badge>
            )}
          </div>
          {quiz.passingScore !== null && (
            <div className="text-sm text-muted-foreground">
              합격 점수: {quiz.passingScore}%
            </div>
          )}
        </div>

        {/* Results Chart */}
        <div className="flex justify-center py-4">
          <ResultsChart
            correct={stats.correct}
            incorrect={stats.incorrect}
            unanswered={stats.unanswered}
          />
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          <div className="space-y-1">
            <div className="text-sm font-medium text-muted-foreground">정답</div>
            <div className="text-2xl font-bold text-green-600">
              {stats.correct}
            </div>
          </div>

          <div className="space-y-1">
            <div className="text-sm font-medium text-muted-foreground">오답</div>
            <div className="text-2xl font-bold text-red-600">
              {stats.incorrect}
            </div>
          </div>

          <div className="space-y-1">
            <div className="text-sm font-medium text-muted-foreground">미응답</div>
            <div className="text-2xl font-bold text-gray-600">
              {stats.unanswered}
            </div>
          </div>

          <div className="space-y-1">
            <div className="text-sm font-medium text-muted-foreground">소요 시간</div>
            <div className="text-2xl font-bold">
              {formatTime(result.timeTaken)}
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-4 pt-4">
          {onBack && (
            <Button variant="outline" onClick={onBack} className="flex-1">
              퀴즈 목록으로
            </Button>
          )}

          {canRetake && onRetake && (
            <Button onClick={onRetake} className="flex-1">
              퀴즈 재응시
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
