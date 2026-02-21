/**
 * useQuizMutations Hook Tests
 * Quiz CRUD mutations (create, update, delete, publish, close, duplicate)
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { ReactNode } from "react";
import * as quizApi from "~/lib/supabase/quizzes";

// Mock the API module
vi.mock("~/lib/supabase/quizzes", () => ({
  createQuiz: vi.fn(),
  updateQuiz: vi.fn(),
  deleteQuiz: vi.fn(),
  publishQuiz: vi.fn(),
  closeQuiz: vi.fn(),
  duplicateQuiz: vi.fn(),
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

const createMockQuizDetail = (id: string) => ({
  id,
  title: `Quiz ${id}`,
  description: "Test quiz",
  courseId: "course-1",
  courseName: "Course 1",
  status: "draft" as const,
  timeLimitMinutes: 30,
  passingScore: 70,
  allowReattempt: true,
  shuffleQuestions: false,
  showAnswersAfterSubmit: true,
  focusLossWarning: true,
  dueDate: null,
  questions: [],
  createdAt: "2024-01-01T00:00:00Z",
  updatedAt: "2024-01-01T00:00:00Z",
});

describe("useQuizMutations", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("useCreateQuiz", () => {
    it("creates a new quiz", async () => {
      const mockData = createMockQuizDetail("quiz-new");
      vi.mocked(quizApi.createQuiz).mockResolvedValue(mockData);

      const { useCreateQuiz } = await import("../useQuizMutations");
      const { result } = renderHook(() => useCreateQuiz(), {
        wrapper: createWrapper(),
      });

      result.current.mutate({
        title: "New Quiz",
        courseId: "course-1",
        allowReattempt: true,
        shuffleQuestions: false,
        showAnswersAfterSubmit: true,
        focusLossWarning: true,
      });

      await waitFor(() => { expect(result.current.isSuccess).toBe(true); });

      expect(quizApi.createQuiz).toHaveBeenCalledWith(
        expect.objectContaining({ title: "New Quiz" })
      );
      expect(result.current.data).toEqual(mockData);
    });

    it("handles creation error", async () => {
      vi.mocked(quizApi.createQuiz).mockRejectedValue(
        new Error("Creation failed")
      );

      const { useCreateQuiz } = await import("../useQuizMutations");
      const { result } = renderHook(() => useCreateQuiz(), {
        wrapper: createWrapper(),
      });

      result.current.mutate({
        title: "New Quiz",
        courseId: "course-1",
        allowReattempt: true,
        shuffleQuestions: false,
        showAnswersAfterSubmit: true,
        focusLossWarning: true,
      });

      await waitFor(() => { expect(result.current.isError).toBe(true); });

      expect(result.current.error).toBeInstanceOf(Error);
    });

    it("invalidates instructor quizzes query on success", async () => {
      const mockData = createMockQuizDetail("quiz-new");
      vi.mocked(quizApi.createQuiz).mockResolvedValue(mockData);

      const queryClient = new QueryClient({
        defaultOptions: { queries: { retry: false } },
      });
      const invalidateSpy = vi.spyOn(queryClient, "invalidateQueries");

      const wrapper = ({ children }: { children: ReactNode }) => (
        <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
      );

      const { useCreateQuiz } = await import("../useQuizMutations");
      const { result } = renderHook(() => useCreateQuiz(), { wrapper });

      result.current.mutate({
        title: "New Quiz",
        courseId: "course-1",
        allowReattempt: true,
        shuffleQuestions: false,
        showAnswersAfterSubmit: true,
        focusLossWarning: true,
      });

      await waitFor(() => { expect(result.current.isSuccess).toBe(true); });

      expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ["instructor", "quizzes"] });
    });
  });

  describe("useUpdateQuiz", () => {
    it("updates an existing quiz", async () => {
      const mockData = { ...createMockQuizDetail("quiz-1"), title: "Updated Title" };
      vi.mocked(quizApi.updateQuiz).mockResolvedValue(mockData);

      const { useUpdateQuiz } = await import("../useQuizMutations");
      const { result } = renderHook(() => useUpdateQuiz(), {
        wrapper: createWrapper(),
      });

      result.current.mutate({
        quizId: "quiz-1",
        data: { title: "Updated Title" },
      });

      await waitFor(() => { expect(result.current.isSuccess).toBe(true); });

      expect(quizApi.updateQuiz).toHaveBeenCalledWith("quiz-1", { title: "Updated Title" });
      expect(result.current.data).toEqual(mockData);
    });

    it("handles update error", async () => {
      vi.mocked(quizApi.updateQuiz).mockRejectedValue(
        new Error("Update failed")
      );

      const { useUpdateQuiz } = await import("../useQuizMutations");
      const { result } = renderHook(() => useUpdateQuiz(), {
        wrapper: createWrapper(),
      });

      result.current.mutate({
        quizId: "quiz-1",
        data: { title: "Updated Title" },
      });

      await waitFor(() => { expect(result.current.isError).toBe(true); });

      expect(result.current.error).toBeInstanceOf(Error);
    });

    it("invalidates quiz detail query on success", async () => {
      const mockData = { ...createMockQuizDetail("quiz-1"), title: "Updated Title" };
      vi.mocked(quizApi.updateQuiz).mockResolvedValue(mockData);

      const queryClient = new QueryClient({
        defaultOptions: { queries: { retry: false } },
      });
      const invalidateSpy = vi.spyOn(queryClient, "invalidateQueries");

      const wrapper = ({ children }: { children: ReactNode }) => (
        <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
      );

      const { useUpdateQuiz } = await import("../useQuizMutations");
      const { result } = renderHook(() => useUpdateQuiz(), { wrapper });

      result.current.mutate({
        quizId: "quiz-1",
        data: { title: "Updated Title" },
      });

      await waitFor(() => { expect(result.current.isSuccess).toBe(true); });

      expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ["quizzes", "quiz-1"] });
      expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ["instructor", "quizzes"] });
    });
  });

  describe("useDeleteQuiz", () => {
    it("deletes a quiz", async () => {
      vi.mocked(quizApi.deleteQuiz).mockResolvedValue(undefined);

      const { useDeleteQuiz } = await import("../useQuizMutations");
      const { result } = renderHook(() => useDeleteQuiz(), {
        wrapper: createWrapper(),
      });

      result.current.mutate({ quizId: "quiz-1" });

      await waitFor(() => { expect(result.current.isSuccess).toBe(true); });

      expect(quizApi.deleteQuiz).toHaveBeenCalledWith("quiz-1");
    });

    it("handles delete error", async () => {
      vi.mocked(quizApi.deleteQuiz).mockRejectedValue(
        new Error("Delete failed")
      );

      const { useDeleteQuiz } = await import("../useQuizMutations");
      const { result } = renderHook(() => useDeleteQuiz(), {
        wrapper: createWrapper(),
      });

      result.current.mutate({ quizId: "quiz-1" });

      await waitFor(() => { expect(result.current.isError).toBe(true); });

      expect(result.current.error).toBeInstanceOf(Error);
    });
  });

  describe("usePublishQuiz", () => {
    it("publishes a quiz", async () => {
      vi.mocked(quizApi.publishQuiz).mockResolvedValue(undefined);

      const { usePublishQuiz } = await import("../useQuizMutations");
      const { result } = renderHook(() => usePublishQuiz(), {
        wrapper: createWrapper(),
      });

      result.current.mutate({ quizId: "quiz-1" });

      await waitFor(() => { expect(result.current.isSuccess).toBe(true); });

      expect(quizApi.publishQuiz).toHaveBeenCalledWith("quiz-1");
    });

    it("handles publish error", async () => {
      vi.mocked(quizApi.publishQuiz).mockRejectedValue(
        new Error("Publish failed")
      );

      const { usePublishQuiz } = await import("../useQuizMutations");
      const { result } = renderHook(() => usePublishQuiz(), {
        wrapper: createWrapper(),
      });

      result.current.mutate({ quizId: "quiz-1" });

      await waitFor(() => { expect(result.current.isError).toBe(true); });

      expect(result.current.error).toBeInstanceOf(Error);
    });
  });

  describe("useCloseQuiz", () => {
    it("closes a quiz", async () => {
      vi.mocked(quizApi.closeQuiz).mockResolvedValue(undefined);

      const { useCloseQuiz } = await import("../useQuizMutations");
      const { result } = renderHook(() => useCloseQuiz(), {
        wrapper: createWrapper(),
      });

      result.current.mutate({ quizId: "quiz-1" });

      await waitFor(() => { expect(result.current.isSuccess).toBe(true); });

      expect(quizApi.closeQuiz).toHaveBeenCalledWith("quiz-1");
    });

    it("handles close error", async () => {
      vi.mocked(quizApi.closeQuiz).mockRejectedValue(
        new Error("Close failed")
      );

      const { useCloseQuiz } = await import("../useQuizMutations");
      const { result } = renderHook(() => useCloseQuiz(), {
        wrapper: createWrapper(),
      });

      result.current.mutate({ quizId: "quiz-1" });

      await waitFor(() => { expect(result.current.isError).toBe(true); });

      expect(result.current.error).toBeInstanceOf(Error);
    });
  });

  describe("useDuplicateQuiz", () => {
    it("duplicates a quiz", async () => {
      const mockData = { ...createMockQuizDetail("quiz-2"), title: "Quiz 1 (Copy)" };
      vi.mocked(quizApi.duplicateQuiz).mockResolvedValue(mockData);

      const { useDuplicateQuiz } = await import("../useQuizMutations");
      const { result } = renderHook(() => useDuplicateQuiz(), {
        wrapper: createWrapper(),
      });

      result.current.mutate({ quizId: "quiz-1" });

      await waitFor(() => { expect(result.current.isSuccess).toBe(true); });

      expect(quizApi.duplicateQuiz).toHaveBeenCalledWith("quiz-1");
      expect(result.current.data).toEqual(mockData);
    });

    it("handles duplicate error", async () => {
      vi.mocked(quizApi.duplicateQuiz).mockRejectedValue(
        new Error("Duplicate failed")
      );

      const { useDuplicateQuiz } = await import("../useQuizMutations");
      const { result } = renderHook(() => useDuplicateQuiz(), {
        wrapper: createWrapper(),
      });

      result.current.mutate({ quizId: "quiz-1" });

      await waitFor(() => { expect(result.current.isError).toBe(true); });

      expect(result.current.error).toBeInstanceOf(Error);
    });
  });
});
