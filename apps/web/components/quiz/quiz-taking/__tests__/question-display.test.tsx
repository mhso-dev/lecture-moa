/**
 * QuestionDisplay Component Tests
 * REQ-FE-612: Question Display
 *
 * Tests for rendering questions with different types and lightweight Markdown
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QuestionDisplay } from "../question-display";
import type {
  Question,
  DraftAnswer,
  MultipleChoiceQuestion,
  TrueFalseQuestion,
  ShortAnswerQuestion,
  FillInBlankQuestion,
} from "@shared";

// Mock the AnswerInput component
vi.mock("../answer-input", () => ({
  AnswerInput: ({
    question,
    answer,
    onChange,
  }: {
    question: Question;
    answer?: DraftAnswer;
    onChange: (answer: DraftAnswer) => void;
  }) => (
    <div data-testid="answer-input">
      <span data-testid="question-type">{question.type}</span>
      <button
        onClick={() => {
          onChange({
            questionId: question.id,
            type: question.type,
            selectedOptionId: "option-1",
          } as DraftAnswer);
        }}
      >
        Mock Answer Change
      </button>
      <span data-testid="current-answer">{JSON.stringify(answer)}</span>
    </div>
  ),
}));

describe("QuestionDisplay", () => {
  const baseQuestion = {
    id: "q-1",
    quizId: "quiz-1",
    order: 1,
    points: 10,
    explanation: "This is the explanation text",
  };

  const mockMCQQuestion: MultipleChoiceQuestion = {
    ...baseQuestion,
    type: "multiple_choice",
    questionText: "What is 2 + 2?",
    options: [
      { id: "opt-1", text: "3" },
      { id: "opt-2", text: "4" },
      { id: "opt-3", text: "5" },
    ],
    correctOptionId: "opt-2",
  };

  const mockTrueFalseQuestion: TrueFalseQuestion = {
    ...baseQuestion,
    type: "true_false",
    questionText: "The sky is blue.",
    correctAnswer: true,
  };

  const mockShortAnswerQuestion: ShortAnswerQuestion = {
    ...baseQuestion,
    type: "short_answer",
    questionText: "Explain photosynthesis.",
    sampleAnswer: "Process where plants convert light to energy",
  };

  const mockFillBlankQuestion: FillInBlankQuestion = {
    ...baseQuestion,
    type: "fill_in_the_blank",
    questionText: "The capital of France is ___.",
    blanks: [{ id: "blank-1", answer: "Paris" }],
  };

  const mockAnswer: DraftAnswer = {
    questionId: "q-1",
    type: "multiple_choice",
    selectedOptionId: "opt-2",
  };

  const mockOnChange = vi.fn();

  beforeEach(() => {
    mockOnChange.mockClear();
  });

  describe("question display", () => {
    it("displays question number", () => {
      render(
        <QuestionDisplay
          question={mockMCQQuestion}
          questionNumber={1}
          totalQuestions={10}
          onChange={mockOnChange}
        />
      );

      expect(screen.getByText("Question 1 of 10")).toBeInTheDocument();
    });

    it("displays question text", () => {
      render(
        <QuestionDisplay
          question={mockMCQQuestion}
          questionNumber={1}
          totalQuestions={10}
          onChange={mockOnChange}
        />
      );

      expect(screen.getByText("What is 2 + 2?")).toBeInTheDocument();
    });

    it("displays points", () => {
      render(
        <QuestionDisplay
          question={mockMCQQuestion}
          questionNumber={1}
          totalQuestions={10}
          onChange={mockOnChange}
        />
      );

      expect(screen.getByText(/10 points/i)).toBeInTheDocument();
    });

    it("displays singular point for 1 point", () => {
      const singlePointQuestion = { ...mockMCQQuestion, points: 1 };
      render(
        <QuestionDisplay
          question={singlePointQuestion}
          questionNumber={1}
          totalQuestions={10}
          onChange={mockOnChange}
        />
      );

      expect(screen.getByText(/1 point/i)).toBeInTheDocument();
    });
  });

  describe("lightweight markdown rendering", () => {
    it("renders bold text with <strong>", () => {
      const questionWithBold: MultipleChoiceQuestion = {
        ...mockMCQQuestion,
        questionText: "What is **important** here?",
      };

      render(
        <QuestionDisplay
          question={questionWithBold}
          questionNumber={1}
          totalQuestions={10}
          onChange={mockOnChange}
        />
      );

      expect(screen.getByText("important")).toHaveStyle({ fontWeight: "bold" });
    });

    it("renders italic text with <em>", () => {
      const questionWithItalic: MultipleChoiceQuestion = {
        ...mockMCQQuestion,
        questionText: "What is _emphasized_ here?",
      };

      render(
        <QuestionDisplay
          question={questionWithItalic}
          questionNumber={1}
          totalQuestions={10}
          onChange={mockOnChange}
        />
      );

      expect(screen.getByText("emphasized")).toHaveStyle({ fontStyle: "italic" });
    });

    it("renders inline code with <code>", () => {
      const questionWithCode: MultipleChoiceQuestion = {
        ...mockMCQQuestion,
        questionText: "Use the `console.log` function.",
      };

      render(
        <QuestionDisplay
          question={questionWithCode}
          questionNumber={1}
          totalQuestions={10}
          onChange={mockOnChange}
        />
      );

      expect(screen.getByText("console.log")).toBeInTheDocument();
      expect(screen.getByRole("code")).toBeInTheDocument();
    });

    it("renders links with <a>", () => {
      const questionWithLink: MultipleChoiceQuestion = {
        ...mockMCQQuestion,
        questionText: "See [documentation](https://example.com) for more.",
      };

      render(
        <QuestionDisplay
          question={questionWithLink}
          questionNumber={1}
          totalQuestions={10}
          onChange={mockOnChange}
        />
      );

      const link = screen.getByRole("link", { name: "documentation" });
      expect(link).toBeInTheDocument();
      expect(link).toHaveAttribute("href", "https://example.com");
      expect(link).toHaveAttribute("target", "_blank");
      expect(link).toHaveAttribute("rel", "noopener noreferrer");
    });

    it("handles multiple markdown elements", () => {
      const questionWithMultiple: MultipleChoiceQuestion = {
        ...mockMCQQuestion,
        questionText: "**Bold** and _italic_ and `code` text.",
      };

      render(
        <QuestionDisplay
          question={questionWithMultiple}
          questionNumber={1}
          totalQuestions={10}
          onChange={mockOnChange}
        />
      );

      expect(screen.getByText("Bold")).toHaveStyle({ fontWeight: "bold" });
      expect(screen.getByText("italic")).toHaveStyle({ fontStyle: "italic" });
      expect(screen.getByText("code")).toBeInTheDocument();
    });
  });

  describe("answer input integration", () => {
    it("renders AnswerInput component", () => {
      render(
        <QuestionDisplay
          question={mockMCQQuestion}
          questionNumber={1}
          totalQuestions={10}
          onChange={mockOnChange}
        />
      );

      expect(screen.getByTestId("answer-input")).toBeInTheDocument();
    });

    it("passes question type to AnswerInput", () => {
      render(
        <QuestionDisplay
          question={mockMCQQuestion}
          questionNumber={1}
          totalQuestions={10}
          onChange={mockOnChange}
        />
      );

      expect(screen.getByTestId("question-type")).toHaveTextContent("multiple_choice");
    });

    it("passes answer to AnswerInput when provided", () => {
      render(
        <QuestionDisplay
          question={mockMCQQuestion}
          questionNumber={1}
          totalQuestions={10}
          answer={mockAnswer}
          onChange={mockOnChange}
        />
      );

      expect(screen.getByTestId("current-answer")).toHaveTextContent(
        JSON.stringify(mockAnswer)
      );
    });

    it("calls onChange when AnswerInput changes", async () => {
      const user = userEvent.setup();
      render(
        <QuestionDisplay
          question={mockMCQQuestion}
          questionNumber={1}
          totalQuestions={10}
          onChange={mockOnChange}
        />
      );

      await user.click(screen.getByText("Mock Answer Change"));

      expect(mockOnChange).toHaveBeenCalled();
    });
  });

  describe("question types", () => {
    it("renders multiple_choice question", () => {
      render(
        <QuestionDisplay
          question={mockMCQQuestion}
          questionNumber={1}
          totalQuestions={10}
          onChange={mockOnChange}
        />
      );

      expect(screen.getByTestId("question-type")).toHaveTextContent("multiple_choice");
    });

    it("renders true_false question", () => {
      render(
        <QuestionDisplay
          question={mockTrueFalseQuestion}
          questionNumber={1}
          totalQuestions={10}
          onChange={mockOnChange}
        />
      );

      expect(screen.getByTestId("question-type")).toHaveTextContent("true_false");
    });

    it("renders short_answer question", () => {
      render(
        <QuestionDisplay
          question={mockShortAnswerQuestion}
          questionNumber={1}
          totalQuestions={10}
          onChange={mockOnChange}
        />
      );

      expect(screen.getByTestId("question-type")).toHaveTextContent("short_answer");
    });

    it("renders fill_in_the_blank question", () => {
      render(
        <QuestionDisplay
          question={mockFillBlankQuestion}
          questionNumber={1}
          totalQuestions={10}
          onChange={mockOnChange}
        />
      );

      expect(screen.getByTestId("question-type")).toHaveTextContent("fill_in_the_blank");
    });
  });

  describe("accessibility", () => {
    it("has proper heading structure for question", () => {
      render(
        <QuestionDisplay
          question={mockMCQQuestion}
          questionNumber={1}
          totalQuestions={10}
          onChange={mockOnChange}
        />
      );

      expect(screen.getByRole("heading", { level: 2 })).toBeInTheDocument();
    });

    it("has aria-label for question number", () => {
      render(
        <QuestionDisplay
          question={mockMCQQuestion}
          questionNumber={1}
          totalQuestions={10}
          onChange={mockOnChange}
        />
      );

      expect(screen.getByLabelText(/question 1 of 10/i)).toBeInTheDocument();
    });

    it("supports data-testid", () => {
      render(
        <QuestionDisplay
          question={mockMCQQuestion}
          questionNumber={1}
          totalQuestions={10}
          onChange={mockOnChange}
          testId="question-1"
        />
      );

      expect(screen.getByTestId("question-1")).toBeInTheDocument();
    });
  });
});
