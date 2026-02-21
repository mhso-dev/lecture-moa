/**
 * AI Quiz API Client Functions
 * SPEC-BE-005: Separated from quiz.api.ts because AI generation
 * calls the backend API server, not Supabase directly.
 */

import type { GeneratedQuestion, GenerationOptions } from "@shared";
import { api } from "./index";

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
