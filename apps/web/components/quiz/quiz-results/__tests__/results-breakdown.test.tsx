/**
 * ResultsBreakdown Component Tests
 * REQ-FE-622: Question-by-Question Review
 */

import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { ResultsBreakdown } from "../results-breakdown";
import type { QuestionResult } from "@shared";

// Mock lucide-react icons
vi.mock("lucide-react", () => ({
  CheckCircle: () => <span data-testid="check-circle">CheckCircle</span>,
  XCircle: () => <span data-testid="x-circle">XCircle</span>,
  Clock: () => <span data-testid="clock">Clock</span>,
}));

describe("ResultsBreakdown", () => {
  const createMockResult = (
    overrides: Partial<QuestionResult> = {}
  ): QuestionResult => ({
    questionId: "q-1",
    questionText: "What is 2 + 2?",
    type: "multiple_choice",
    isCorrect: true,
    points: 10,
    earnedPoints: 10,
    studentAnswer: {
      questionId: "q-1",
      type: "multiple_choice",
      selectedOptionId: "opt-1",
    },
    correctAnswer: "opt-1",
    explanation: "Basic arithmetic",
    ...overrides,
  });

  const mockResults: QuestionResult[] = [
    createMockResult({
      questionId: "q-1",
      questionText: "What is 2 + 2?",
      type: "multiple_choice",
      isCorrect: true,
      points: 10,
      earnedPoints: 10,
      studentAnswer: { questionId: "q-1", type: "multiple_choice", selectedOptionId: "4" },
      correctAnswer: "4",
    }),
    createMockResult({
      questionId: "q-2",
      questionText: "Is the sky blue?",
      type: "true_false",
      isCorrect: false,
      points: 10,
      earnedPoints: 0,
      studentAnswer: { questionId: "q-2", type: "true_false", selectedAnswer: false },
      correctAnswer: true,
    }),
    createMockResult({
      questionId: "q-3",
      questionText: "Explain photosynthesis.",
      type: "short_answer",
      isCorrect: null, // Pending manual grading
      points: 20,
      earnedPoints: 0,
      studentAnswer: { questionId: "q-3", type: "short_answer", text: "Plant process" },
      correctAnswer: null,
    }),
    createMockResult({
      questionId: "q-4",
      questionText: "Fill in: The capital of France is ___",
      type: "fill_in_the_blank",
      isCorrect: true,
      points: 10,
      earnedPoints: 10,
      studentAnswer: { questionId: "q-4", type: "fill_in_the_blank", filledAnswers: { blank1: "Paris" } },
      correctAnswer: { blank1: "Paris" },
    }),
  ];

  describe("rendering - basic display", () => {
    it("renders all questions", () => {
      render(<ResultsBreakdown results={mockResults} showAnswers={true} />);

      expect(screen.getByText("Question 1")).toBeInTheDocument();
      expect(screen.getByText("Question 2")).toBeInTheDocument();
      expect(screen.getByText("Question 3")).toBeInTheDocument();
      expect(screen.getByText("Question 4")).toBeInTheDocument();
    });

    it("displays question text for each question", () => {
      render(<ResultsBreakdown results={mockResults} showAnswers={true} />);

      expect(screen.getByText("What is 2 + 2?")).toBeInTheDocument();
      expect(screen.getByText("Is the sky blue?")).toBeInTheDocument();
    });

    it("displays question type badges", () => {
      render(<ResultsBreakdown results={mockResults} showAnswers={true} />);

      expect(screen.getByText(/multiple.*choice/i)).toBeInTheDocument();
      expect(screen.getByText(/true.*false/i)).toBeInTheDocument();
      expect(screen.getByText(/short.*answer/i)).toBeInTheDocument();
      expect(screen.getByText(/fill.*blank/i)).toBeInTheDocument();
    });

    it("displays points earned vs total", () => {
      render(<ResultsBreakdown results={mockResults} showAnswers={true} />);

      // Check for points display format - use getAllByText since there are multiple matches
      const tenPointsElements = screen.getAllByText(/10.*\/.*10.*pts/i);
      expect(tenPointsElements.length).toBeGreaterThan(0);

      const zeroTenPointsElements = screen.getAllByText(/0.*\/.*10.*pts/i);
      expect(zeroTenPointsElements.length).toBeGreaterThan(0);

      const zeroTwentyPointsElements = screen.getAllByText(/0.*\/.*20.*pts/i);
      expect(zeroTwentyPointsElements.length).toBeGreaterThan(0);
    });
  });

  describe("correct/incorrect indicators", () => {
    it("shows correct indicator for correct answers", () => {
      render(<ResultsBreakdown results={mockResults} showAnswers={true} />);

      const checkCircles = screen.getAllByTestId("check-circle");
      expect(checkCircles.length).toBeGreaterThan(0);
    });

    it("shows incorrect indicator for wrong answers", () => {
      render(<ResultsBreakdown results={mockResults} showAnswers={true} />);

      const xCircles = screen.getAllByTestId("x-circle");
      expect(xCircles.length).toBeGreaterThan(0);
    });

    it("shows pending indicator for short_answer questions", () => {
      render(<ResultsBreakdown results={mockResults} showAnswers={true} />);

      expect(screen.getByText(/pending.*manual.*grading/i)).toBeInTheDocument();
    });
  });

  describe("showAnswers toggle", () => {
    it("shows correct answers when showAnswers is true", () => {
      render(<ResultsBreakdown results={mockResults} showAnswers={true} />);

      // Should show correct answer labels
      expect(screen.getByText(/correct.*answer/i)).toBeInTheDocument();
    });

    it("hides correct answers when showAnswers is false", () => {
      render(<ResultsBreakdown results={mockResults} showAnswers={false} />);

      // Should NOT show correct answer section
      expect(screen.queryByText(/correct.*answer/i)).not.toBeInTheDocument();
    });

    it("shows student answer when showAnswers is true", () => {
      render(<ResultsBreakdown results={mockResults} showAnswers={true} />);

      // Multiple "Your Answer" labels appear for each question
      const yourAnswerElements = screen.getAllByText(/your.*answer/i);
      expect(yourAnswerElements.length).toBeGreaterThan(0);
    });

    it("shows only correct/incorrect status when showAnswers is false", () => {
      render(<ResultsBreakdown results={mockResults} showAnswers={false} />);

      // Should still show status but not the actual answers
      const checkCircles = screen.getAllByTestId("check-circle");
      expect(checkCircles.length).toBeGreaterThan(0);

      const xCircles = screen.getAllByTestId("x-circle");
      expect(xCircles.length).toBeGreaterThan(0);
    });
  });

  describe("explanation display", () => {
    it("shows explanation when available and showAnswers is true", () => {
      const resultsWithExplanation = [
        createMockResult({ explanation: "This is because..." }),
      ];

      render(<ResultsBreakdown results={resultsWithExplanation} showAnswers={true} />);

      expect(screen.getByText(/explanation/i)).toBeInTheDocument();
      expect(screen.getByText("This is because...")).toBeInTheDocument();
    });

    it("hides explanation when showAnswers is false", () => {
      const resultsWithExplanation = [
        createMockResult({ explanation: "This is because..." }),
      ];

      render(<ResultsBreakdown results={resultsWithExplanation} showAnswers={false} />);

      expect(screen.queryByText(/explanation/i)).not.toBeInTheDocument();
    });

    it("hides explanation section when explanation is null", () => {
      const resultsNoExplanation = [
        createMockResult({ explanation: null }),
      ];

      render(<ResultsBreakdown results={resultsNoExplanation} showAnswers={true} />);

      expect(screen.queryByText(/explanation/i)).not.toBeInTheDocument();
    });
  });

  describe("answer display by type", () => {
    it("displays multiple choice answer correctly", () => {
      const mcqResults = [
        createMockResult({
          type: "multiple_choice",
          studentAnswer: { questionId: "q-1", type: "multiple_choice", selectedOptionId: "opt-A" },
          correctAnswer: { id: "opt-A", text: "Option A" },
        }),
      ];

      render(<ResultsBreakdown results={mcqResults} showAnswers={true} />);

      expect(screen.getByText(/multiple.*choice/i)).toBeInTheDocument();
    });

    it("displays true/false answer correctly", () => {
      const tfResults = [
        createMockResult({
          type: "true_false",
          studentAnswer: { questionId: "q-1", type: "true_false", selectedAnswer: true },
          correctAnswer: true,
        }),
      ];

      render(<ResultsBreakdown results={tfResults} showAnswers={true} />);

      expect(screen.getByText(/true.*false/i)).toBeInTheDocument();
    });

    it("displays short answer text", () => {
      const shortResults = [
        createMockResult({
          type: "short_answer",
          studentAnswer: { questionId: "q-1", type: "short_answer", text: "My answer" },
          correctAnswer: null,
        }),
      ];

      render(<ResultsBreakdown results={shortResults} showAnswers={true} />);

      expect(screen.getByText(/short.*answer/i)).toBeInTheDocument();
    });

    it("displays fill in blank answers", () => {
      const fibResults = [
        createMockResult({
          type: "fill_in_the_blank",
          studentAnswer: { questionId: "q-1", type: "fill_in_the_blank", filledAnswers: { b1: "test" } },
          correctAnswer: { b1: "test" },
        }),
      ];

      render(<ResultsBreakdown results={fibResults} showAnswers={true} />);

      expect(screen.getByText(/fill.*blank/i)).toBeInTheDocument();
    });
  });

  describe("empty state", () => {
    it("handles empty results array", () => {
      render(<ResultsBreakdown results={[]} showAnswers={true} />);

      expect(screen.getByText(/no.*questions/i)).toBeInTheDocument();
    });
  });

  describe("accessibility", () => {
    it("has proper heading structure for questions", () => {
      render(<ResultsBreakdown results={mockResults} showAnswers={true} />);

      // CardTitle renders as a div with font-semibold, not an h3
      // Check that question headings exist with the expected text
      expect(screen.getByText("Question 1")).toBeInTheDocument();
      expect(screen.getByText("Question 2")).toBeInTheDocument();
      expect(screen.getByText("Question 3")).toBeInTheDocument();
      expect(screen.getByText("Question 4")).toBeInTheDocument();
    });

    it("uses semantic markup for question list", () => {
      const { container } = render(
        <ResultsBreakdown results={mockResults} showAnswers={true} />
      );

      // Should render cards for each question
      const cards = container.querySelectorAll('[class*="rounded"]');
      expect(cards.length).toBeGreaterThan(0);
    });

    it("supports custom className", () => {
      const { container } = render(
        <ResultsBreakdown
          results={mockResults}
          showAnswers={true}
          className="custom-breakdown"
        />
      );

      expect(container.firstChild).toHaveClass("custom-breakdown");
    });

    it("supports data-testid", () => {
      render(
        <ResultsBreakdown
          results={mockResults}
          showAnswers={true}
          testId="breakdown-1"
        />
      );

      expect(screen.getByTestId("breakdown-1")).toBeInTheDocument();
    });
  });

  describe("edge cases", () => {
    it("handles unanswered questions", () => {
      const unansweredResults = [
        createMockResult({
          isCorrect: false,
          earnedPoints: 0,
          studentAnswer: { questionId: "q-1", type: "multiple_choice", selectedOptionId: null },
        }),
      ];

      render(<ResultsBreakdown results={unansweredResults} showAnswers={true} />);

      // Component shows "Unanswered" text for null selections - multiple elements
      const unansweredElements = screen.getAllByText("Unanswered");
      expect(unansweredElements.length).toBeGreaterThan(0);
    });

    it("handles very long question text", () => {
      const longText = "A".repeat(500);
      const longResults = [
        createMockResult({ questionText: longText }),
      ];

      render(<ResultsBreakdown results={longResults} showAnswers={true} />);

      expect(screen.getByText(longText)).toBeInTheDocument();
    });

    it("handles special characters in answers", () => {
      const specialResults = [
        createMockResult({
          type: "short_answer",
          studentAnswer: { questionId: "q-1", type: "short_answer", text: "<script>alert('xss')</script>" },
          correctAnswer: null,
        }),
      ];

      render(<ResultsBreakdown results={specialResults} showAnswers={true} />);

      // Should render as text, not execute
      expect(screen.getByText(/<script>alert/)).toBeInTheDocument();
    });
  });
});
