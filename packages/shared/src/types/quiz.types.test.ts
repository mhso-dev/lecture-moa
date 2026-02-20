/**
 * Quiz Types Tests - GREEN/REFACTOR Phase
 * REQ-FE-600: Quiz Domain Types
 *
 * These tests verify that types are correctly defined, exported,
 * and can be used at runtime.
 */

import { describe, it, expect } from "vitest";
import type {
  QuestionType,
  QuizStatus,
  AttemptStatus,
  BaseQuestion,
  MultipleChoiceQuestion,
  TrueFalseQuestion,
  ShortAnswerQuestion,
  FillInBlankQuestion,
  Question,
  DraftAnswer,
  QuizListItem,
  QuizDetail,
  QuizAttempt,
  QuestionResult,
  GeneratedQuestion,
  QuizSubmissionSummary,
  CreateQuizInput,
  GenerationOptions,
  QuizModuleResult,
} from "./quiz.types";

describe("Quiz Types - REQ-FE-600", () => {
  describe("Type Exports", () => {
    it("should export QuestionType", () => {
      const type: QuestionType = "multiple_choice";
      expect(type).toBe("multiple_choice");
    });

    it("should export QuizStatus", () => {
      const status: QuizStatus = "published";
      expect(status).toBe("published");
    });

    it("should export AttemptStatus", () => {
      const status: AttemptStatus = "in_progress";
      expect(status).toBe("in_progress");
    });
  });

  describe("BaseQuestion", () => {
    it("should require common fields", () => {
      const baseQuestion: BaseQuestion = {
        id: "q-1",
        quizId: "quiz-1",
        order: 1,
        questionText: "What is 2 + 2?",
        points: 10,
        explanation: "Basic arithmetic",
      };

      expect(baseQuestion.id).toBe("q-1");
      expect(baseQuestion.points).toBe(10);
      expect(baseQuestion.explanation).toBe("Basic arithmetic");
    });
  });

  describe("MultipleChoiceQuestion", () => {
    it("should extend BaseQuestion with multiple_choice type", () => {
      const mcq: MultipleChoiceQuestion = {
        id: "q-1",
        quizId: "quiz-1",
        order: 1,
        questionText: "What is 2 + 2?",
        points: 10,
        explanation: null,
        type: "multiple_choice",
        options: [
          { id: "opt-1", text: "3" },
          { id: "opt-2", text: "4" },
        ],
        correctOptionId: "opt-2",
      };

      expect(mcq.type).toBe("multiple_choice");
      expect(mcq.options).toHaveLength(2);
      expect(mcq.correctOptionId).toBe("opt-2");
    });
  });

  describe("TrueFalseQuestion", () => {
    it("should extend BaseQuestion with true_false type", () => {
      const tfq: TrueFalseQuestion = {
        id: "q-2",
        quizId: "quiz-1",
        order: 2,
        questionText: "The sky is blue.",
        points: 5,
        explanation: null,
        type: "true_false",
        correctAnswer: true,
      };

      expect(tfq.type).toBe("true_false");
      expect(tfq.correctAnswer).toBe(true);
    });
  });

  describe("ShortAnswerQuestion", () => {
    it("should extend BaseQuestion with short_answer type", () => {
      const saq: ShortAnswerQuestion = {
        id: "q-3",
        quizId: "quiz-1",
        order: 3,
        questionText: "Explain photosynthesis.",
        points: 20,
        explanation: "Key points: sunlight, chlorophyll, CO2, O2",
        type: "short_answer",
        sampleAnswer: "Photosynthesis is the process by which plants convert sunlight to energy.",
      };

      expect(saq.type).toBe("short_answer");
      expect(saq.sampleAnswer).toContain("Photosynthesis");
    });
  });

  describe("FillInBlankQuestion", () => {
    it("should extend BaseQuestion with fill_in_the_blank type", () => {
      const fibq: FillInBlankQuestion = {
        id: "q-4",
        quizId: "quiz-1",
        order: 4,
        questionText: "The capital of France is ___.",
        points: 5,
        explanation: null,
        type: "fill_in_the_blank",
        blanks: [{ id: "blank-1", answer: "Paris" }],
      };

      expect(fibq.type).toBe("fill_in_the_blank");
      expect(fibq.blanks).toHaveLength(1);
      // Safe: array index access after length assertion
      expect(fibq.blanks[0]?.answer).toBe("Paris");
    });
  });

  describe("Question Discriminated Union", () => {
    it("should narrow MultipleChoiceQuestion by type", () => {
      const question: Question = {
        id: "q-1",
        quizId: "quiz-1",
        order: 1,
        questionText: "What is 2 + 2?",
        points: 10,
        explanation: null,
        type: "multiple_choice",
        options: [
          { id: "opt-1", text: "3" },
          { id: "opt-2", text: "4" },
        ],
        correctOptionId: "opt-2",
      };

      // Test runtime narrowing behavior for discriminated union
      // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
      if (question.type === "multiple_choice") {
        expect(question.options).toBeDefined();
        expect(question.correctOptionId).toBe("opt-2");
      }
    });

    it("should narrow TrueFalseQuestion by type", () => {
      const question: Question = {
        id: "q-2",
        quizId: "quiz-1",
        order: 2,
        questionText: "The sky is blue.",
        points: 5,
        explanation: null,
        type: "true_false",
        correctAnswer: true,
      };

      // Test runtime narrowing behavior for discriminated union
      // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
      if (question.type === "true_false") {
        expect(question.correctAnswer).toBe(true);
      }
    });

    it("should narrow ShortAnswerQuestion by type", () => {
      const question: Question = {
        id: "q-3",
        quizId: "quiz-1",
        order: 3,
        questionText: "Explain photosynthesis.",
        points: 20,
        explanation: null,
        type: "short_answer",
        sampleAnswer: "Photosynthesis is...",
      };

      // Test runtime narrowing behavior for discriminated union
      // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
      if (question.type === "short_answer") {
        expect(question.sampleAnswer).toBeDefined();
      }
    });

    it("should narrow FillInBlankQuestion by type", () => {
      const question: Question = {
        id: "q-4",
        quizId: "quiz-1",
        order: 4,
        questionText: "The capital of France is ___.",
        points: 5,
        explanation: null,
        type: "fill_in_the_blank",
        blanks: [{ id: "blank-1", answer: "Paris" }],
      };

      // Test runtime narrowing behavior for discriminated union
      // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
      if (question.type === "fill_in_the_blank") {
        expect(question.blanks).toBeDefined();
      }
    });
  });

  describe("DraftAnswer Discriminated Union", () => {
    it("should support multiple_choice answer", () => {
      const answer: DraftAnswer = {
        questionId: "q-1",
        type: "multiple_choice",
        selectedOptionId: "opt-2",
      };

      // Test runtime narrowing behavior for discriminated union
      // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
      if (answer.type === "multiple_choice") {
        expect(answer.selectedOptionId).toBe("opt-2");
      }
    });

    it("should support true_false answer", () => {
      const answer: DraftAnswer = {
        questionId: "q-2",
        type: "true_false",
        selectedAnswer: true,
      };

      // Test runtime narrowing behavior for discriminated union
      // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
      if (answer.type === "true_false") {
        expect(answer.selectedAnswer).toBe(true);
      }
    });

    it("should support short_answer text", () => {
      const answer: DraftAnswer = {
        questionId: "q-3",
        type: "short_answer",
        text: "Photosynthesis is the process...",
      };

      // Test runtime narrowing behavior for discriminated union
      // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
      if (answer.type === "short_answer") {
        expect(answer.text).toContain("Photosynthesis");
      }
    });

    it("should support fill_in_the_blank answers", () => {
      const answer: DraftAnswer = {
        questionId: "q-4",
        type: "fill_in_the_blank",
        filledAnswers: { "blank-1": "Paris", "blank-2": "London" },
      };

      // Test runtime narrowing behavior for discriminated union
      // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
      if (answer.type === "fill_in_the_blank") {
        expect(answer.filledAnswers["blank-1"]).toBe("Paris");
      }
    });
  });

  describe("QuizListItem", () => {
    it("should include all required fields for list display", () => {
      const item: QuizListItem = {
        id: "quiz-1",
        title: "Midterm Quiz",
        courseId: "course-1",
        courseName: "Introduction to TypeScript",
        status: "published",
        questionCount: 10,
        timeLimitMinutes: 30,
        passingScore: 70,
        dueDate: "2024-12-31T23:59:59Z",
        attemptCount: 5,
        myLastAttemptScore: 85,
        createdAt: "2024-01-01T00:00:00Z",
      };

      expect(item.status).toBe("published");
      expect(item.timeLimitMinutes).toBe(30);
      expect(item.myLastAttemptScore).toBe(85);
    });
  });

  describe("QuizDetail", () => {
    it("should include all quiz configuration fields", () => {
      const detail: QuizDetail = {
        id: "quiz-1",
        title: "Midterm Quiz",
        description: "A comprehensive midterm quiz",
        courseId: "course-1",
        courseName: "Introduction to TypeScript",
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

      expect(detail.allowReattempt).toBe(false);
      expect(detail.shuffleQuestions).toBe(true);
      expect(detail.focusLossWarning).toBe(true);
    });
  });

  describe("QuizAttempt", () => {
    it("should track attempt state", () => {
      const attempt: QuizAttempt = {
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

      expect(attempt.status).toBe("in_progress");
      expect(attempt.score).toBeNull();
    });

    it("should track submitted attempt state", () => {
      const attempt: QuizAttempt = {
        id: "attempt-1",
        quizId: "quiz-1",
        userId: "user-1",
        status: "submitted",
        answers: [
          { questionId: "q-1", type: "multiple_choice", selectedOptionId: "opt-2" },
        ],
        startedAt: "2024-01-01T10:00:00Z",
        submittedAt: "2024-01-01T10:30:00Z",
        score: 85,
        passed: true,
      };

      expect(attempt.status).toBe("submitted");
      expect(attempt.score).toBe(85);
    });
  });

  describe("QuizModuleResult", () => {
    it("should include comprehensive result data", () => {
      const result: QuizModuleResult = {
        attemptId: "attempt-1",
        quizId: "quiz-1",
        quizTitle: "Midterm Quiz",
        score: 85,
        maxScore: 100,
        percentage: 85,
        passed: true,
        timeTaken: 1800,
        questionResults: [],
      };

      expect(result.percentage).toBe(85);
      expect(result.timeTaken).toBe(1800);
    });
  });

  describe("QuestionResult", () => {
    it("should include per-question result", () => {
      const qr: QuestionResult = {
        questionId: "q-1",
        questionText: "What is 2 + 2?",
        type: "multiple_choice",
        isCorrect: true,
        points: 10,
        earnedPoints: 10,
        studentAnswer: { questionId: "q-1", type: "multiple_choice", selectedOptionId: "opt-2" },
        correctAnswer: "opt-2",
        explanation: "Basic arithmetic",
      };

      expect(qr.isCorrect).toBe(true);
      expect(qr.earnedPoints).toBe(10);
    });

    it("should support null isCorrect for manual grading", () => {
      const qr: QuestionResult = {
        questionId: "q-3",
        questionText: "Explain photosynthesis.",
        type: "short_answer",
        isCorrect: null,
        points: 20,
        earnedPoints: 0,
        studentAnswer: { questionId: "q-3", type: "short_answer", text: "Some answer" },
        correctAnswer: null,
        explanation: null,
      };

      expect(qr.isCorrect).toBeNull();
    });
  });

  describe("GeneratedQuestion", () => {
    it("should support AI-generated MCQ structure", () => {
      const genQ: GeneratedQuestion = {
        tempId: "temp-1",
        type: "multiple_choice",
        questionText: "Generated question text?",
        options: [
          { id: "opt-1", text: "Option A" },
          { id: "opt-2", text: "Option B" },
        ],
        correctOptionId: "opt-2",
        explanation: null,
        points: 10,
      };

      expect(genQ.tempId).toBe("temp-1");
      expect(genQ.options).toHaveLength(2);
    });

    it("should support AI-generated true_false structure", () => {
      const genQ: GeneratedQuestion = {
        tempId: "temp-2",
        type: "true_false",
        questionText: "Generated true/false question?",
        correctAnswer: true,
        explanation: "Explanation here",
        points: 5,
      };

      expect(genQ.type).toBe("true_false");
      expect(genQ.correctAnswer).toBe(true);
    });
  });

  describe("QuizSubmissionSummary", () => {
    it("should include student submission info", () => {
      const summary: QuizSubmissionSummary = {
        userId: "user-1",
        userName: "John Doe",
        attemptId: "attempt-1",
        score: 85,
        percentage: 85,
        passed: true,
        submittedAt: "2024-01-01T11:00:00Z",
      };

      expect(summary.userName).toBe("John Doe");
      expect(summary.percentage).toBe(85);
    });
  });

  describe("CreateQuizInput", () => {
    it("should include all quiz creation fields", () => {
      const input: CreateQuizInput = {
        title: "New Quiz",
        description: "Quiz description",
        courseId: "course-1",
        timeLimitMinutes: 30,
        passingScore: 70,
        allowReattempt: false,
        shuffleQuestions: true,
        showAnswersAfterSubmit: true,
        focusLossWarning: true,
        dueDate: "2024-12-31T23:59:59Z",
      };

      expect(input.title).toBe("New Quiz");
      expect(input.allowReattempt).toBe(false);
    });

    it("should allow optional fields to be omitted", () => {
      const input: CreateQuizInput = {
        title: "Minimal Quiz",
        courseId: "course-1",
        allowReattempt: false,
        shuffleQuestions: false,
        showAnswersAfterSubmit: false,
        focusLossWarning: false,
      };

      expect(input.description).toBeUndefined();
      expect(input.timeLimitMinutes).toBeUndefined();
    });
  });

  describe("GenerationOptions", () => {
    it("should include AI generation configuration", () => {
      const options: GenerationOptions = {
        materialIds: ["mat-1", "mat-2"],
        count: 10,
        difficulty: "medium",
        questionTypes: ["multiple_choice", "true_false"],
      };

      expect(options.materialIds).toHaveLength(2);
      expect(options.difficulty).toBe("medium");
    });
  });
});
