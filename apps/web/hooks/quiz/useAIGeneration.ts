/**
 * useAIGeneration Hook - AI Question Generation
 * AI question generation mutation
 *
 * Generates quiz questions using AI based on course materials.
 * Returns generated questions with temporary IDs for tracking.
 */

import { useMutation, type UseMutationResult } from "@tanstack/react-query";
import { generateQuizWithAI } from "~/lib/api/quiz.api";
import type { GenerationOptions, GeneratedQuestion } from "@shared";

/**
 * Generate quiz questions using AI
 *
 * @returns UseMutationResult with array of generated questions
 *
 * Mutation Function Parameters:
 * - materialIds: IDs of course materials to use
 * - count: Number of questions to generate
 * - difficulty: easy, medium, or hard
 * - questionTypes: Array of question types to generate
 *
 * Features:
 * - Supports multiple question types
 * - Questions include tempId for tracking
 * - Each question has points and explanation
 */
export function useAIGeneration(): UseMutationResult<
  GeneratedQuestion[],
  Error,
  GenerationOptions
> {
  return useMutation<GeneratedQuestion[], Error, GenerationOptions>({
    mutationFn: (options) => generateQuizWithAI(options),
  });
}
