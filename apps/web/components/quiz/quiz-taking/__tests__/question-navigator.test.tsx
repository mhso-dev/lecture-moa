/**
 * QuestionNavigator Component Tests
 * REQ-FE-613: Question Navigator
 *
 * Tests for question navigation sidebar/bottom sheet
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QuestionNavigator } from "../question-navigator";
import type { Question, DraftAnswer } from "@shared";

// Mock useMediaQuery
vi.mock("~/hooks/useMediaQuery", () => ({
  useMediaQuery: vi.fn(() => ({
    isMobile: false,
    isTablet: false,
    isDesktop: true,
    breakpoint: "desktop",
  })),
}));

// Mock Sheet component for mobile
vi.mock("~/components/ui/sheet", () => ({
  Sheet: ({
    children,
    open,
    onOpenChange,
  }: {
    children: React.ReactNode;
    open?: boolean;
    onOpenChange?: (open: boolean) => void;
  }) => (
    <div data-testid="sheet" data-open={open}>
      {onOpenChange && (
        <button onClick={() => { onOpenChange(!open); }}>Toggle Sheet</button>
      )}
      {children}
    </div>
  ),
  SheetTrigger: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="sheet-trigger">{children}</div>
  ),
  SheetContent: ({
    children,
    side,
  }: {
    children: React.ReactNode;
    side?: string;
  }) => (
    <div data-testid="sheet-content" data-side={side}>
      {children}
    </div>
  ),
  SheetHeader: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="sheet-header">{children}</div>
  ),
  SheetTitle: ({ children }: { children: React.ReactNode }) => (
    <h2 data-testid="sheet-title">{children}</h2>
  ),
}));

// Mock Button component
vi.mock("~/components/ui/button", () => ({
  Button: ({
    children,
    onClick,
    variant,
    size,
    className,
    disabled,
    "aria-label": ariaLabel,
    ...props
  }: {
    children: React.ReactNode;
    onClick?: () => void;
    variant?: string;
    size?: string;
    className?: string;
    disabled?: boolean;
    "aria-label"?: string;
  }) => (
    <button
      onClick={onClick}
      className={className}
      disabled={disabled}
      aria-label={ariaLabel}
      data-variant={variant}
      data-size={size}
      data-testid="button"
      {...props}
    >
      {children}
    </button>
  ),
}));

describe("QuestionNavigator", () => {
  const mockQuestions: Question[] = [
    {
      id: "q-1",
      quizId: "quiz-1",
      order: 1,
      questionText: "Question 1",
      points: 10,
      type: "multiple_choice",
      options: [
        { id: "opt-1", text: "A" },
        { id: "opt-2", text: "B" },
      ],
      correctOptionId: "opt-1",
      explanation: null,
    },
    {
      id: "q-2",
      quizId: "quiz-1",
      order: 2,
      questionText: "Question 2",
      points: 10,
      type: "true_false",
      correctAnswer: true,
      explanation: null,
    },
    {
      id: "q-3",
      quizId: "quiz-1",
      order: 3,
      questionText: "Question 3",
      points: 10,
      type: "short_answer",
      sampleAnswer: null,
      explanation: null,
    },
    {
      id: "q-4",
      quizId: "quiz-1",
      order: 4,
      questionText: "Question 4",
      points: 10,
      type: "fill_in_the_blank",
      blanks: [{ id: "b1", answer: "test" }],
      explanation: null,
    },
    {
      id: "q-5",
      quizId: "quiz-1",
      order: 5,
      questionText: "Question 5",
      points: 10,
      type: "multiple_choice",
      options: [
        { id: "opt-1", text: "A" },
        { id: "opt-2", text: "B" },
      ],
      correctOptionId: "opt-2",
      explanation: null,
    },
  ];

  const mockAnswers: Record<string, DraftAnswer> = {
    "q-1": {
      questionId: "q-1",
      type: "multiple_choice",
      selectedOptionId: "opt-1",
    },
    "q-3": {
      questionId: "q-3",
      type: "short_answer",
      text: "My answer",
    },
  };

  const mockOnNavigate = vi.fn();

  beforeEach(() => {
    mockOnNavigate.mockClear();
  });

  describe("desktop sidebar", () => {
    it("renders fixed sidebar on desktop", () => {
      render(
        <QuestionNavigator
          questions={mockQuestions}
          answers={mockAnswers}
          currentIndex={0}
          onNavigate={mockOnNavigate}
        />
      );

      // Should render as sidebar (not Sheet)
      expect(screen.queryByTestId("sheet")).not.toBeInTheDocument();
    });

    it("renders question buttons in grid", () => {
      render(
        <QuestionNavigator
          questions={mockQuestions}
          answers={mockAnswers}
          currentIndex={0}
          onNavigate={mockOnNavigate}
        />
      );

      const buttons = screen.getAllByTestId("button");
      expect(buttons).toHaveLength(5);
    });

    it("displays question numbers 1-5", () => {
      render(
        <QuestionNavigator
          questions={mockQuestions}
          answers={mockAnswers}
          currentIndex={0}
          onNavigate={mockOnNavigate}
        />
      );

      expect(screen.getByText("1")).toBeInTheDocument();
      expect(screen.getByText("2")).toBeInTheDocument();
      expect(screen.getByText("3")).toBeInTheDocument();
      expect(screen.getByText("4")).toBeInTheDocument();
      expect(screen.getByText("5")).toBeInTheDocument();
    });
  });

  describe("button states", () => {
    it("shows answered state for answered questions", () => {
      render(
        <QuestionNavigator
          questions={mockQuestions}
          answers={mockAnswers}
          currentIndex={0}
          onNavigate={mockOnNavigate}
        />
      );

      // Questions 1 and 3 are answered
      const buttons = screen.getAllByTestId("button");
      expect(buttons[0]).toHaveAttribute("data-variant", "default");
      expect(buttons[2]).toHaveAttribute("data-variant", "default");
    });

    it("shows unanswered state for unanswered questions", () => {
      render(
        <QuestionNavigator
          questions={mockQuestions}
          answers={mockAnswers}
          currentIndex={0}
          onNavigate={mockOnNavigate}
        />
      );

      // Questions 2, 4, 5 are unanswered
      const buttons = screen.getAllByTestId("button");
      expect(buttons[1]).toHaveAttribute("data-variant", "outline");
      expect(buttons[3]).toHaveAttribute("data-variant", "outline");
      expect(buttons[4]).toHaveAttribute("data-variant", "outline");
    });

    it("highlights current question", () => {
      render(
        <QuestionNavigator
          questions={mockQuestions}
          answers={mockAnswers}
          currentIndex={2}
          onNavigate={mockOnNavigate}
        />
      );

      // Question 3 is current - should have highlight class
      const buttons = screen.getAllByTestId("button");
      expect(buttons[2]).toHaveClass("ring-2");
    });
  });

  describe("navigation", () => {
    it("calls onNavigate with correct index when button clicked", async () => {
      const user = userEvent.setup();
      render(
        <QuestionNavigator
          questions={mockQuestions}
          answers={mockAnswers}
          currentIndex={0}
          onNavigate={mockOnNavigate}
        />
      );

      await user.click(screen.getByText("3"));

      expect(mockOnNavigate).toHaveBeenCalledWith(2);
    });

    it("calls onNavigate when clicking current question", async () => {
      const user = userEvent.setup();
      render(
        <QuestionNavigator
          questions={mockQuestions}
          answers={mockAnswers}
          currentIndex={0}
          onNavigate={mockOnNavigate}
        />
      );

      await user.click(screen.getByText("1"));

      expect(mockOnNavigate).toHaveBeenCalledWith(0);
    });
  });

  describe("mobile bottom sheet", () => {
    it("renders Sheet on mobile", async () => {
      const { useMediaQuery } = await import("~/hooks/useMediaQuery");
      vi.mocked(useMediaQuery).mockReturnValueOnce({
        isMobile: true,
        isTablet: false,
        isDesktop: false,
        breakpoint: "mobile",
      });

      render(
        <QuestionNavigator
          questions={mockQuestions}
          answers={mockAnswers}
          currentIndex={0}
          onNavigate={mockOnNavigate}
        />
      );

      expect(screen.getByTestId("sheet")).toBeInTheDocument();
    });

    it("renders Sheet with bottom position on mobile", async () => {
      const { useMediaQuery } = await import("~/hooks/useMediaQuery");
      vi.mocked(useMediaQuery).mockReturnValueOnce({
        isMobile: true,
        isTablet: false,
        isDesktop: false,
        breakpoint: "mobile",
      });

      render(
        <QuestionNavigator
          questions={mockQuestions}
          answers={mockAnswers}
          currentIndex={0}
          onNavigate={mockOnNavigate}
        />
      );

      expect(screen.getByTestId("sheet-content")).toHaveAttribute("data-side", "bottom");
    });

    it("shows trigger button on mobile", async () => {
      const { useMediaQuery } = await import("~/hooks/useMediaQuery");
      vi.mocked(useMediaQuery).mockReturnValueOnce({
        isMobile: true,
        isTablet: false,
        isDesktop: false,
        breakpoint: "mobile",
      });

      render(
        <QuestionNavigator
          questions={mockQuestions}
          answers={mockAnswers}
          currentIndex={0}
          onNavigate={mockOnNavigate}
        />
      );

      expect(screen.getByTestId("sheet-trigger")).toBeInTheDocument();
    });
  });

  describe("accessibility", () => {
    it("has aria-label with question number and status for answered", () => {
      render(
        <QuestionNavigator
          questions={mockQuestions}
          answers={mockAnswers}
          currentIndex={0}
          onNavigate={mockOnNavigate}
        />
      );

      // Question 1 is answered - check for aria-label containing answered
      const buttons = screen.getAllByTestId("button");
      const answeredButtons = buttons.filter((b) =>
        b.getAttribute("aria-label")?.includes("answered")
      );
      expect(answeredButtons.length).toBeGreaterThan(0);
    });

    it("has aria-label with question number and status for unanswered", () => {
      render(
        <QuestionNavigator
          questions={mockQuestions}
          answers={mockAnswers}
          currentIndex={0}
          onNavigate={mockOnNavigate}
        />
      );

      // Question 2 is unanswered
      const button2 = screen.getByLabelText("Question 2, unanswered");
      expect(button2).toBeInTheDocument();
    });

    it("has aria-label with current indicator for current question", () => {
      render(
        <QuestionNavigator
          questions={mockQuestions}
          answers={mockAnswers}
          currentIndex={1}
          onNavigate={mockOnNavigate}
        />
      );

      const button2 = screen.getByLabelText(/Question 2, unanswered, current/);
      expect(button2).toBeInTheDocument();
    });

    it("supports data-testid", () => {
      render(
        <QuestionNavigator
          questions={mockQuestions}
          answers={mockAnswers}
          currentIndex={0}
          onNavigate={mockOnNavigate}
          testId="question-navigator"
        />
      );

      expect(screen.getByTestId("question-navigator")).toBeInTheDocument();
    });

    it("has proper heading for navigator section", () => {
      render(
        <QuestionNavigator
          questions={mockQuestions}
          answers={mockAnswers}
          currentIndex={0}
          onNavigate={mockOnNavigate}
        />
      );

      expect(
        screen.getByRole("heading", { name: /questions/i, level: 3 })
      ).toBeInTheDocument();
    });
  });

  describe("edge cases", () => {
    it("handles empty questions array", () => {
      render(
        <QuestionNavigator
          questions={[]}
          answers={{}}
          currentIndex={0}
          onNavigate={mockOnNavigate}
        />
      );

      expect(screen.queryByTestId("button")).not.toBeInTheDocument();
    });

    it("handles no answers", () => {
      render(
        <QuestionNavigator
          questions={mockQuestions}
          answers={{}}
          currentIndex={0}
          onNavigate={mockOnNavigate}
        />
      );

      // All questions should be unanswered (outline variant)
      const buttons = screen.getAllByTestId("button");
      buttons.forEach((btn) => {
        expect(btn).toHaveAttribute("data-variant", "outline");
      });
    });

    it("handles all questions answered", () => {
      const allAnswered: Record<string, DraftAnswer> = {
        "q-1": { questionId: "q-1", type: "multiple_choice", selectedOptionId: "opt-1" },
        "q-2": { questionId: "q-2", type: "true_false", selectedAnswer: true },
        "q-3": { questionId: "q-3", type: "short_answer", text: "answer" },
        "q-4": { questionId: "q-4", type: "fill_in_the_blank", filledAnswers: { b1: "test" } },
        "q-5": { questionId: "q-5", type: "multiple_choice", selectedOptionId: "opt-1" },
      };

      render(
        <QuestionNavigator
          questions={mockQuestions}
          answers={allAnswered}
          currentIndex={0}
          onNavigate={mockOnNavigate}
        />
      );

      // All questions should be answered (default variant)
      const buttons = screen.getAllByTestId("button");
      buttons.forEach((btn) => {
        expect(btn).toHaveAttribute("data-variant", "default");
      });
    });
  });
});
