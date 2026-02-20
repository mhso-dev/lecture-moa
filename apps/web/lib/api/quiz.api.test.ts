/**
 * Quiz API Client Tests - GREEN/REFACTOR Phase
 * SPEC-FE-007: Quiz System API client functions
 *
 * Tests verify API client functions are properly typed and callable.
 * Mock API responses to test without actual backend.
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import type {
  QuizListItem,
  QuizDetail,
  QuizAttempt,
  QuizModuleResult,
  QuizSubmissionSummary,
  GeneratedQuestion,
  PaginatedResponse,
} from "@shared";

// Mock the API client - must be before import
vi.mock("./index", () => ({
  api: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
  },
}));

// Import after mocking
import { api } from "./index";
import {
  fetchQuizList,
  fetchQuizDetail,
  startQuizAttempt,
  saveDraftAnswers,
  submitQuizAttempt,
  fetchQuizResult,
  fetchInstructorQuizzes,
  createQuiz,
  updateQuiz,
  deleteQuiz,
  publishQuiz,
  closeQuiz,
  duplicateQuiz,
  fetchSubmissions,
  generateQuizWithAI,
} from "./quiz.api";

// Mock data
const mockQuizListItem: QuizListItem = {
  id: "quiz-1",
  title: "Test Quiz",
  courseId: "course-1",
  courseName: "Test Course",
  status: "published",
  questionCount: 10,
  timeLimitMinutes: 30,
  passingScore: 70,
  dueDate: "2024-12-31T23:59:59Z",
  attemptCount: 5,
  myLastAttemptScore: 85,
  createdAt: "2024-01-01T00:00:00Z",
};

const mockPaginatedResponse: PaginatedResponse<QuizListItem> = {
  data: [mockQuizListItem],
  pagination: {
    page: 1,
    limit: 20,
    total: 1,
    totalPages: 1,
  },
};

const mockQuizDetail: QuizDetail = {
  id: "quiz-1",
  title: "Test Quiz",
  description: "A test quiz",
  courseId: "course-1",
  courseName: "Test Course",
  status: "published",
  timeLimitMinutes: 30,
  passingScore: 70,
  allowReattempt: false,
  shuffleQuestions: true,
  showAnswersAfterSubmit: true,
  focusLossWarning: true,
  dueDate: "2024-12-31T23:59:59Z",
  questions: [],
  createdAt: "2024-01-01T00:00:00Z",
  updatedAt: "2024-01-02T00:00:00Z",
};

const mockQuizAttempt: QuizAttempt = {
  id: "attempt-1",
  quizId: "quiz-1",
  userId: "user-1",
  status: "in_progress",
  answers: [],
  startedAt: "2024-01-01T10:00:00Z",
  submittedAt: null,
  score: null,
  passed: null,
};

const mockQuizResult: QuizModuleResult = {
  attemptId: "attempt-1",
  quizId: "quiz-1",
  quizTitle: "Test Quiz",
  score: 85,
  maxScore: 100,
  percentage: 85,
  passed: true,
  timeTaken: 1800,
  questionResults: [],
};

const mockSubmissionSummary: QuizSubmissionSummary = {
  userId: "user-1",
  userName: "John Doe",
  attemptId: "attempt-1",
  score: 85,
  percentage: 85,
  passed: true,
  submittedAt: "2024-01-01T11:00:00Z",
};

const mockGeneratedQuestion: GeneratedQuestion = {
  tempId: "temp-1",
  type: "multiple_choice",
  questionText: "Generated question?",
  options: [
    { id: "opt-1", text: "Option A" },
    { id: "opt-2", text: "Option B" },
  ],
  correctOptionId: "opt-2",
  explanation: null,
  points: 10,
};

describe("Quiz API Client - SPEC-FE-007", () => {
  const mockApi = api as unknown as {
    get: ReturnType<typeof vi.fn>;
    post: ReturnType<typeof vi.fn>;
    put: ReturnType<typeof vi.fn>;
    delete: ReturnType<typeof vi.fn>;
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("Student API Functions", () => {
    describe("fetchQuizList", () => {
      it("should export fetchQuizList function", () => {
        expect(typeof fetchQuizList).toBe("function");
      });

      it("fetchQuizList should return PaginatedResponse<QuizListItem>", async () => {
        mockApi.get.mockResolvedValueOnce({ data: mockPaginatedResponse });

        const result = await fetchQuizList();

        expect(result).toEqual(mockPaginatedResponse);
        expect(result.data).toHaveLength(1);
        const firstItem = result.data[0];
        expect(firstItem).toBeDefined();
        if (firstItem) {
          expect(firstItem.title).toBe("Test Quiz");
        }
      });

      it("fetchQuizList should accept status and courseId params", async () => {
        mockApi.get.mockResolvedValueOnce({ data: mockPaginatedResponse });

        await fetchQuizList({ status: "published", courseId: "course-1" });

        expect(mockApi.get).toHaveBeenCalledWith(
          "/api/v1/quiz/quizzes",
          expect.objectContaining({
            params: expect.objectContaining({
              status: "published",
              courseId: "course-1",
            }),
          } satisfies Record<string, unknown>)
        );
      });

      it("fetchQuizList should call GET /api/v1/quiz/quizzes", async () => {
        mockApi.get.mockResolvedValueOnce({ data: mockPaginatedResponse });

        await fetchQuizList();

        expect(mockApi.get).toHaveBeenCalledWith(
          "/api/v1/quiz/quizzes",
          expect.any(Object)
        );
      });
    });

    describe("fetchQuizDetail", () => {
      it("should export fetchQuizDetail function", () => {
        expect(typeof fetchQuizDetail).toBe("function");
      });

      it("fetchQuizDetail should return QuizDetail", async () => {
        mockApi.get.mockResolvedValueOnce({ data: mockQuizDetail });

        const result = await fetchQuizDetail("quiz-1");

        expect(result).toEqual(mockQuizDetail);
      });

      it("fetchQuizDetail should call GET /api/v1/quiz/quizzes/:id", async () => {
        mockApi.get.mockResolvedValueOnce({ data: mockQuizDetail });

        await fetchQuizDetail("quiz-1");

        expect(mockApi.get).toHaveBeenCalledWith("/api/v1/quiz/quizzes/quiz-1");
      });
    });

    describe("startQuizAttempt", () => {
      it("should export startQuizAttempt function", () => {
        expect(typeof startQuizAttempt).toBe("function");
      });

      it("startQuizAttempt should return QuizAttempt", async () => {
        mockApi.post.mockResolvedValueOnce({ data: mockQuizAttempt });

        const result = await startQuizAttempt("quiz-1");

        expect(result).toEqual(mockQuizAttempt);
      });

      it("startQuizAttempt should call POST /api/v1/quiz/quizzes/:id/attempts", async () => {
        mockApi.post.mockResolvedValueOnce({ data: mockQuizAttempt });

        await startQuizAttempt("quiz-1");

        expect(mockApi.post).toHaveBeenCalledWith(
          "/api/v1/quiz/quizzes/quiz-1/attempts"
        );
      });
    });

    describe("saveDraftAnswers", () => {
      it("should export saveDraftAnswers function", () => {
        expect(typeof saveDraftAnswers).toBe("function");
      });

      it("saveDraftAnswers should accept quizId, attemptId, and answers", async () => {
        mockApi.put.mockResolvedValueOnce({ data: undefined });

        await saveDraftAnswers("quiz-1", "attempt-1", []);

        expect(mockApi.put).toHaveBeenCalledWith(
          "/api/v1/quiz/quizzes/quiz-1/attempts/attempt-1",
          { answers: [] }
        );
      });

      it("saveDraftAnswers should call PUT /api/v1/quiz/quizzes/:id/attempts/:attemptId", async () => {
        mockApi.put.mockResolvedValueOnce({ data: undefined });

        await saveDraftAnswers("quiz-1", "attempt-1", []);

        expect(mockApi.put).toHaveBeenCalledWith(
          "/api/v1/quiz/quizzes/quiz-1/attempts/attempt-1",
          expect.any(Object)
        );
      });
    });

    describe("submitQuizAttempt", () => {
      it("should export submitQuizAttempt function", () => {
        expect(typeof submitQuizAttempt).toBe("function");
      });

      it("submitQuizAttempt should return QuizModuleResult", async () => {
        mockApi.post.mockResolvedValueOnce({ data: mockQuizResult });

        const result = await submitQuizAttempt("quiz-1", "attempt-1");

        expect(result).toEqual(mockQuizResult);
      });

      it("submitQuizAttempt should call POST /api/v1/quiz/quizzes/:id/attempts/:attemptId/submit", async () => {
        mockApi.post.mockResolvedValueOnce({ data: mockQuizResult });

        await submitQuizAttempt("quiz-1", "attempt-1");

        expect(mockApi.post).toHaveBeenCalledWith(
          "/api/v1/quiz/quizzes/quiz-1/attempts/attempt-1/submit"
        );
      });
    });

    describe("fetchQuizResult", () => {
      it("should export fetchQuizResult function", () => {
        expect(typeof fetchQuizResult).toBe("function");
      });

      it("fetchQuizResult should return QuizModuleResult", async () => {
        mockApi.get.mockResolvedValueOnce({ data: mockQuizResult });

        const result = await fetchQuizResult("quiz-1", "attempt-1");

        expect(result).toEqual(mockQuizResult);
      });

      it("fetchQuizResult should call GET /api/v1/quiz/quizzes/:id/attempts/:attemptId/results", async () => {
        mockApi.get.mockResolvedValueOnce({ data: mockQuizResult });

        await fetchQuizResult("quiz-1", "attempt-1");

        expect(mockApi.get).toHaveBeenCalledWith(
          "/api/v1/quiz/quizzes/quiz-1/attempts/attempt-1/results"
        );
      });
    });
  });

  describe("Instructor API Functions", () => {
    describe("fetchInstructorQuizzes", () => {
      it("should export fetchInstructorQuizzes function", () => {
        expect(typeof fetchInstructorQuizzes).toBe("function");
      });

      it("fetchInstructorQuizzes should return PaginatedResponse<QuizListItem>", async () => {
        mockApi.get.mockResolvedValueOnce({ data: mockPaginatedResponse });

        const result = await fetchInstructorQuizzes();

        expect(result).toEqual(mockPaginatedResponse);
      });
    });

    describe("createQuiz", () => {
      it("should export createQuiz function", () => {
        expect(typeof createQuiz).toBe("function");
      });

      it("createQuiz should return QuizDetail", async () => {
        mockApi.post.mockResolvedValueOnce({ data: mockQuizDetail });

        const result = await createQuiz({
          title: "New Quiz",
          courseId: "course-1",
          allowReattempt: false,
          shuffleQuestions: true,
          showAnswersAfterSubmit: true,
          focusLossWarning: false,
        });

        expect(result).toEqual(mockQuizDetail);
      });

      it("createQuiz should call POST /api/v1/quiz/quizzes", async () => {
        mockApi.post.mockResolvedValueOnce({ data: mockQuizDetail });

        await createQuiz({
          title: "New Quiz",
          courseId: "course-1",
          allowReattempt: false,
          shuffleQuestions: true,
          showAnswersAfterSubmit: true,
          focusLossWarning: false,
        });

        expect(mockApi.post).toHaveBeenCalledWith(
          "/api/v1/quiz/quizzes",
          expect.any(Object)
        );
      });
    });

    describe("updateQuiz", () => {
      it("should export updateQuiz function", () => {
        expect(typeof updateQuiz).toBe("function");
      });

      it("updateQuiz should return QuizDetail", async () => {
        mockApi.put.mockResolvedValueOnce({ data: mockQuizDetail });

        const result = await updateQuiz("quiz-1", { title: "Updated Quiz" });

        expect(result).toEqual(mockQuizDetail);
      });

      it("updateQuiz should call PUT /api/v1/quiz/quizzes/:id", async () => {
        mockApi.put.mockResolvedValueOnce({ data: mockQuizDetail });

        await updateQuiz("quiz-1", { title: "Updated Quiz" });

        expect(mockApi.put).toHaveBeenCalledWith(
          "/api/v1/quiz/quizzes/quiz-1",
          { title: "Updated Quiz" }
        );
      });
    });

    describe("deleteQuiz", () => {
      it("should export deleteQuiz function", () => {
        expect(typeof deleteQuiz).toBe("function");
      });

      it("deleteQuiz should call DELETE /api/v1/quiz/quizzes/:id", async () => {
        mockApi.delete.mockResolvedValueOnce({ data: undefined });

        await deleteQuiz("quiz-1");

        expect(mockApi.delete).toHaveBeenCalledWith(
          "/api/v1/quiz/quizzes/quiz-1"
        );
      });
    });

    describe("publishQuiz", () => {
      it("should export publishQuiz function", () => {
        expect(typeof publishQuiz).toBe("function");
      });

      it("publishQuiz should call POST /api/v1/quiz/quizzes/:id/publish", async () => {
        mockApi.post.mockResolvedValueOnce({ data: undefined });

        await publishQuiz("quiz-1");

        expect(mockApi.post).toHaveBeenCalledWith(
          "/api/v1/quiz/quizzes/quiz-1/publish"
        );
      });
    });

    describe("closeQuiz", () => {
      it("should export closeQuiz function", () => {
        expect(typeof closeQuiz).toBe("function");
      });

      it("closeQuiz should call POST /api/v1/quiz/quizzes/:id/close", async () => {
        mockApi.post.mockResolvedValueOnce({ data: undefined });

        await closeQuiz("quiz-1");

        expect(mockApi.post).toHaveBeenCalledWith(
          "/api/v1/quiz/quizzes/quiz-1/close"
        );
      });
    });

    describe("duplicateQuiz", () => {
      it("should export duplicateQuiz function", () => {
        expect(typeof duplicateQuiz).toBe("function");
      });

      it("duplicateQuiz should return QuizDetail", async () => {
        mockApi.post.mockResolvedValueOnce({ data: mockQuizDetail });

        const result = await duplicateQuiz("quiz-1");

        expect(result).toEqual(mockQuizDetail);
      });

      it("duplicateQuiz should call POST /api/v1/quiz/quizzes/:id/duplicate", async () => {
        mockApi.post.mockResolvedValueOnce({ data: mockQuizDetail });

        await duplicateQuiz("quiz-1");

        expect(mockApi.post).toHaveBeenCalledWith(
          "/api/v1/quiz/quizzes/quiz-1/duplicate"
        );
      });
    });

    describe("fetchSubmissions", () => {
      it("should export fetchSubmissions function", () => {
        expect(typeof fetchSubmissions).toBe("function");
      });

      it("fetchSubmissions should return QuizSubmissionSummary[]", async () => {
        mockApi.get.mockResolvedValueOnce({ data: [mockSubmissionSummary] });

        const result = await fetchSubmissions("quiz-1");

        expect(result).toHaveLength(1);
        const firstSubmission = result[0];
        expect(firstSubmission).toBeDefined();
        if (firstSubmission) {
          expect(firstSubmission.userName).toBe("John Doe");
        }
      });

      it("fetchSubmissions should call GET /api/v1/quiz/quizzes/:id/submissions", async () => {
        mockApi.get.mockResolvedValueOnce({ data: [mockSubmissionSummary] });

        await fetchSubmissions("quiz-1");

        expect(mockApi.get).toHaveBeenCalledWith(
          "/api/v1/quiz/quizzes/quiz-1/submissions"
        );
      });
    });

    describe("generateQuizWithAI", () => {
      it("should export generateQuizWithAI function", () => {
        expect(typeof generateQuizWithAI).toBe("function");
      });

      it("generateQuizWithAI should return GeneratedQuestion[]", async () => {
        mockApi.post.mockResolvedValueOnce({ data: [mockGeneratedQuestion] });

        const result = await generateQuizWithAI({
          materialIds: ["mat-1"],
          count: 10,
          difficulty: "medium",
          questionTypes: ["multiple_choice"],
        });

        expect(result).toHaveLength(1);
        const firstQuestion = result[0];
        expect(firstQuestion).toBeDefined();
        if (firstQuestion) {
          expect(firstQuestion.type).toBe("multiple_choice");
        }
      });

      it("generateQuizWithAI should call POST /api/v1/quiz/ai-generate", async () => {
        mockApi.post.mockResolvedValueOnce({ data: [mockGeneratedQuestion] });

        await generateQuizWithAI({
          materialIds: ["mat-1"],
          count: 10,
          difficulty: "medium",
          questionTypes: ["multiple_choice"],
        });

        expect(mockApi.post).toHaveBeenCalledWith(
          "/api/v1/quiz/ai-generate",
          expect.objectContaining({
            count: 10,
            difficulty: "medium",
          })
        );
      });
    });
  });

  describe("API Function Count", () => {
    it("should export exactly 15 API functions", () => {
      const exportedFunctions = [
        fetchQuizList,
        fetchQuizDetail,
        startQuizAttempt,
        saveDraftAnswers,
        submitQuizAttempt,
        fetchQuizResult,
        fetchInstructorQuizzes,
        createQuiz,
        updateQuiz,
        deleteQuiz,
        publishQuiz,
        closeQuiz,
        duplicateQuiz,
        fetchSubmissions,
        generateQuizWithAI,
      ];

      expect(exportedFunctions).toHaveLength(15);
      exportedFunctions.forEach((fn) => {
        expect(typeof fn).toBe("function");
      });
    });
  });
});
