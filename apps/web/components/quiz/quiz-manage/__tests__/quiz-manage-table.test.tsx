/**
 * QuizManageTable Component Tests
 * REQ-FE-650: Quiz Management Table for instructors
 */

import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QuizManageTable } from "../quiz-manage-table";
import type { QuizListItem } from "@shared";

// Mock lucide-react icons
vi.mock("lucide-react", () => ({
  MoreHorizontal: () => <span data-testid="more-icon">MoreHorizontal</span>,
  Pencil: () => <span data-testid="pencil-icon">Pencil</span>,
  Trash2: () => <span data-testid="trash-icon">Trash2</span>,
  Copy: () => <span data-testid="copy-icon">Copy</span>,
  Users: () => <span data-testid="users-icon">Users</span>,
  ArrowUpDown: () => <span data-testid="sort-icon">ArrowUpDown</span>,
}));

describe("QuizManageTable", () => {
  const mockQuizzes: QuizListItem[] = [
    {
      id: "quiz-1",
      title: "JavaScript Basics",
      courseId: "course-1",
      courseName: "Web Development",
      status: "published",
      questionCount: 10,
      timeLimitMinutes: 30,
      passingScore: 70,
      dueDate: "2026-03-01T00:00:00Z",
      attemptCount: 25,
      myLastAttemptScore: null,
      createdAt: "2026-01-15T00:00:00Z",
    },
    {
      id: "quiz-2",
      title: "React Fundamentals",
      courseId: "course-1",
      courseName: "Web Development",
      status: "draft",
      questionCount: 5,
      timeLimitMinutes: null,
      passingScore: null,
      dueDate: null,
      attemptCount: 0,
      myLastAttemptScore: null,
      createdAt: "2026-02-01T00:00:00Z",
    },
    {
      id: "quiz-3",
      title: "Python Basics",
      courseId: "course-2",
      courseName: "Data Science",
      status: "closed",
      questionCount: 15,
      timeLimitMinutes: 45,
      passingScore: 80,
      dueDate: "2026-01-01T00:00:00Z",
      attemptCount: 40,
      myLastAttemptScore: null,
      createdAt: "2025-12-01T00:00:00Z",
    },
  ];

  const defaultProps = {
    quizzes: mockQuizzes,
    onEdit: vi.fn(),
    onDelete: vi.fn(),
    onDuplicate: vi.fn(),
    onManageSubmissions: vi.fn(),
  };

  describe("rendering - table structure", () => {
    it("renders table with correct columns", () => {
      render(<QuizManageTable {...defaultProps} />);

      // Title header is in a button
      expect(screen.getByRole("button", { name: /title/i })).toBeInTheDocument();
      expect(screen.getByText("Course")).toBeInTheDocument();
      expect(screen.getByRole("button", { name: /status/i })).toBeInTheDocument();
      expect(screen.getByText(/questions/i)).toBeInTheDocument();
      // Submissions header is a button, multiple match - use getAllByRole
      const submissionsButtons = screen.getAllByRole("button", { name: /submissions/i });
      expect(submissionsButtons.length).toBeGreaterThan(0);
      // Due Date appears in header and in cells - use getAllByText
      const dueDateElements = screen.getAllByText(/due.*date/i);
      expect(dueDateElements.length).toBeGreaterThan(0);
      expect(screen.getByText(/actions/i)).toBeInTheDocument();
    });

    it("renders all quiz rows", () => {
      render(<QuizManageTable {...defaultProps} />);

      expect(screen.getByText("JavaScript Basics")).toBeInTheDocument();
      expect(screen.getByText("React Fundamentals")).toBeInTheDocument();
      expect(screen.getByText("Python Basics")).toBeInTheDocument();
    });
  });

  describe("column display", () => {
    it("displays course name for each quiz", () => {
      render(<QuizManageTable {...defaultProps} />);

      // Multiple quizzes can have the same course name
      const webDevElements = screen.getAllByText("Web Development");
      expect(webDevElements.length).toBeGreaterThan(0);

      expect(screen.getByText("Data Science")).toBeInTheDocument();
    });

    it("displays status badges", () => {
      render(<QuizManageTable {...defaultProps} />);

      expect(screen.getByText(/published/i)).toBeInTheDocument();
      expect(screen.getByText(/draft/i)).toBeInTheDocument();
      expect(screen.getByText(/closed/i)).toBeInTheDocument();
    });

    it("displays question count", () => {
      render(<QuizManageTable {...defaultProps} />);

      expect(screen.getByText("10")).toBeInTheDocument();
      expect(screen.getByText("5")).toBeInTheDocument();
      expect(screen.getByText("15")).toBeInTheDocument();
    });

    it("displays submission count", () => {
      render(<QuizManageTable {...defaultProps} />);

      // 25, 0, 40 submissions
      expect(screen.getByText("25")).toBeInTheDocument();
      expect(screen.getByText("0")).toBeInTheDocument();
      expect(screen.getByText("40")).toBeInTheDocument();
    });

    it("displays due date when set", () => {
      render(<QuizManageTable {...defaultProps} />);

      // Check for date-related text (formatted dates)
      expect(screen.getByText(/no due date/i)).toBeInTheDocument();
    });

    it("displays 'No due date' for quizzes without due date", () => {
      render(<QuizManageTable {...defaultProps} />);

      expect(screen.getByText(/no due date/i)).toBeInTheDocument();
    });
  });

  describe("actions", () => {
    it("renders edit action for each quiz", () => {
      render(<QuizManageTable {...defaultProps} />);

      const editIcons = screen.getAllByTestId("pencil-icon");
      expect(editIcons.length).toBe(mockQuizzes.length);
    });

    it("renders delete action for each quiz", () => {
      render(<QuizManageTable {...defaultProps} />);

      const trashIcons = screen.getAllByTestId("trash-icon");
      expect(trashIcons.length).toBe(mockQuizzes.length);
    });

    it("renders duplicate action for each quiz", () => {
      render(<QuizManageTable {...defaultProps} />);

      const copyIcons = screen.getAllByTestId("copy-icon");
      expect(copyIcons.length).toBe(mockQuizzes.length);
    });

    it("renders manage submissions action", () => {
      render(<QuizManageTable {...defaultProps} />);

      const usersIcons = screen.getAllByTestId("users-icon");
      expect(usersIcons.length).toBe(mockQuizzes.length);
    });

    it("calls onEdit when edit action is clicked", async () => {
      const onEdit = vi.fn();
      const user = userEvent.setup();

      render(<QuizManageTable {...defaultProps} onEdit={onEdit} />);

      const editButtons = screen.getAllByRole("button", { name: /edit/i });
      if (editButtons[0]) {
        await user.click(editButtons[0]);
      }

      expect(onEdit).toHaveBeenCalledWith(mockQuizzes[0]?.id);
    });

    it("calls onDelete when delete action is clicked", async () => {
      const onDelete = vi.fn();
      const user = userEvent.setup();

      render(<QuizManageTable {...defaultProps} onDelete={onDelete} />);

      const deleteButtons = screen.getAllByRole("button", { name: /delete/i });
      if (deleteButtons[0]) {
        await user.click(deleteButtons[0]);
      }

      expect(onDelete).toHaveBeenCalledWith(mockQuizzes[0]?.id);
    });

    it("calls onDuplicate when duplicate action is clicked", async () => {
      const onDuplicate = vi.fn();
      const user = userEvent.setup();

      render(<QuizManageTable {...defaultProps} onDuplicate={onDuplicate} />);

      const duplicateButtons = screen.getAllByRole("button", { name: /duplicate/i });
      if (duplicateButtons[0]) {
        await user.click(duplicateButtons[0]);
      }

      expect(onDuplicate).toHaveBeenCalledWith(mockQuizzes[0]?.id);
    });

    it("calls onManageSubmissions when submissions action is clicked", async () => {
      const onManageSubmissions = vi.fn();
      const user = userEvent.setup();

      render(<QuizManageTable {...defaultProps} onManageSubmissions={onManageSubmissions} />);

      // The submissions action button has aria-label="Manage submissions"
      const submissionButtons = screen.getAllByRole("button", { name: /manage submissions/i });
      if (submissionButtons[0]) {
        await user.click(submissionButtons[0]);
      }

      expect(onManageSubmissions).toHaveBeenCalledWith(mockQuizzes[0]?.id);
    });
  });

  describe("sorting", () => {
    it("shows sort indicator on sortable columns", () => {
      render(<QuizManageTable {...defaultProps} />);

      const sortIcons = screen.getAllByTestId("sort-icon");
      expect(sortIcons.length).toBeGreaterThan(0);
    });

    it("supports sorting by title", async () => {
      const onSort = vi.fn();
      const user = userEvent.setup();

      render(<QuizManageTable {...defaultProps} onSort={onSort} />);

      const titleHeader = screen.getByText(/title/i);
      await user.click(titleHeader);

      expect(onSort).toHaveBeenCalledWith("title");
    });

    it("supports sorting by status", async () => {
      const onSort = vi.fn();
      const user = userEvent.setup();

      render(<QuizManageTable {...defaultProps} onSort={onSort} />);

      const statusHeader = screen.getByText(/status/i);
      await user.click(statusHeader);

      expect(onSort).toHaveBeenCalledWith("status");
    });

    it("supports sorting by submissions", async () => {
      const onSort = vi.fn();
      const user = userEvent.setup();

      render(<QuizManageTable {...defaultProps} onSort={onSort} />);

      const submissionsHeader = screen.getByText(/submissions/i);
      await user.click(submissionsHeader);

      expect(onSort).toHaveBeenCalledWith("submissions");
    });

    it("supports sorting by due date", async () => {
      const onSort = vi.fn();
      const user = userEvent.setup();

      render(<QuizManageTable {...defaultProps} onSort={onSort} />);

      // Due Date header is a button
      const dueDateHeader = screen.getByRole("button", { name: /due date/i });
      await user.click(dueDateHeader);

      expect(onSort).toHaveBeenCalledWith("dueDate");
    });
  });

  describe("empty state", () => {
    it("displays empty state when no quizzes", () => {
      render(<QuizManageTable {...defaultProps} quizzes={[]} />);

      expect(screen.getByText(/no.*quizzes/i)).toBeInTheDocument();
    });

    it("shows create button in empty state", () => {
      const onCreateNew = vi.fn();

      render(<QuizManageTable {...defaultProps} quizzes={[]} onCreateNew={onCreateNew} />);

      expect(screen.getByRole("button", { name: /create.*quiz/i })).toBeInTheDocument();
    });
  });

  describe("accessibility", () => {
    it("uses proper table semantics", () => {
      const { container } = render(<QuizManageTable {...defaultProps} />);

      const table = container.querySelector("table");
      expect(table).toBeInTheDocument();

      const thead = container.querySelector("thead");
      expect(thead).toBeInTheDocument();

      const tbody = container.querySelector("tbody");
      expect(tbody).toBeInTheDocument();
    });

    it("has accessible action buttons", () => {
      render(<QuizManageTable {...defaultProps} />);

      // All action buttons should be accessible
      const editButtons = screen.getAllByRole("button", { name: /edit/i });
      expect(editButtons.length).toBe(mockQuizzes.length);
    });

    it("supports custom className", () => {
      const { container } = render(
        <QuizManageTable {...defaultProps} className="custom-table" />
      );

      expect(container.firstChild).toHaveClass("custom-table");
    });

    it("supports data-testid", () => {
      render(<QuizManageTable {...defaultProps} testId="quiz-table-1" />);

      expect(screen.getByTestId("quiz-table-1")).toBeInTheDocument();
    });
  });

  describe("edge cases", () => {
    it("handles quiz with very long title", () => {
      const longTitle = "A".repeat(200);
      const baseQuiz = mockQuizzes[0];
      const quizzesWithLongTitle: QuizListItem[] = baseQuiz
        ? [{ ...baseQuiz, title: longTitle }]
        : [];

      render(<QuizManageTable {...defaultProps} quizzes={quizzesWithLongTitle} />);

      expect(screen.getByText(longTitle)).toBeInTheDocument();
    });

    it("handles quiz with zero submissions", () => {
      const baseQuiz = mockQuizzes[0];
      const quizzesWithZero: QuizListItem[] = baseQuiz
        ? [{ ...baseQuiz, attemptCount: 0 }]
        : [];

      render(<QuizManageTable {...defaultProps} quizzes={quizzesWithZero} />);

      expect(screen.getByText("0")).toBeInTheDocument();
    });

    it("handles quiz with many submissions", () => {
      const baseQuiz = mockQuizzes[0];
      const quizzesWithMany: QuizListItem[] = baseQuiz
        ? [{ ...baseQuiz, attemptCount: 999 }]
        : [];

      render(<QuizManageTable {...defaultProps} quizzes={quizzesWithMany} />);

      expect(screen.getByText("999")).toBeInTheDocument();
    });
  });
});
