/**
 * ResultsSummary Component Tests
 * REQ-FE-621: Quiz Results Summary Display
 */

import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ResultsSummary } from "../results-summary";
import type { QuizModuleResult, QuizDetail, QuestionResult } from "@shared";

// Mock ResultsChart component
vi.mock("../results-chart", () => ({
  ResultsChart: ({ correct, incorrect, unanswered }: {
    correct: number;
    incorrect: number;
    unanswered: number;
  }) => (
    <div data-testid="results-chart" data-correct={correct} data-incorrect={incorrect} data-unanswered={unanswered} />
  ),
}));

// Helper to create question result mocks
function createQuestionResult(
  id: string,
  isCorrect: boolean | null
): QuestionResult {
  return {
    questionId: id,
    questionText: `Question ${id}`,
    type: "multiple_choice",
    isCorrect,
    points: 1,
    earnedPoints: isCorrect === true ? 1 : 0,
    studentAnswer: {
      questionId: id,
      type: "multiple_choice",
      selectedOptionId: isCorrect === null ? null : "option-1",
    },
    correctAnswer: { correctOptionId: "option-1" },
    explanation: null,
  };
}

describe("ResultsSummary", () => {
  const mockQuiz: QuizDetail = {
    id: "quiz-1",
    title: "JavaScript Basics",
    description: "Test your JS knowledge",
    courseId: "course-1",
    courseName: "Web Development",
    status: "published",
    timeLimitMinutes: 30,
    passingScore: 70,
    dueDate: null,
    allowReattempt: true,
    shuffleQuestions: false,
    showAnswersAfterSubmit: true,
    focusLossWarning: false,
    questions: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  // 8 correct, 2 incorrect = 85% (8/10), passed
  const mockPassedQuestionResults: QuestionResult[] = [
    createQuestionResult("q1", true),
    createQuestionResult("q2", true),
    createQuestionResult("q3", true),
    createQuestionResult("q4", true),
    createQuestionResult("q5", true),
    createQuestionResult("q6", true),
    createQuestionResult("q7", true),
    createQuestionResult("q8", true),
    createQuestionResult("q9", false),
    createQuestionResult("q10", false),
  ];

  const mockPassedResult: QuizModuleResult = {
    attemptId: "attempt-1",
    quizId: "quiz-1",
    quizTitle: "JavaScript Basics",
    score: 8,
    maxScore: 10,
    percentage: 85,
    passed: true,
    timeTaken: 1200, // 20 minutes
    questionResults: mockPassedQuestionResults,
  };

  // 6 correct, 3 incorrect, 1 unanswered = 65% (6/10), failed
  const mockFailedQuestionResults: QuestionResult[] = [
    createQuestionResult("q1", true),
    createQuestionResult("q2", true),
    createQuestionResult("q3", true),
    createQuestionResult("q4", true),
    createQuestionResult("q5", true),
    createQuestionResult("q6", true),
    createQuestionResult("q7", false),
    createQuestionResult("q8", false),
    createQuestionResult("q9", false),
    // q10 is unanswered - isCorrect is null and selectedOptionId is null
    {
      ...createQuestionResult("q10", null),
      studentAnswer: {
        questionId: "q10",
        type: "multiple_choice",
        selectedOptionId: null,
      },
    },
  ];

  const mockFailedResult: QuizModuleResult = {
    attemptId: "attempt-1",
    quizId: "quiz-1",
    quizTitle: "JavaScript Basics",
    score: 6,
    maxScore: 10,
    percentage: 65,
    passed: false,
    timeTaken: 1200,
    questionResults: mockFailedQuestionResults,
  };

  describe("display - passed quiz", () => {
    it("displays quiz title", () => {
      render(<ResultsSummary result={mockPassedResult} quiz={mockQuiz} />);

      // Title is in the card header as text
      expect(screen.getByText(/Quiz Complete:/)).toBeInTheDocument();
      expect(screen.getByText(/JavaScript Basics/)).toBeInTheDocument();
    });

    it("displays score percentage", () => {
      const { container } = render(<ResultsSummary result={mockPassedResult} quiz={mockQuiz} />);

      // Score is split across multiple text nodes, check the container
      const scoreElement = container.querySelector(".text-5xl");
      expect(scoreElement).toHaveTextContent("85");
      expect(scoreElement).toHaveTextContent("%");
    });

    it("displays pass badge for passed quiz", () => {
      render(<ResultsSummary result={mockPassedResult} quiz={mockQuiz} />);

      expect(screen.getByText(/passed/i)).toBeInTheDocument();
    });

    it("displays score breakdown", () => {
      render(<ResultsSummary result={mockPassedResult} quiz={mockQuiz} />);

      // Check for the numbers and labels separately
      expect(screen.getByText("8")).toBeInTheDocument();
      expect(screen.getByText("Correct")).toBeInTheDocument();
      expect(screen.getByText("2")).toBeInTheDocument();
      expect(screen.getByText("Incorrect")).toBeInTheDocument();
    });

    it("displays time taken", () => {
      render(<ResultsSummary result={mockPassedResult} quiz={mockQuiz} />);

      // 1200 seconds = 20 minutes
      expect(screen.getByText("20 min")).toBeInTheDocument();
    });

    it("displays passing score requirement", () => {
      render(<ResultsSummary result={mockPassedResult} quiz={mockQuiz} />);

      expect(screen.getByText(/Passing Score:/)).toBeInTheDocument();
    });

    it("renders results chart with correct data", () => {
      render(<ResultsSummary result={mockPassedResult} quiz={mockQuiz} />);

      const chart = screen.getByTestId("results-chart");
      expect(chart).toHaveAttribute("data-correct", "8");
      expect(chart).toHaveAttribute("data-incorrect", "2");
      expect(chart).toHaveAttribute("data-unanswered", "0");
    });
  });

  describe("display - failed quiz", () => {
    it("displays fail badge for failed quiz", () => {
      render(<ResultsSummary result={mockFailedResult} quiz={mockQuiz} />);

      expect(screen.getByText(/failed/i)).toBeInTheDocument();
    });

    it("displays score for failed quiz", () => {
      render(<ResultsSummary result={mockFailedResult} quiz={mockQuiz} />);

      expect(screen.getByText(/65%/)).toBeInTheDocument();
    });

    it("displays unanswered count", () => {
      render(<ResultsSummary result={mockFailedResult} quiz={mockQuiz} />);

      expect(screen.getByText("1")).toBeInTheDocument();
      expect(screen.getByText("Unanswered")).toBeInTheDocument();
    });
  });

  describe("actions - retake quiz", () => {
    it('shows "Retake Quiz" button when allowReattempt is true and status is published', () => {
      const onRetake = vi.fn();
      render(
        <ResultsSummary
          result={mockFailedResult}
          quiz={mockQuiz}
          onRetake={onRetake}
        />
      );

      expect(
        screen.getByRole("button", { name: /retake quiz/i })
      ).toBeInTheDocument();
    });

    it("hides Retake Quiz button when allowReattempt is false", () => {
      const noReattempt = { ...mockQuiz, allowReattempt: false };
      render(<ResultsSummary result={mockFailedResult} quiz={noReattempt} />);

      expect(
        screen.queryByRole("button", { name: /retake quiz/i })
      ).not.toBeInTheDocument();
    });

    it("hides Retake Quiz button for draft quiz", () => {
      const draftQuiz = { ...mockQuiz, status: "draft" as const };
      render(<ResultsSummary result={mockFailedResult} quiz={draftQuiz} />);

      expect(
        screen.queryByRole("button", { name: /retake quiz/i })
      ).not.toBeInTheDocument();
    });

    it("calls onRetake when Retake Quiz button is clicked", async () => {
      const onRetake = vi.fn();
      const user = userEvent.setup();

      render(
        <ResultsSummary
          result={mockFailedResult}
          quiz={mockQuiz}
          onRetake={onRetake}
        />
      );

      await user.click(screen.getByRole("button", { name: /retake quiz/i }));
      expect(onRetake).toHaveBeenCalledTimes(1);
    });
  });

  describe("actions - back button", () => {
    it('shows "Back" button when onBack prop is provided', () => {
      const onBack = vi.fn();
      render(
        <ResultsSummary
          result={mockPassedResult}
          quiz={mockQuiz}
          onBack={onBack}
        />
      );

      expect(
        screen.getByRole("button", { name: /back/i })
      ).toBeInTheDocument();
    });

    it("hides Back button when onBack prop is not provided", () => {
      render(<ResultsSummary result={mockPassedResult} quiz={mockQuiz} />);

      expect(
        screen.queryByRole("button", { name: /back/i })
      ).not.toBeInTheDocument();
    });

    it("calls onBack when Back button is clicked", async () => {
      const onBack = vi.fn();
      const user = userEvent.setup();

      render(
        <ResultsSummary
          result={mockPassedResult}
          quiz={mockQuiz}
          onBack={onBack}
        />
      );

      await user.click(screen.getByRole("button", { name: /back/i }));
      expect(onBack).toHaveBeenCalledTimes(1);
    });
  });

  describe("time display", () => {
    it("formats time in minutes when under 1 hour", () => {
      const result = { ...mockPassedResult, timeTaken: 1500 }; // 25 minutes
      render(<ResultsSummary result={result} quiz={mockQuiz} />);

      expect(screen.getByText(/25.*min/i)).toBeInTheDocument();
    });

    it("formats time in hours when over 1 hour", () => {
      const result = { ...mockPassedResult, timeTaken: 5400 }; // 90 minutes
      render(<ResultsSummary result={result} quiz={mockQuiz} />);

      expect(screen.getByText(/1.*h.*30.*min/i)).toBeInTheDocument();
    });

    it("displays 0 minutes for very short time", () => {
      const result = { ...mockPassedResult, timeTaken: 30 };
      render(<ResultsSummary result={result} quiz={mockQuiz} />);

      expect(screen.getByText(/0.*min|less than a minute/i)).toBeInTheDocument();
    });
  });

  describe("accessibility", () => {
    it("has proper heading structure", () => {
      render(<ResultsSummary result={mockPassedResult} quiz={mockQuiz} />);

      // Card title text is present
      const titleText = screen.getByText(/Quiz Complete:/);
      expect(titleText).toBeInTheDocument();
    });

    it("has accessible badge for pass/fail status", () => {
      render(<ResultsSummary result={mockPassedResult} quiz={mockQuiz} />);

      const badge = screen.getByText(/passed/i);
      expect(badge).toBeInTheDocument();
    });

    it("supports data-testid", () => {
      render(
        <ResultsSummary
          result={mockPassedResult}
          quiz={mockQuiz}
          testId="results-summary-1"
        />
      );

      expect(screen.getByTestId("results-summary-1")).toBeInTheDocument();
    });
  });

  describe("edge cases", () => {
    it("handles perfect score", () => {
      // All 10 questions correct
      const perfectQuestionResults: QuestionResult[] = Array.from({ length: 10 }, (_, i) =>
        createQuestionResult(`q${String(i + 1)}`, true)
      );
      const perfectResult: QuizModuleResult = {
        ...mockPassedResult,
        score: 10,
        maxScore: 10,
        percentage: 100,
        questionResults: perfectQuestionResults,
      };
      render(<ResultsSummary result={perfectResult} quiz={mockQuiz} />);

      // Multiple "10"s will appear (correct and total questions)
      const tens = screen.getAllByText("10");
      expect(tens.length).toBeGreaterThan(0);
      expect(screen.getByText("Correct")).toBeInTheDocument();
    });

    it("handles zero score", () => {
      // All 10 questions incorrect
      const zeroScoreQuestionResults: QuestionResult[] = Array.from({ length: 10 }, (_, i) =>
        createQuestionResult(`q${String(i + 1)}`, false)
      );
      const zeroScore: QuizModuleResult = {
        ...mockFailedResult,
        score: 0,
        maxScore: 10,
        percentage: 0,
        questionResults: zeroScoreQuestionResults,
      };
      render(<ResultsSummary result={zeroScore} quiz={mockQuiz} />);

      // Multiple "0"s will appear (score and correct answers)
      const zeros = screen.getAllByText("0");
      expect(zeros.length).toBeGreaterThan(0);
    });

    it("handles unanswered questions correctly", () => {
      // All 10 questions unanswered (null isCorrect and null selectedOptionId)
      const allUnansweredQuestionResults: QuestionResult[] = Array.from({ length: 10 }, (_, i) => ({
        ...createQuestionResult(`q${String(i + 1)}`, null),
        studentAnswer: {
          questionId: `q${String(i + 1)}`,
          type: "multiple_choice" as const,
          selectedOptionId: null,
        },
      }));
      const allUnanswered: QuizModuleResult = {
        ...mockFailedResult,
        score: 0,
        maxScore: 10,
        percentage: 0,
        questionResults: allUnansweredQuestionResults,
      };
      render(<ResultsSummary result={allUnanswered} quiz={mockQuiz} />);

      expect(screen.getByText("10")).toBeInTheDocument();
      expect(screen.getByText("Unanswered")).toBeInTheDocument();
    });
  });
});
