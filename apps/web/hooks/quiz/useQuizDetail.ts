/**
 * useQuizDetail Hook - Single Quiz Detail
 * REQ-FE-610 / REQ-BE-005-010: Quiz detail fetching with questions
 *
 * Fetches detailed information for a single quiz by ID.
 * Handles 404 gracefully and includes all questions.
 * Data source: Supabase direct query (migrated from REST API).
 */

import { useQuery, type UseQueryResult } from "@tanstack/react-query";
import { getQuiz } from "~/lib/supabase/quizzes";
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
 * - Includes all questions (answers excluded for students)
 * - Handles 404 errors gracefully
 */
export function useQuizDetail(quizId: string): UseQueryResult<QuizDetail> {
  return useQuery({
    queryKey: ["quizzes", quizId],
    queryFn: () => getQuiz(quizId),
    enabled: !!quizId && quizId.length > 0,
  });
}
