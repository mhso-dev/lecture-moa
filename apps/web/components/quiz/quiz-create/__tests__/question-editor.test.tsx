/**
 * QuestionEditor Component Tests
 * REQ-FE-631: Question editing interface
 *
 * Tests cover:
 * - Shared fields (questionText, points, explanation)
 * - Type-specific fields for each question type
 */

import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { QuestionEditor } from "../question-editor";
import type { Question, GeneratedQuestion } from "@shared/types/quiz.types";

const mockMultipleChoiceQuestion: Question = {
  id: "q-1",
  quizId: "quiz-1",
  order: 0,
  type: "multiple_choice",
  questionText: "What is 2+2?",
  points: 10,
  options: [
    { id: "opt-1", text: "3" },
    { id: "opt-2", text: "4" },
  ],
  correctOptionId: "opt-2",
  explanation: "Basic math",
};

const mockTrueFalseQuestion: Question = {
  id: "q-2",
  quizId: "quiz-1",
  order: 1,
  type: "true_false",
  questionText: "Earth is flat",
  points: 5,
  correctAnswer: false,
  explanation: null,
};

const mockShortAnswerQuestion: Question = {
  id: "q-3",
  quizId: "quiz-1",
  order: 2,
  type: "short_answer",
  questionText: "What is the capital of France?",
  points: 10,
  sampleAnswer: "Paris",
  explanation: "Paris is the capital of France",
};

const mockFillInBlankQuestion: Question = {
  id: "q-4",
  quizId: "quiz-1",
  order: 3,
  type: "fill_in_the_blank",
  questionText: "The ___ is the largest planet in our solar system.",
  points: 10,
  blanks: [{ id: "blank-1", answer: "Jupiter" }],
  explanation: null,
};

const mockGeneratedQuestion: GeneratedQuestion = {
  tempId: "temp-1",
  type: "multiple_choice",
  questionText: "Generated question?",
  points: 5,
  options: [
    { id: "opt-a", text: "A" },
    { id: "opt-b", text: "B" },
  ],
  correctOptionId: "opt-a",
  explanation: null,
};

describe("QuestionEditor", () => {
  describe("REQ-FE-631: Shared Fields", () => {
    it("should render question text textarea", () => {
      render(
        <QuestionEditor
          question={mockMultipleChoiceQuestion}
          onChange={vi.fn()}
          index={0}
        />
      );

      expect(screen.getByLabelText(/question text/i)).toBeInTheDocument();
    });

    it("should render points input", () => {
      render(
        <QuestionEditor
          question={mockMultipleChoiceQuestion}
          onChange={vi.fn()}
          index={0}
        />
      );

      expect(screen.getByLabelText(/points/i)).toBeInTheDocument();
    });

    it("should render explanation textarea", () => {
      render(
        <QuestionEditor
          question={mockMultipleChoiceQuestion}
          onChange={vi.fn()}
          index={0}
        />
      );

      expect(screen.getByLabelText(/explanation/i)).toBeInTheDocument();
    });

    it("should display question index", () => {
      render(
        <QuestionEditor
          question={mockMultipleChoiceQuestion}
          onChange={vi.fn()}
          index={3}
        />
      );

      expect(screen.getByText(/question 4/i)).toBeInTheDocument();
    });
  });

  describe("REQ-FE-631: Multiple Choice Question", () => {
    it("should render options list", () => {
      render(
        <QuestionEditor
          question={mockMultipleChoiceQuestion}
          onChange={vi.fn()}
          index={0}
        />
      );

      // Check for options by their input values
      const inputs = screen.getAllByRole("textbox");
      const optionInputs = inputs.filter(
        (input) => (input as HTMLInputElement).value === "3" || (input as HTMLInputElement).value === "4"
      );
      expect(optionInputs.length).toBe(2);
    });

    it("should allow adding options", () => {
      render(
        <QuestionEditor
          question={mockMultipleChoiceQuestion}
          onChange={vi.fn()}
          index={0}
        />
      );

      expect(screen.getByRole("button", { name: /add option/i })).toBeInTheDocument();
    });

    it("should allow removing options", () => {
      render(
        <QuestionEditor
          question={mockMultipleChoiceQuestion}
          onChange={vi.fn()}
          index={0}
        />
      );

      // Each option should have a remove button
      const removeButtons = screen.getAllByRole("button", { name: /remove/i });
      expect(removeButtons.length).toBeGreaterThan(0);
    });

    it("should render correct answer selector", () => {
      render(
        <QuestionEditor
          question={mockMultipleChoiceQuestion}
          onChange={vi.fn()}
          index={0}
        />
      );

      // Check for the select trigger placeholder or the label
      expect(screen.getByText(/Correct Answer/i)).toBeInTheDocument();
    });
  });

  describe("REQ-FE-631: True/False Question", () => {
    it("should render true/false radio group", () => {
      render(
        <QuestionEditor
          question={mockTrueFalseQuestion}
          onChange={vi.fn()}
          index={0}
        />
      );

      expect(screen.getByLabelText(/true/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/false/i)).toBeInTheDocument();
    });

    it("should show selected correct answer", () => {
      render(
        <QuestionEditor
          question={mockTrueFalseQuestion}
          onChange={vi.fn()}
          index={0}
        />
      );

      // False should be selected since correctAnswer is false
      const falseRadio = screen.getByLabelText(/false/i);
      expect(falseRadio).toBeChecked();
    });
  });

  describe("REQ-FE-631: Short Answer Question", () => {
    it("should render sample answer textarea", () => {
      render(
        <QuestionEditor
          question={mockShortAnswerQuestion}
          onChange={vi.fn()}
          index={0}
        />
      );

      expect(screen.getByLabelText(/sample answer/i)).toBeInTheDocument();
    });
  });

  describe("REQ-FE-631: Fill in the Blank Question", () => {
    it("should render blank answer inputs", () => {
      render(
        <QuestionEditor
          question={mockFillInBlankQuestion}
          onChange={vi.fn()}
          index={0}
        />
      );

      expect(screen.getByLabelText(/blank 1/i)).toBeInTheDocument();
    });
  });

  describe("REQ-FE-631: onChange Handler", () => {
    it("should call onChange when question text changes", () => {
      const handleChange = vi.fn();
      render(
        <QuestionEditor
          question={mockMultipleChoiceQuestion}
          onChange={handleChange}
          index={0}
        />
      );

      const textarea = screen.getByLabelText(/question text/i);
      fireEvent.change(textarea, { target: { value: "New question" } });

      expect(handleChange).toHaveBeenCalled();
    });

    it("should call onChange when points change", () => {
      const handleChange = vi.fn();
      render(
        <QuestionEditor
          question={mockMultipleChoiceQuestion}
          onChange={handleChange}
          index={0}
        />
      );

      const pointsInput = screen.getByLabelText(/points/i);
      fireEvent.change(pointsInput, { target: { value: "20" } });

      expect(handleChange).toHaveBeenCalled();
    });
  });

  describe("REQ-FE-631: Delete Action", () => {
    it("should render delete button when onDelete provided", () => {
      render(
        <QuestionEditor
          question={mockMultipleChoiceQuestion}
          onChange={vi.fn()}
          onDelete={vi.fn()}
          index={0}
        />
      );

      expect(screen.getByRole("button", { name: /delete/i })).toBeInTheDocument();
    });

    it("should not render delete button when onDelete not provided", () => {
      render(
        <QuestionEditor
          question={mockMultipleChoiceQuestion}
          onChange={vi.fn()}
          index={0}
        />
      );

      expect(screen.queryByRole("button", { name: /delete/i })).not.toBeInTheDocument();
    });
  });

  describe("REQ-FE-631: Generated Question Support", () => {
    it("should render generated questions", () => {
      render(
        <QuestionEditor
          question={mockGeneratedQuestion}
          onChange={vi.fn()}
          index={0}
        />
      );

      expect(screen.getByText("Generated question?")).toBeInTheDocument();
    });
  });
});
