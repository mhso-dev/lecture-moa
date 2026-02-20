/**
 * useQuizResult Hook - Quiz Result after Submission
 * REQ-FE-620: Quiz result fetching after submission
 *
 * Fetches quiz result with question-by-question breakdown.
 * Used on the results page after quiz submission.
 */

import { useQuery, type UseQueryResult } from "@tanstack/react-query";
import { fetchQuizResult } from "~/lib/api/quiz.api";
import type { QuizModuleResult } from "@shared";

/**
 * Query key factory for quiz results
 */
export const quizResultKeys = {
  all: ["quizzes"] as const,
  results: (quizId: string) => [...quizResultKeys.all, quizId, "result"] as const,
  result: (quizId: string, attemptId: string) =>
    [...quizResultKeys.results(quizId), attemptId] as const,
};

/**
 * Fetch quiz result with question breakdown
 *
 * @param quizId - The quiz ID
 * @param attemptId - The attempt ID
 * @returns UseQueryResult with quiz result data
 *
 * Query Key: ['quizzes', quizId, 'result', attemptId]
 *
 * Features:
 * - Disabled when quizId or attemptId is empty
 * - Includes per-question results
 * - Includes score, percentage, and pass status
 */
export function useQuizResult(
  quizId: string,
  attemptId: string
): UseQueryResult<QuizModuleResult> {
  return useQuery({
    queryKey: ["quizzes", quizId, "result", attemptId],
    queryFn: () => fetchQuizResult(quizId, attemptId),
    enabled: !!quizId && quizId.length > 0 && !!attemptId && attemptId.length > 0,
  });
}
