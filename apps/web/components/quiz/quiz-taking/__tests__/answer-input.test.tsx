/**
 * AnswerInput Component Tests
 * REQ-FE-612: Question Display - Answer Input Variants
 *
 * Tests for answer input variants by question type
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { AnswerInput } from "../answer-input";
import type {
  MultipleChoiceQuestion,
  TrueFalseQuestion,
  ShortAnswerQuestion,
  FillInBlankQuestion,
  MultipleChoiceDraftAnswer,
  TrueFalseDraftAnswer,
  ShortAnswerDraftAnswer,
  FillInBlankDraftAnswer,
} from "@shared";

// Mock RadioGroup component
vi.mock("~/components/ui/radio-group", () => ({
  RadioGroup: ({
    children,
    value,
    onValueChange,
    "aria-labelledby": ariaLabelledBy,
  }: {
    children: React.ReactNode;
    value?: string;
    onValueChange?: (value: string) => void;
    "aria-labelledby"?: string;
  }) => (
    <div
      role="radiogroup"
      aria-labelledby={ariaLabelledBy}
      data-value={value}
      data-testid="radio-group"
    >
      {children}
      {onValueChange && (
        <button onClick={() => { onValueChange("test-value"); }}>Trigger Change</button>
      )}
    </div>
  ),
  RadioGroupItem: ({
    value,
    id,
    children,
  }: {
    value: string;
    id?: string;
    children?: React.ReactNode;
  }) => (
    <input
      type="radio"
      value={value}
      id={id}
      data-testid={`radio-${value}`}
      aria-label={typeof children === "string" ? children : undefined}
    />
  ),
}));

// Mock Textarea component
vi.mock("~/components/ui/textarea", () => ({
  Textarea: ({
    value,
    onChange,
    placeholder,
    rows,
    "aria-labelledby": ariaLabelledBy,
    ...props
  }: {
    value?: string;
    onChange?: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
    placeholder?: string;
    rows?: number;
    "aria-labelledby"?: string;
  }) => (
    <textarea
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      rows={rows}
      aria-labelledby={ariaLabelledBy}
      data-testid="short-answer-textarea"
      {...props}
    />
  ),
}));

// Mock Input component
vi.mock("~/components/ui/input", () => ({
  Input: ({
    value,
    onChange,
    placeholder,
    "aria-label": ariaLabel,
    ...props
  }: {
    value?: string;
    onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
    placeholder?: string;
    "aria-label"?: string;
  }) => (
    <input
      type="text"
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      aria-label={ariaLabel}
      data-testid="fill-blank-input"
      {...props}
    />
  ),
}));

// Mock Label component
vi.mock("~/components/ui/label", () => ({
  Label: ({
    children,
    htmlFor,
  }: {
    children: React.ReactNode;
    htmlFor?: string;
  }) => (
    <label htmlFor={htmlFor} data-testid="label">
      {children}
    </label>
  ),
}));

describe("AnswerInput", () => {
  const baseQuestion = {
    id: "q-1",
    quizId: "quiz-1",
    order: 1,
    questionText: "Test question",
    points: 10,
    explanation: null,
  };

  const mockMCQQuestion: MultipleChoiceQuestion = {
    ...baseQuestion,
    type: "multiple_choice",
    options: [
      { id: "opt-1", text: "Option A" },
      { id: "opt-2", text: "Option B" },
      { id: "opt-3", text: "Option C" },
      { id: "opt-4", text: "Option D" },
    ],
    correctOptionId: "opt-2",
  };

  const mockTrueFalseQuestion: TrueFalseQuestion = {
    ...baseQuestion,
    type: "true_false",
    correctAnswer: true,
  };

  const mockShortAnswerQuestion: ShortAnswerQuestion = {
    ...baseQuestion,
    type: "short_answer",
    sampleAnswer: null,
  };

  const mockFillBlankQuestion: FillInBlankQuestion = {
    ...baseQuestion,
    type: "fill_in_the_blank",
    questionText: "The ___ is blue and the ___ is green.",
    blanks: [
      { id: "blank-1", answer: "sky" },
      { id: "blank-2", answer: "grass" },
    ],
  };

  const mockOnChange = vi.fn();

  beforeEach(() => {
    mockOnChange.mockClear();
  });

  describe("multiple_choice variant", () => {
    it("renders RadioGroup for multiple_choice", () => {
      render(
        <AnswerInput question={mockMCQQuestion} onChange={mockOnChange} />
      );

      expect(screen.getByRole("radiogroup")).toBeInTheDocument();
    });

    it("renders all options with A, B, C, D labels", () => {
      render(
        <AnswerInput question={mockMCQQuestion} onChange={mockOnChange} />
      );

      expect(screen.getByText("A")).toBeInTheDocument();
      expect(screen.getByText("B")).toBeInTheDocument();
      expect(screen.getByText("C")).toBeInTheDocument();
      expect(screen.getByText("D")).toBeInTheDocument();
    });

    it("renders option text", () => {
      render(
        <AnswerInput question={mockMCQQuestion} onChange={mockOnChange} />
      );

      expect(screen.getByText("Option A")).toBeInTheDocument();
      expect(screen.getByText("Option B")).toBeInTheDocument();
      expect(screen.getByText("Option C")).toBeInTheDocument();
      expect(screen.getByText("Option D")).toBeInTheDocument();
    });

    it("displays selected option when answer provided", () => {
      const answer: MultipleChoiceDraftAnswer = {
        questionId: "q-1",
        type: "multiple_choice",
        selectedOptionId: "opt-2",
      };

      render(
        <AnswerInput
          question={mockMCQQuestion}
          answer={answer}
          onChange={mockOnChange}
        />
      );

      const radioGroup = screen.getByRole("radiogroup");
      expect(radioGroup).toHaveAttribute("data-value", "opt-2");
    });

    it("calls onChange with correct answer type", async () => {
      const user = userEvent.setup();
      render(
        <AnswerInput question={mockMCQQuestion} onChange={mockOnChange} />
      );

      await user.click(screen.getByText("Trigger Change"));

      expect(mockOnChange).toHaveBeenCalledWith(
        expect.objectContaining({
          questionId: "q-1",
          type: "multiple_choice",
        })
      );
    });

    it("handles more than 4 options with E, F, G labels", () => {
      const longMCQQuestion: MultipleChoiceQuestion = {
        ...mockMCQQuestion,
        options: [
          { id: "opt-1", text: "Option A" },
          { id: "opt-2", text: "Option B" },
          { id: "opt-3", text: "Option C" },
          { id: "opt-4", text: "Option D" },
          { id: "opt-5", text: "Option E" },
          { id: "opt-6", text: "Option F" },
        ],
      };

      render(
        <AnswerInput question={longMCQQuestion} onChange={mockOnChange} />
      );

      // Check for labels A, B, C, D, E, F
      expect(screen.getByText("A")).toBeInTheDocument();
      expect(screen.getByText("B")).toBeInTheDocument();
      expect(screen.getByText("C")).toBeInTheDocument();
      expect(screen.getByText("D")).toBeInTheDocument();
      expect(screen.getByText("E")).toBeInTheDocument();
      expect(screen.getByText("F")).toBeInTheDocument();
    });
  });

  describe("true_false variant", () => {
    it("renders RadioGroup for true_false", () => {
      render(
        <AnswerInput question={mockTrueFalseQuestion} onChange={mockOnChange} />
      );

      expect(screen.getByRole("radiogroup")).toBeInTheDocument();
    });

    it("renders True and False options", () => {
      render(
        <AnswerInput question={mockTrueFalseQuestion} onChange={mockOnChange} />
      );

      expect(screen.getByText("True")).toBeInTheDocument();
      expect(screen.getByText("False")).toBeInTheDocument();
    });

    it("displays selected answer when True is selected", () => {
      const answer: TrueFalseDraftAnswer = {
        questionId: "q-1",
        type: "true_false",
        selectedAnswer: true,
      };

      render(
        <AnswerInput
          question={mockTrueFalseQuestion}
          answer={answer}
          onChange={mockOnChange}
        />
      );

      const radioGroup = screen.getByRole("radiogroup");
      expect(radioGroup).toHaveAttribute("data-value", "true");
    });

    it("displays selected answer when False is selected", () => {
      const answer: TrueFalseDraftAnswer = {
        questionId: "q-1",
        type: "true_false",
        selectedAnswer: false,
      };

      render(
        <AnswerInput
          question={mockTrueFalseQuestion}
          answer={answer}
          onChange={mockOnChange}
        />
      );

      const radioGroup = screen.getByRole("radiogroup");
      expect(radioGroup).toHaveAttribute("data-value", "false");
    });

    it("calls onChange with correct answer type", async () => {
      const user = userEvent.setup();
      render(
        <AnswerInput question={mockTrueFalseQuestion} onChange={mockOnChange} />
      );

      await user.click(screen.getByText("Trigger Change"));

      expect(mockOnChange).toHaveBeenCalledWith(
        expect.objectContaining({
          questionId: "q-1",
          type: "true_false",
        })
      );
    });
  });

  describe("short_answer variant", () => {
    it("renders Textarea for short_answer", () => {
      render(
        <AnswerInput question={mockShortAnswerQuestion} onChange={mockOnChange} />
      );

      expect(screen.getByTestId("short-answer-textarea")).toBeInTheDocument();
    });

    it("has minimum 3 rows", () => {
      render(
        <AnswerInput question={mockShortAnswerQuestion} onChange={mockOnChange} />
      );

      const textarea = screen.getByTestId("short-answer-textarea");
      expect(textarea).toHaveAttribute("rows", "3");
    });

    it("displays answer text when provided", () => {
      const answer: ShortAnswerDraftAnswer = {
        questionId: "q-1",
        type: "short_answer",
        text: "My answer",
      };

      render(
        <AnswerInput
          question={mockShortAnswerQuestion}
          answer={answer}
          onChange={mockOnChange}
        />
      );

      const textarea = screen.getByTestId("short-answer-textarea");
      expect(textarea).toHaveValue("My answer");
    });

    it("calls onChange when text changes", async () => {
      const user = userEvent.setup();
      render(
        <AnswerInput question={mockShortAnswerQuestion} onChange={mockOnChange} />
      );

      const textarea = screen.getByTestId("short-answer-textarea");
      await user.type(textarea, "test");

      expect(mockOnChange).toHaveBeenCalled();
    });

    it("calls onChange with correct answer type", async () => {
      const user = userEvent.setup();
      render(
        <AnswerInput question={mockShortAnswerQuestion} onChange={mockOnChange} />
      );

      const textarea = screen.getByTestId("short-answer-textarea");
      await user.type(textarea, "test answer");

      expect(mockOnChange).toHaveBeenCalledWith(
        expect.objectContaining({
          questionId: "q-1",
          type: "short_answer",
        })
      );
    });
  });

  describe("fill_in_the_blank variant", () => {
    it("renders inputs for each blank", () => {
      render(
        <AnswerInput question={mockFillBlankQuestion} onChange={mockOnChange} />
      );

      const inputs = screen.getAllByTestId("fill-blank-input");
      expect(inputs).toHaveLength(2);
    });

    it("replaces ___ placeholders with inputs", () => {
      render(
        <AnswerInput question={mockFillBlankQuestion} onChange={mockOnChange} />
      );

      // The text should be split around inputs - check for parts of the question text
      const inputs = screen.getAllByTestId("fill-blank-input");
      expect(inputs).toHaveLength(2);

      // Check that the container exists (parent of inputs)
      const container = inputs[0]?.parentElement;
      expect(container).toBeInTheDocument();
    });

    it("displays filled answers when provided", () => {
      const answer: FillInBlankDraftAnswer = {
        questionId: "q-1",
        type: "fill_in_the_blank",
        filledAnswers: {
          "blank-1": "sky",
          "blank-2": "grass",
        },
      };

      render(
        <AnswerInput
          question={mockFillBlankQuestion}
          answer={answer}
          onChange={mockOnChange}
        />
      );

      const inputs = screen.getAllByTestId("fill-blank-input");
      expect(inputs[0]).toHaveValue("sky");
      expect(inputs[1]).toHaveValue("grass");
    });

    it("calls onChange when blank is filled", async () => {
      const user = userEvent.setup();
      render(
        <AnswerInput question={mockFillBlankQuestion} onChange={mockOnChange} />
      );

      const inputs = screen.getAllByTestId("fill-blank-input");
      const firstInput = inputs[0];
      if (firstInput) {
        await user.type(firstInput, "s");
      }

      expect(mockOnChange).toHaveBeenCalled();
    });

    it("calls onChange with correct answer type", async () => {
      const user = userEvent.setup();
      render(
        <AnswerInput question={mockFillBlankQuestion} onChange={mockOnChange} />
      );

      const inputs = screen.getAllByTestId("fill-blank-input");
      const firstInput = inputs[0];
      if (firstInput) {
        await user.type(firstInput, "sky");
      }

      expect(mockOnChange).toHaveBeenCalledWith(
        expect.objectContaining({
          questionId: "q-1",
          type: "fill_in_the_blank",
          filledAnswers: expect.objectContaining({}) as Record<string, string>,
        })
      );
    });

    it("handles single blank", () => {
      const singleBlankQuestion: FillInBlankQuestion = {
        ...baseQuestion,
        type: "fill_in_the_blank",
        questionText: "The capital of France is ___.",
        blanks: [{ id: "blank-1", answer: "Paris" }],
      };

      render(
        <AnswerInput question={singleBlankQuestion} onChange={mockOnChange} />
      );

      const inputs = screen.getAllByTestId("fill-blank-input");
      expect(inputs).toHaveLength(1);
    });
  });

  describe("accessibility", () => {
    it("has aria-labelledby for radio groups", () => {
      render(
        <AnswerInput question={mockMCQQuestion} onChange={mockOnChange} />
      );

      expect(screen.getByRole("radiogroup")).toHaveAttribute("aria-labelledby");
    });

    it("has aria-label for fill blank inputs", () => {
      render(
        <AnswerInput question={mockFillBlankQuestion} onChange={mockOnChange} />
      );

      const inputs = screen.getAllByTestId("fill-blank-input");
      inputs.forEach((input, index) => {
        expect(input).toHaveAttribute("aria-label", `Blank ${String(index + 1)}`);
      });
    });

    it("has aria-labelledby for textarea", () => {
      render(
        <AnswerInput question={mockShortAnswerQuestion} onChange={mockOnChange} />
      );

      const textarea = screen.getByTestId("short-answer-textarea");
      expect(textarea).toHaveAttribute("aria-labelledby");
    });

    it("supports data-testid", () => {
      render(
        <AnswerInput
          question={mockMCQQuestion}
          onChange={mockOnChange}
          testId="answer-input-1"
        />
      );

      expect(screen.getByTestId("answer-input-1")).toBeInTheDocument();
    });
  });
});
