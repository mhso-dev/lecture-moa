/**
 * useSubmissions Hook - Quiz Submissions for Instructor
 * Quiz submissions fetching for instructor view
 *
 * Fetches all student submissions for a quiz.
 * Used by instructors to review student performance.
 */

import { useQuery, type UseQueryResult } from "@tanstack/react-query";
import { fetchSubmissions } from "~/lib/api/quiz.api";
import type { QuizSubmissionSummary } from "@shared";

/**
 * Query key factory for submissions
 */
export const submissionKeys = {
  all: ["instructor", "quizzes"] as const,
  submissions: (quizId: string) => [...submissionKeys.all, quizId, "submissions"] as const,
};

/**
 * Fetch all submissions for a quiz
 *
 * @param quizId - The quiz ID
 * @returns UseQueryResult with array of submission summaries
 *
 * Query Key: ['instructor', 'quizzes', quizId, 'submissions']
 *
 * Features:
 * - Disabled when quizId is empty/undefined
 * - Returns user info, score, pass status, and timestamp
 */
export function useSubmissions(
  quizId: string
): UseQueryResult<QuizSubmissionSummary[]> {
  return useQuery({
    queryKey: ["instructor", "quizzes", quizId, "submissions"],
    queryFn: () => fetchSubmissions(quizId),
    enabled: !!quizId && quizId.length > 0,
  });
}
