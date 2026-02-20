/**
 * Quiz Zod Schemas Tests - GREEN/REFACTOR Phase
 * REQ-FE-601: Quiz Zod Schemas
 *
 * Tests for schema validation rules.
 */

import { describe, it, expect } from "vitest";
import {
  CreateQuizSchema,
  QuestionSchema,
  MultipleChoiceOptionSchema,
  GenerationOptionsSchema,
  DraftAnswerSchema,
  QuestionTypeSchema,
  DifficultySchema,
} from "./quiz.schema";

describe("Quiz Zod Schemas - REQ-FE-601", () => {
  describe("QuestionTypeSchema", () => {
    it("should accept valid question types", () => {
      expect(QuestionTypeSchema.parse("multiple_choice")).toBe("multiple_choice");
      expect(QuestionTypeSchema.parse("true_false")).toBe("true_false");
      expect(QuestionTypeSchema.parse("short_answer")).toBe("short_answer");
      expect(QuestionTypeSchema.parse("fill_in_the_blank")).toBe("fill_in_the_blank");
    });

    it("should reject invalid question types", () => {
      expect(() => QuestionTypeSchema.parse("invalid")).toThrow();
    });
  });

  describe("DifficultySchema", () => {
    it("should accept valid difficulty levels", () => {
      expect(DifficultySchema.parse("easy")).toBe("easy");
      expect(DifficultySchema.parse("medium")).toBe("medium");
      expect(DifficultySchema.parse("hard")).toBe("hard");
    });

    it("should reject invalid difficulty levels", () => {
      expect(() => DifficultySchema.parse("expert")).toThrow();
    });
  });

  describe("CreateQuizSchema", () => {
    const validInput = {
      title: "Test Quiz",
      courseId: "123e4567-e89b-12d3-a456-426614174000",
      allowReattempt: false,
      shuffleQuestions: true,
      showAnswersAfterSubmit: true,
      focusLossWarning: false,
    };

    it("should validate title with min 3 and max 200 characters", () => {
      const result = CreateQuizSchema.parse(validInput);
      expect(result.title).toBe("Test Quiz");
    });

    it("should reject title shorter than 3 characters", () => {
      expect(() => CreateQuizSchema.parse({ ...validInput, title: "ab" })).toThrow();
    });

    it("should reject title longer than 200 characters", () => {
      const longTitle = "a".repeat(201);
      expect(() => CreateQuizSchema.parse({ ...validInput, title: longTitle })).toThrow();
    });

    it("should validate optional description with max 1000 characters", () => {
      const result = CreateQuizSchema.parse({ ...validInput, description: "A test quiz description" });
      expect(result.description).toBe("A test quiz description");
    });

    it("should reject description longer than 1000 characters", () => {
      const longDescription = "a".repeat(1001);
      expect(() => CreateQuizSchema.parse({ ...validInput, description: longDescription })).toThrow();
    });

    it("should validate courseId as UUID", () => {
      const result = CreateQuizSchema.parse(validInput);
      expect(result.courseId).toBe("123e4567-e89b-12d3-a456-426614174000");
    });

    it("should reject invalid courseId format", () => {
      expect(() => CreateQuizSchema.parse({ ...validInput, courseId: "invalid-uuid" })).toThrow();
    });

    it("should validate timeLimitMinutes between 1 and 300", () => {
      const result = CreateQuizSchema.parse({ ...validInput, timeLimitMinutes: 30 });
      expect(result.timeLimitMinutes).toBe(30);
    });

    it("should reject timeLimitMinutes less than 1", () => {
      expect(() => CreateQuizSchema.parse({ ...validInput, timeLimitMinutes: 0 })).toThrow();
    });

    it("should reject timeLimitMinutes greater than 300", () => {
      expect(() => CreateQuizSchema.parse({ ...validInput, timeLimitMinutes: 301 })).toThrow();
    });

    it("should validate passingScore between 0 and 100", () => {
      const result = CreateQuizSchema.parse({ ...validInput, passingScore: 70 });
      expect(result.passingScore).toBe(70);
    });

    it("should reject passingScore less than 0", () => {
      expect(() => CreateQuizSchema.parse({ ...validInput, passingScore: -1 })).toThrow();
    });

    it("should reject passingScore greater than 100", () => {
      expect(() => CreateQuizSchema.parse({ ...validInput, passingScore: 101 })).toThrow();
    });

    it("should validate allowReattempt as boolean", () => {
      expect(CreateQuizSchema.parse({ ...validInput, allowReattempt: true }).allowReattempt).toBe(true);
      expect(CreateQuizSchema.parse({ ...validInput, allowReattempt: false }).allowReattempt).toBe(false);
    });

    it("should validate shuffleQuestions as boolean", () => {
      expect(CreateQuizSchema.parse({ ...validInput, shuffleQuestions: true }).shuffleQuestions).toBe(true);
      expect(CreateQuizSchema.parse({ ...validInput, shuffleQuestions: false }).shuffleQuestions).toBe(false);
    });

    it("should validate showAnswersAfterSubmit as boolean", () => {
      expect(CreateQuizSchema.parse({ ...validInput, showAnswersAfterSubmit: true }).showAnswersAfterSubmit).toBe(true);
    });

    it("should validate focusLossWarning as boolean", () => {
      expect(CreateQuizSchema.parse({ ...validInput, focusLossWarning: true }).focusLossWarning).toBe(true);
    });

    it("should validate optional dueDate as ISO date string", () => {
      const result = CreateQuizSchema.parse({ ...validInput, dueDate: "2024-12-31T23:59:59Z" });
      expect(result.dueDate).toBe("2024-12-31T23:59:59Z");
    });

    it("should accept valid complete input", () => {
      const completeInput = {
        title: "Complete Quiz",
        description: "Full description",
        courseId: "123e4567-e89b-12d3-a456-426614174000",
        timeLimitMinutes: 60,
        passingScore: 70,
        allowReattempt: true,
        shuffleQuestions: true,
        showAnswersAfterSubmit: true,
        focusLossWarning: true,
        dueDate: "2024-12-31T23:59:59Z",
      };

      const result = CreateQuizSchema.parse(completeInput);
      expect(result.title).toBe("Complete Quiz");
      expect(result.timeLimitMinutes).toBe(60);
    });
  });

  describe("QuestionSchema - Discriminated Union", () => {
    const baseFields = {
      id: "123e4567-e89b-12d3-a456-426614174001",
      quizId: "123e4567-e89b-12d3-a456-426614174000",
      order: 1,
      questionText: "What is 2 + 2?",
      points: 10,
      explanation: "Basic arithmetic",
    };

    it("should validate question type as discriminated union", () => {
      const mcq = {
        ...baseFields,
        type: "multiple_choice" as const,
        options: [
          { id: "123e4567-e89b-12d3-a456-426614174002", text: "3" },
          { id: "123e4567-e89b-12d3-a456-426614174003", text: "4" },
        ],
        correctOptionId: "123e4567-e89b-12d3-a456-426614174003",
      };

      const result = QuestionSchema.parse(mcq);
      expect(result.type).toBe("multiple_choice");
    });

    it("should validate questionText with min 5 and max 2000 characters", () => {
      const mcq = {
        ...baseFields,
        questionText: "Valid question text here",
        type: "multiple_choice" as const,
        options: [
          { id: "123e4567-e89b-12d3-a456-426614174002", text: "A" },
          { id: "123e4567-e89b-12d3-a456-426614174003", text: "B" },
        ],
        correctOptionId: "123e4567-e89b-12d3-a456-426614174003",
      };

      const result = QuestionSchema.parse(mcq);
      expect(result.questionText).toBe("Valid question text here");
    });

    it("should reject questionText shorter than 5 characters", () => {
      const mcq = {
        ...baseFields,
        questionText: "Hi",
        type: "multiple_choice" as const,
        options: [
          { id: "123e4567-e89b-12d3-a456-426614174002", text: "A" },
          { id: "123e4567-e89b-12d3-a456-426614174003", text: "B" },
        ],
        correctOptionId: "123e4567-e89b-12d3-a456-426614174003",
      };

      expect(() => QuestionSchema.parse(mcq)).toThrow();
    });

    it("should validate points between 1 and 100", () => {
      const mcq = {
        ...baseFields,
        points: 50,
        type: "multiple_choice" as const,
        options: [
          { id: "123e4567-e89b-12d3-a456-426614174002", text: "A" },
          { id: "123e4567-e89b-12d3-a456-426614174003", text: "B" },
        ],
        correctOptionId: "123e4567-e89b-12d3-a456-426614174003",
      };

      const result = QuestionSchema.parse(mcq);
      expect(result.points).toBe(50);
    });

    it("should validate optional explanation with max 2000 characters", () => {
      const mcq = {
        ...baseFields,
        explanation: "This is an explanation",
        type: "multiple_choice" as const,
        options: [
          { id: "123e4567-e89b-12d3-a456-426614174002", text: "A" },
          { id: "123e4567-e89b-12d3-a456-426614174003", text: "B" },
        ],
        correctOptionId: "123e4567-e89b-12d3-a456-426614174003",
      };

      const result = QuestionSchema.parse(mcq);
      expect(result.explanation).toBe("This is an explanation");
    });

    it("should validate multiple_choice question with options", () => {
      const mcq = {
        ...baseFields,
        type: "multiple_choice" as const,
        options: [
          { id: "123e4567-e89b-12d3-a456-426614174002", text: "Option A" },
          { id: "123e4567-e89b-12d3-a456-426614174003", text: "Option B" },
        ],
        correctOptionId: "123e4567-e89b-12d3-a456-426614174003",
      };

      const result = QuestionSchema.parse(mcq);
      if (result.type === "multiple_choice") {
        expect(result.options).toHaveLength(2);
        expect(result.correctOptionId).toBe("123e4567-e89b-12d3-a456-426614174003");
      }
    });

    it("should validate true_false question with correctAnswer", () => {
      const tfq = {
        ...baseFields,
        type: "true_false" as const,
        correctAnswer: true,
      };

      const result = QuestionSchema.parse(tfq);
      if (result.type === "true_false") {
        expect(result.correctAnswer).toBe(true);
      }
    });

    it("should validate short_answer question with sampleAnswer", () => {
      const saq = {
        ...baseFields,
        type: "short_answer" as const,
        sampleAnswer: "This is the expected answer",
      };

      const result = QuestionSchema.parse(saq);
      if (result.type === "short_answer") {
        expect(result.sampleAnswer).toBe("This is the expected answer");
      }
    });

    it("should validate fill_in_the_blank question with blanks", () => {
      const fibq = {
        ...baseFields,
        type: "fill_in_the_blank" as const,
        blanks: [
          { id: "blank-1", answer: "Paris" },
          { id: "blank-2", answer: "London" },
        ],
      };

      const result = QuestionSchema.parse(fibq);
      if (result.type === "fill_in_the_blank") {
        expect(result.blanks).toHaveLength(2);
      }
    });
  });

  describe("MultipleChoiceOptionSchema", () => {
    it("should validate option text with min 1 and max 500 characters", () => {
      const option = { id: "123e4567-e89b-12d3-a456-426614174000", text: "Valid option" };
      const result = MultipleChoiceOptionSchema.parse(option);
      expect(result.text).toBe("Valid option");
    });

    it("should reject empty option text", () => {
      const option = { id: "123e4567-e89b-12d3-a456-426614174000", text: "" };
      expect(() => MultipleChoiceOptionSchema.parse(option)).toThrow();
    });

    it("should reject option text longer than 500 characters", () => {
      const option = { id: "123e4567-e89b-12d3-a456-426614174000", text: "a".repeat(501) };
      expect(() => MultipleChoiceOptionSchema.parse(option)).toThrow();
    });
  });

  describe("GenerationOptionsSchema", () => {
    const validInput = {
      materialIds: ["123e4567-e89b-12d3-a456-426614174000"],
      count: 10,
      difficulty: "medium" as const,
      questionTypes: ["multiple_choice", "true_false"] as ("multiple_choice" | "true_false" | "short_answer" | "fill_in_the_blank")[],
    };

    it("should validate materialIds as non-empty array of UUIDs", () => {
      const result = GenerationOptionsSchema.parse(validInput);
      expect(result.materialIds).toHaveLength(1);
    });

    it("should reject empty materialIds array", () => {
      expect(() => GenerationOptionsSchema.parse({ ...validInput, materialIds: [] })).toThrow();
    });

    it("should validate count between 1 and 50", () => {
      const result = GenerationOptionsSchema.parse(validInput);
      expect(result.count).toBe(10);
    });

    it("should reject count less than 1", () => {
      expect(() => GenerationOptionsSchema.parse({ ...validInput, count: 0 })).toThrow();
    });

    it("should reject count greater than 50", () => {
      expect(() => GenerationOptionsSchema.parse({ ...validInput, count: 51 })).toThrow();
    });

    it("should validate difficulty as easy | medium | hard", () => {
      expect(GenerationOptionsSchema.parse({ ...validInput, difficulty: "easy" }).difficulty).toBe("easy");
      expect(GenerationOptionsSchema.parse({ ...validInput, difficulty: "medium" }).difficulty).toBe("medium");
      expect(GenerationOptionsSchema.parse({ ...validInput, difficulty: "hard" }).difficulty).toBe("hard");
    });

    it("should validate questionTypes as non-empty array", () => {
      const result = GenerationOptionsSchema.parse(validInput);
      expect(result.questionTypes).toHaveLength(2);
    });

    it("should reject empty questionTypes array", () => {
      expect(() => GenerationOptionsSchema.parse({ ...validInput, questionTypes: [] })).toThrow();
    });
  });

  describe("DraftAnswerSchema - Discriminated Union", () => {
    it("should validate multiple_choice answer with selectedOptionId", () => {
      const answer = {
        questionId: "123e4567-e89b-12d3-a456-426614174001",
        type: "multiple_choice" as const,
        selectedOptionId: "123e4567-e89b-12d3-a456-426614174002",
      };

      const result = DraftAnswerSchema.parse(answer);
      if (result.type === "multiple_choice") {
        expect(result.selectedOptionId).toBe("123e4567-e89b-12d3-a456-426614174002");
      }
    });

    it("should validate true_false answer with selectedAnswer", () => {
      const answer = {
        questionId: "123e4567-e89b-12d3-a456-426614174001",
        type: "true_false" as const,
        selectedAnswer: true,
      };

      const result = DraftAnswerSchema.parse(answer);
      if (result.type === "true_false") {
        expect(result.selectedAnswer).toBe(true);
      }
    });

    it("should validate short_answer answer with text", () => {
      const answer = {
        questionId: "123e4567-e89b-12d3-a456-426614174001",
        type: "short_answer" as const,
        text: "This is my answer",
      };

      const result = DraftAnswerSchema.parse(answer);
      if (result.type === "short_answer") {
        expect(result.text).toBe("This is my answer");
      }
    });

    it("should validate fill_in_the_blank answer with filledAnswers", () => {
      const answer = {
        questionId: "123e4567-e89b-12d3-a456-426614174001",
        type: "fill_in_the_blank" as const,
        filledAnswers: { "blank-1": "Paris", "blank-2": "London" },
      };

      const result = DraftAnswerSchema.parse(answer);
      if (result.type === "fill_in_the_blank") {
        expect(result.filledAnswers["blank-1"]).toBe("Paris");
      }
    });

    it("should accept null selectedOptionId for multiple_choice", () => {
      const answer = {
        questionId: "123e4567-e89b-12d3-a456-426614174001",
        type: "multiple_choice" as const,
        selectedOptionId: null,
      };

      const result = DraftAnswerSchema.parse(answer);
      if (result.type === "multiple_choice") {
        expect(result.selectedOptionId).toBeNull();
      }
    });

    it("should accept null selectedAnswer for true_false", () => {
      const answer = {
        questionId: "123e4567-e89b-12d3-a456-426614174001",
        type: "true_false" as const,
        selectedAnswer: null,
      };

      const result = DraftAnswerSchema.parse(answer);
      if (result.type === "true_false") {
        expect(result.selectedAnswer).toBeNull();
      }
    });
  });
});
