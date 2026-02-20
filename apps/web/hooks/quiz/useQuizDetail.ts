/**
 * useQuizDetail Hook - Single Quiz Detail
 * REQ-FE-610: Quiz detail fetching with questions
 *
 * Fetches detailed information for a single quiz by ID.
 * Handles 404 gracefully and includes all questions.
 */

import { useQuery, type UseQueryResult } from "@tanstack/react-query";
import { fetchQuizDetail } from "~/lib/api/quiz.api";
import type { QuizDetail } from "@shared";

/**
 * Query key factory for quiz detail
 */
export const quizDetailKeys = {
  all: ["quizzes"] as const,
  details: () => [...quizDetailKeys.all, "detail"] as const,
  detail: (quizId: string) => [...quizDetailKeys.details(), quizId] as const,
};

/**
 * Fetch single quiz detail by ID
 *
 * @param quizId - The quiz ID to fetch
 * @returns UseQueryResult with quiz data
 *
 * Query Key: ['quizzes', quizId]
 *
 * Features:
 * - Disabled when quizId is empty/undefined
 * - Includes all questions
 * - Handles 404 errors gracefully
 */
export function useQuizDetail(quizId: string): UseQueryResult<QuizDetail> {
  return useQuery({
    queryKey: ["quizzes", quizId],
    queryFn: () => fetchQuizDetail(quizId),
    enabled: !!quizId && quizId.length > 0,
  });
}
