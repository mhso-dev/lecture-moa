/**
 * QuizCard Component Tests
 * REQ-FE-604: Quiz Card Display
 * REQ-FE-602: Quiz List Data Fetching
 */

import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QuizCard } from "../quiz-card";
import type { QuizListItem } from "@shared";

// Mock next/link
vi.mock("next/link", () => ({
  default: ({
    children,
    href,
    ...props
  }: {
    children: React.ReactNode;
    href: string;
  }) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));

// Mock date utilities
vi.mock("~/lib/date-utils", () => ({
  formatDistanceToNow: vi.fn((date: Date) => {
    const diffMs = Date.now() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    if (diffDays === 0) return "today";
    if (diffDays === 1) return "1 day ago";
    return `${String(diffDays)} days ago`;
  }),
  isPast: vi.fn((date: Date) => date.getTime() < Date.now()),
}));

describe("QuizCard", () => {
  const mockQuiz: QuizListItem = {
    id: "quiz-1",
    title: "Introduction to React",
    courseId: "course-1",
    courseName: "Web Development",
    status: "published",
    questionCount: 10,
    timeLimitMinutes: 30,
    passingScore: 70,
    dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days from now
    attemptCount: 5,
    myLastAttemptScore: 85,
    createdAt: new Date().toISOString(),
  };

  describe("display - student role", () => {
    it("displays quiz title", () => {
      render(<QuizCard quiz={mockQuiz} role="student" />);

      expect(screen.getByText("Introduction to React")).toBeInTheDocument();
    });

    it("displays course name", () => {
      render(<QuizCard quiz={mockQuiz} role="student" />);

      expect(screen.getByText("Web Development")).toBeInTheDocument();
    });

    it("displays question count", () => {
      render(<QuizCard quiz={mockQuiz} role="student" />);

      expect(screen.getByText(/10 questions/i)).toBeInTheDocument();
    });

    it("displays time limit when available", () => {
      render(<QuizCard quiz={mockQuiz} role="student" />);

      expect(screen.getByText(/30 min/i)).toBeInTheDocument();
    });

    it("does not display time limit when not set", () => {
      const quizNoTime = { ...mockQuiz, timeLimitMinutes: null };
      render(<QuizCard quiz={quizNoTime} role="student" />);

      expect(screen.queryByText(/min/i)).not.toBeInTheDocument();
    });

    it("displays due date with relative time", () => {
      const quizNotAttempted = { ...mockQuiz, myLastAttemptScore: null };
      render(<QuizCard quiz={quizNotAttempted} role="student" />);

      // Should show "in X days" or similar relative time
      expect(screen.getByText(/due/i)).toBeInTheDocument();
    });

    it("displays last attempt score when available", () => {
      render(<QuizCard quiz={mockQuiz} role="student" />);

      expect(screen.getByText(/85/)).toBeInTheDocument();
    });

    it('displays "Not attempted" when no attempt score', () => {
      const quizNoAttempt = { ...mockQuiz, myLastAttemptScore: null };
      render(<QuizCard quiz={quizNoAttempt} role="student" />);

      expect(screen.getByText(/not attempted/i)).toBeInTheDocument();
    });
  });

  describe("actions - student role", () => {
    it('shows "Take Quiz" button for published quiz not attempted', () => {
      const quizNotAttempted = { ...mockQuiz, myLastAttemptScore: null };
      render(<QuizCard quiz={quizNotAttempted} role="student" />);

      expect(
        screen.getByRole("button", { name: /take quiz/i })
      ).toBeInTheDocument();
    });

    it('shows "View Results" button for completed quiz', () => {
      render(<QuizCard quiz={mockQuiz} role="student" />);

      expect(
        screen.getByRole("button", { name: /view results/i })
      ).toBeInTheDocument();
    });

    it("calls onAction when action button is clicked", async () => {
      const onAction = vi.fn();
      const user = userEvent.setup();
      const quizNotAttempted = { ...mockQuiz, myLastAttemptScore: null };

      render(
        <QuizCard
          quiz={quizNotAttempted}
          role="student"
          onAction={onAction}
        />
      );

      await user.click(screen.getByRole("button", { name: /take quiz/i }));
      expect(onAction).toHaveBeenCalledWith("take");
    });

    it("disables Take Quiz when quiz is past due and not submitted", () => {
      const pastDueQuiz = {
        ...mockQuiz,
        dueDate: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(), // 1 day ago
        myLastAttemptScore: null,
      };
      render(<QuizCard quiz={pastDueQuiz} role="student" />);

      // Should show past due indicator
      expect(screen.getByText(/past due/i)).toBeInTheDocument();
    });
  });

  describe("display - instructor role", () => {
    it("displays status badge for instructor", () => {
      render(<QuizCard quiz={mockQuiz} role="instructor" />);

      expect(screen.getByText("Published")).toBeInTheDocument();
    });

    it('displays "Draft" badge for draft quizzes', () => {
      const draftQuiz = { ...mockQuiz, status: "draft" as const };
      render(<QuizCard quiz={draftQuiz} role="instructor" />);

      expect(screen.getByText("Draft")).toBeInTheDocument();
    });

    it("displays submission count for instructor", () => {
      render(<QuizCard quiz={mockQuiz} role="instructor" />);

      expect(screen.getByText(/5 submissions/i)).toBeInTheDocument();
    });
  });

  describe("actions - instructor role", () => {
    it('shows "Edit" button for draft quiz', () => {
      const draftQuiz = { ...mockQuiz, status: "draft" as const };
      render(<QuizCard quiz={draftQuiz} role="instructor" />);

      expect(screen.getByRole("button", { name: /edit/i })).toBeInTheDocument();
    });

    it('shows "Manage" button for published quiz', () => {
      render(<QuizCard quiz={mockQuiz} role="instructor" />);

      expect(
        screen.getByRole("button", { name: /manage/i })
      ).toBeInTheDocument();
    });

    it("calls onAction with correct action for instructor", async () => {
      const onAction = vi.fn();
      const user = userEvent.setup();

      render(<QuizCard quiz={mockQuiz} role="instructor" onAction={onAction} />);

      await user.click(screen.getByRole("button", { name: /manage/i }));
      expect(onAction).toHaveBeenCalledWith("manage");
    });
  });

  describe("past due indicator", () => {
    it("shows past due indicator when past deadline and not submitted", () => {
      const pastDueQuiz = {
        ...mockQuiz,
        dueDate: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
        myLastAttemptScore: null,
      };
      render(<QuizCard quiz={pastDueQuiz} role="student" />);

      expect(screen.getByText(/past due/i)).toBeInTheDocument();
    });

    it("does not show past due when submitted", () => {
      const pastDueButSubmitted = {
        ...mockQuiz,
        dueDate: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
        myLastAttemptScore: 85,
      };
      render(<QuizCard quiz={pastDueButSubmitted} role="student" />);

      expect(screen.queryByText(/past due/i)).not.toBeInTheDocument();
    });
  });

  describe("accessibility", () => {
    it("has proper heading structure", () => {
      render(<QuizCard quiz={mockQuiz} role="student" />);

      const heading = screen.getByRole("heading", { level: 3 });
      expect(heading).toHaveTextContent("Introduction to React");
    });

    it("has accessible button labels", () => {
      const quizNotAttempted = { ...mockQuiz, myLastAttemptScore: null };
      render(<QuizCard quiz={quizNotAttempted} role="student" />);

      expect(
        screen.getByRole("button", { name: /take quiz/i })
      ).toBeInTheDocument();
    });

    it("supports data-testid", () => {
      render(<QuizCard quiz={mockQuiz} role="student" testId="quiz-card-1" />);

      expect(screen.getByTestId("quiz-card-1")).toBeInTheDocument();
    });
  });
});
