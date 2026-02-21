/**
 * useAIGeneration Hook Tests
 * AI question generation mutation
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { ReactNode } from "react";
import * as aiQuizApi from "~/lib/api/ai-quiz.api";

// Mock the API module
vi.mock("~/lib/api/ai-quiz.api", () => ({
  generateQuizWithAI: vi.fn(),
}));

// Create wrapper with QueryClient
const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });

  return function Wrapper({ children }: { children: ReactNode }) {
    return (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );
  };
};

const createMockGeneratedQuestion = (tempId: string) => ({
  tempId,
  type: "multiple_choice" as const,
  questionText: `Generated Question ${tempId}`,
  options: [
    { id: "opt-1", text: "Option 1" },
    { id: "opt-2", text: "Option 2" },
  ],
  correctOptionId: "opt-1",
  explanation: "Explanation text",
  points: 10,
});

describe("useAIGeneration", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("mutation", () => {
    it("generates questions using AI", async () => {
      const mockData = [
        createMockGeneratedQuestion("temp-1"),
        createMockGeneratedQuestion("temp-2"),
        createMockGeneratedQuestion("temp-3"),
      ];
      vi.mocked(aiQuizApi.generateQuizWithAI).mockResolvedValue(mockData);

      const { useAIGeneration } = await import("../useAIGeneration");
      const { result } = renderHook(() => useAIGeneration(), {
        wrapper: createWrapper(),
      });

      result.current.mutate({
        materialIds: ["material-1", "material-2"],
        count: 3,
        difficulty: "medium",
        questionTypes: ["multiple_choice"],
      });

      await waitFor(() => { expect(result.current.isSuccess).toBe(true); });

      expect(aiQuizApi.generateQuizWithAI).toHaveBeenCalledWith({
        materialIds: ["material-1", "material-2"],
        count: 3,
        difficulty: "medium",
        questionTypes: ["multiple_choice"],
      });
      expect(result.current.data).toEqual(mockData);
      expect(result.current.data).toHaveLength(3);
    });

    it("handles generation error", async () => {
      vi.mocked(aiQuizApi.generateQuizWithAI).mockRejectedValue(
        new Error("AI generation failed")
      );

      const { useAIGeneration } = await import("../useAIGeneration");
      const { result } = renderHook(() => useAIGeneration(), {
        wrapper: createWrapper(),
      });

      result.current.mutate({
        materialIds: ["material-1"],
        count: 5,
        difficulty: "easy",
        questionTypes: ["multiple_choice", "true_false"],
      });

      await waitFor(() => { expect(result.current.isError).toBe(true); });

      expect(result.current.error).toBeInstanceOf(Error);
    });

    it("handles empty material IDs", async () => {
      vi.mocked(aiQuizApi.generateQuizWithAI).mockRejectedValue(
        new Error("No materials provided")
      );

      const { useAIGeneration } = await import("../useAIGeneration");
      const { result } = renderHook(() => useAIGeneration(), {
        wrapper: createWrapper(),
      });

      result.current.mutate({
        materialIds: [],
        count: 5,
        difficulty: "medium",
        questionTypes: ["multiple_choice"],
      });

      await waitFor(() => { expect(result.current.isError).toBe(true); });

      expect(result.current.error).toBeInstanceOf(Error);
    });
  });

  describe("generation options", () => {
    it("supports different difficulty levels", async () => {
      const mockData = [createMockGeneratedQuestion("temp-1")];
      vi.mocked(aiQuizApi.generateQuizWithAI).mockResolvedValue(mockData);

      const { useAIGeneration } = await import("../useAIGeneration");
      const { result } = renderHook(() => useAIGeneration(), {
        wrapper: createWrapper(),
      });

      const difficulties: ("easy" | "medium" | "hard")[] = ["easy", "medium", "hard"];

      for (const difficulty of difficulties) {
        result.current.mutate({
          materialIds: ["material-1"],
          count: 1,
          difficulty,
          questionTypes: ["multiple_choice"],
        });

        await waitFor(() => { expect(result.current.isSuccess).toBe(true); });

        expect(aiQuizApi.generateQuizWithAI).toHaveBeenCalledWith(
          expect.objectContaining({ difficulty })
        );

        vi.clearAllMocks();
        vi.mocked(aiQuizApi.generateQuizWithAI).mockResolvedValue(mockData);
      }
    });

    it("supports multiple question types", async () => {
      const mockData = [createMockGeneratedQuestion("temp-1")];
      vi.mocked(aiQuizApi.generateQuizWithAI).mockResolvedValue(mockData);

      const { useAIGeneration } = await import("../useAIGeneration");
      const { result } = renderHook(() => useAIGeneration(), {
        wrapper: createWrapper(),
      });

      result.current.mutate({
        materialIds: ["material-1"],
        count: 5,
        difficulty: "medium",
        questionTypes: ["multiple_choice", "true_false", "short_answer"],
      });

      await waitFor(() => { expect(result.current.isSuccess).toBe(true); });

      expect(aiQuizApi.generateQuizWithAI).toHaveBeenCalledWith(
        expect.objectContaining({
          questionTypes: ["multiple_choice", "true_false", "short_answer"],
        })
      );
    });

    it("specifies question count", async () => {
      const mockData = Array(10).fill(null).map((_, i) =>
        createMockGeneratedQuestion(`temp-${String(i)}`)
      );
      vi.mocked(aiQuizApi.generateQuizWithAI).mockResolvedValue(mockData);

      const { useAIGeneration } = await import("../useAIGeneration");
      const { result } = renderHook(() => useAIGeneration(), {
        wrapper: createWrapper(),
      });

      result.current.mutate({
        materialIds: ["material-1"],
        count: 10,
        difficulty: "hard",
        questionTypes: ["multiple_choice"],
      });

      await waitFor(() => { expect(result.current.isSuccess).toBe(true); });

      expect(aiQuizApi.generateQuizWithAI).toHaveBeenCalledWith(
        expect.objectContaining({ count: 10 })
      );
    });
  });

  describe("generated question format", () => {
    it("returns questions with tempId for tracking", async () => {
      const mockData = [createMockGeneratedQuestion("temp-abc123")];
      vi.mocked(aiQuizApi.generateQuizWithAI).mockResolvedValue(mockData);

      const { useAIGeneration } = await import("../useAIGeneration");
      const { result } = renderHook(() => useAIGeneration(), {
        wrapper: createWrapper(),
      });

      result.current.mutate({
        materialIds: ["material-1"],
        count: 1,
        difficulty: "medium",
        questionTypes: ["multiple_choice"],
      });

      await waitFor(() => { expect(result.current.isSuccess).toBe(true); });

      expect(result.current.data?.[0]?.tempId).toBe("temp-abc123");
    });

    it("returns questions with points value", async () => {
      const mockData = [createMockGeneratedQuestion("temp-1")];
      vi.mocked(aiQuizApi.generateQuizWithAI).mockResolvedValue(mockData);

      const { useAIGeneration } = await import("../useAIGeneration");
      const { result } = renderHook(() => useAIGeneration(), {
        wrapper: createWrapper(),
      });

      result.current.mutate({
        materialIds: ["material-1"],
        count: 1,
        difficulty: "medium",
        questionTypes: ["multiple_choice"],
      });

      await waitFor(() => { expect(result.current.isSuccess).toBe(true); });

      expect(result.current.data?.[0]?.points).toBe(10);
    });

    it("returns questions with explanation", async () => {
      const mockData = [createMockGeneratedQuestion("temp-1")];
      vi.mocked(aiQuizApi.generateQuizWithAI).mockResolvedValue(mockData);

      const { useAIGeneration } = await import("../useAIGeneration");
      const { result } = renderHook(() => useAIGeneration(), {
        wrapper: createWrapper(),
      });

      result.current.mutate({
        materialIds: ["material-1"],
        count: 1,
        difficulty: "medium",
        questionTypes: ["multiple_choice"],
      });

      await waitFor(() => { expect(result.current.isSuccess).toBe(true); });

      expect(result.current.data?.[0]?.explanation).toBe("Explanation text");
    });
  });

  describe("loading state", () => {
    it("tracks loading state during generation", async () => {
      // This test verifies the mutation state machine
      // isIdle -> isPending -> isSuccess
      const mockData = [createMockGeneratedQuestion("temp-1")];
      vi.mocked(aiQuizApi.generateQuizWithAI).mockResolvedValue(mockData);

      const { useAIGeneration } = await import("../useAIGeneration");
      const { result } = renderHook(() => useAIGeneration(), {
        wrapper: createWrapper(),
      });

      // Initially idle
      expect(result.current.isIdle).toBe(true);

      // Start mutation
      result.current.mutate({
        materialIds: ["material-1"],
        count: 1,
        difficulty: "medium",
        questionTypes: ["multiple_choice"],
      });

      // Wait for completion
      await waitFor(() => { expect(result.current.isSuccess).toBe(true); });

      // Verify data
      expect(result.current.data).toEqual(mockData);
    });
  });
});
