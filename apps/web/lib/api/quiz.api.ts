/**
 * Quiz API Client Functions
 * SPEC-FE-007: Typed API client functions for quiz operations
 *
 * Provides functions for:
 * - Student quiz operations (list, take, submit)
 * - Instructor quiz management (CRUD, publish, submissions)
 * - AI question generation
 */

import type {
  QuizListItem,
  QuizDetail,
  QuizAttempt,
  QuizModuleResult,
  QuizSubmissionSummary,
  GeneratedQuestion,
  CreateQuizInput,
  GenerationOptions,
  DraftAnswer,
  PaginatedResponse,
  QuizStatus,
} from "@shared";
import { api } from "./index";

// ============================================================================
// Types
// ============================================================================

/**
 * Quiz list query parameters
 */
export interface QuizListParams {
  status?: QuizStatus;
  courseId?: string;
  cursor?: string;
}

// ============================================================================
// Student API Functions
// ============================================================================

/**
 * Fetch paginated list of quizzes (student view)
 * @param params - Optional query parameters (status, courseId, cursor)
 * @returns Paginated response with quiz list items
 */
export async function fetchQuizList(
  params?: QuizListParams
): Promise<PaginatedResponse<QuizListItem>> {
  const queryParams: Record<string, string | number | boolean> = {};

  if (params?.status) {
    queryParams.status = params.status;
  }
  if (params?.courseId) {
    queryParams.courseId = params.courseId;
  }
  if (params?.cursor) {
    queryParams.cursor = params.cursor;
  }

  const response = await api.get<PaginatedResponse<QuizListItem>>(
    "/api/v1/quiz/quizzes",
    { params: Object.keys(queryParams).length > 0 ? queryParams : undefined }
  );
  return response.data;
}

/**
 * Fetch quiz detail with questions
 * @param quizId - The quiz ID
 * @returns Full quiz detail
 */
export async function fetchQuizDetail(quizId: string): Promise<QuizDetail> {
  const response = await api.get<QuizDetail>(`/api/v1/quiz/quizzes/${quizId}`);
  return response.data;
}

/**
 * Start a new quiz attempt
 * @param quizId - The quiz ID
 * @returns Quiz attempt with attempt ID
 */
export async function startQuizAttempt(quizId: string): Promise<QuizAttempt> {
  const response = await api.post<QuizAttempt>(
    `/api/v1/quiz/quizzes/${quizId}/attempts`
  );
  return response.data;
}

/**
 * Save draft answers (auto-save)
 * @param quizId - The quiz ID
 * @param attemptId - The attempt ID
 * @param answers - Array of draft answers
 */
export async function saveDraftAnswers(
  quizId: string,
  attemptId: string,
  answers: DraftAnswer[]
): Promise<void> {
  await api.put<unknown>(
    `/api/v1/quiz/quizzes/${quizId}/attempts/${attemptId}`,
    { answers }
  );
}

/**
 * Submit quiz attempt
 * @param quizId - The quiz ID
 * @param attemptId - The attempt ID
 * @returns Quiz result
 */
export async function submitQuizAttempt(
  quizId: string,
  attemptId: string
): Promise<QuizModuleResult> {
  const response = await api.post<QuizModuleResult>(
    `/api/v1/quiz/quizzes/${quizId}/attempts/${attemptId}/submit`
  );
  return response.data;
}

/**
 * Fetch quiz result
 * @param quizId - The quiz ID
 * @param attemptId - The attempt ID
 * @returns Quiz result with question breakdown
 */
export async function fetchQuizResult(
  quizId: string,
  attemptId: string
): Promise<QuizModuleResult> {
  const response = await api.get<QuizModuleResult>(
    `/api/v1/quiz/quizzes/${quizId}/attempts/${attemptId}/results`
  );
  return response.data;
}

// ============================================================================
// Instructor API Functions
// ============================================================================

/**
 * Fetch paginated list of instructor's quizzes
 * @param params - Optional query parameters (status, courseId, cursor)
 * @returns Paginated response with quiz list items
 */
export async function fetchInstructorQuizzes(
  params?: QuizListParams
): Promise<PaginatedResponse<QuizListItem>> {
  const queryParams: Record<string, string | number | boolean> = {};

  if (params?.status) {
    queryParams.status = params.status;
  }
  if (params?.courseId) {
    queryParams.courseId = params.courseId;
  }
  if (params?.cursor) {
    queryParams.cursor = params.cursor;
  }

  const response = await api.get<PaginatedResponse<QuizListItem>>(
    "/api/v1/quiz/quizzes",
    { params: Object.keys(queryParams).length > 0 ? queryParams : undefined }
  );
  return response.data;
}

/**
 * Create a new quiz
 * @param data - Quiz creation payload
 * @returns Created quiz detail
 */
export async function createQuiz(data: CreateQuizInput): Promise<QuizDetail> {
  const response = await api.post<QuizDetail>("/api/v1/quiz/quizzes", data);
  return response.data;
}

/**
 * Update an existing quiz
 * @param quizId - The quiz ID
 * @param data - Quiz update payload (partial)
 * @returns Updated quiz detail
 */
export async function updateQuiz(
  quizId: string,
  data: Partial<CreateQuizInput>
): Promise<QuizDetail> {
  const response = await api.put<QuizDetail>(
    `/api/v1/quiz/quizzes/${quizId}`,
    data
  );
  return response.data;
}

/**
 * Delete a quiz
 * @param quizId - The quiz ID
 */
export async function deleteQuiz(quizId: string): Promise<void> {
  await api.delete<unknown>(`/api/v1/quiz/quizzes/${quizId}`);
}

/**
 * Publish a quiz (make available to students)
 * @param quizId - The quiz ID
 */
export async function publishQuiz(quizId: string): Promise<void> {
  await api.post<unknown>(`/api/v1/quiz/quizzes/${quizId}/publish`);
}

/**
 * Close a quiz (no more submissions)
 * @param quizId - The quiz ID
 */
export async function closeQuiz(quizId: string): Promise<void> {
  await api.post<unknown>(`/api/v1/quiz/quizzes/${quizId}/close`);
}

/**
 * Duplicate a quiz
 * @param quizId - The quiz ID to duplicate
 * @returns Duplicated quiz detail
 */
export async function duplicateQuiz(quizId: string): Promise<QuizDetail> {
  const response = await api.post<QuizDetail>(
    `/api/v1/quiz/quizzes/${quizId}/duplicate`
  );
  return response.data;
}

/**
 * Fetch all submissions for a quiz
 * @param quizId - The quiz ID
 * @returns Array of submission summaries
 */
export async function fetchSubmissions(
  quizId: string
): Promise<QuizSubmissionSummary[]> {
  const response = await api.get<QuizSubmissionSummary[]>(
    `/api/v1/quiz/quizzes/${quizId}/submissions`
  );
  return response.data;
}

/**
 * Generate quiz questions using AI
 * @param options - Generation options (materials, count, difficulty, types)
 * @returns Array of generated questions
 */
export async function generateQuizWithAI(
  options: GenerationOptions
): Promise<GeneratedQuestion[]> {
  const response = await api.post<GeneratedQuestion[]>(
    "/api/v1/quiz/ai-generate",
    options
  );
  return response.data;
}
