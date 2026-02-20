/**
 * SubmissionList Component Tests
 * REQ-FE-651: Student submission list for instructor view
 */

import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { SubmissionList } from "../submission-list";
import type { QuizSubmissionSummary } from "@shared";

// Mock lucide-react icons
vi.mock("lucide-react", () => ({
  Download: () => <span data-testid="download-icon">Download</span>,
  ExternalLink: () => <span data-testid="external-link-icon">ExternalLink</span>,
  ChevronDown: () => <span data-testid="chevron-icon">ChevronDown</span>,
  ChevronUp: () => <span data-testid="chevron-up-icon">ChevronUp</span>,
}));

describe("SubmissionList", () => {
  const mockSubmissions: QuizSubmissionSummary[] = [
    {
      userId: "user-1",
      userName: "John Doe",
      attemptId: "attempt-1",
      score: 85,
      percentage: 85,
      passed: true,
      submittedAt: "2026-02-15T10:30:00Z",
    },
    {
      userId: "user-2",
      userName: "Jane Smith",
      attemptId: "attempt-2",
      score: 65,
      percentage: 65,
      passed: false,
      submittedAt: "2026-02-15T11:00:00Z",
    },
    {
      userId: "user-3",
      userName: "Bob Johnson",
      attemptId: "attempt-3",
      score: 92,
      percentage: 92,
      passed: true,
      submittedAt: "2026-02-14T09:00:00Z",
    },
  ];

  const defaultProps = {
    submissions: mockSubmissions,
    onViewDetails: vi.fn(),
    passingScore: 70,
  };

  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  describe("rendering - basic display", () => {
    it("renders all submissions", () => {
      render(<SubmissionList {...defaultProps} testId="test-list" />);

      expect(screen.getByText("John Doe")).toBeInTheDocument();
      expect(screen.getByText("Jane Smith")).toBeInTheDocument();
      expect(screen.getByText("Bob Johnson")).toBeInTheDocument();
    });

    it("displays score for each submission", () => {
      render(<SubmissionList {...defaultProps} testId="test-list" />);

      expect(screen.getByText("85%")).toBeInTheDocument();
      expect(screen.getByText("65%")).toBeInTheDocument();
      expect(screen.getByText("92%")).toBeInTheDocument();
    });

    it("displays pass/fail badges", () => {
      render(<SubmissionList {...defaultProps} testId="test-list" />);

      // Multiple "Passed" badges for passed submissions
      const passedElements = screen.getAllByText(/passed/i);
      expect(passedElements.length).toBeGreaterThan(0);

      expect(screen.getByText(/failed/i)).toBeInTheDocument();
    });

    it("displays submission timestamps", () => {
      render(<SubmissionList {...defaultProps} testId="test-list" />);

      // Check for date formatting - multiple dates appear
      const feb15Elements = screen.getAllByText(/feb.*15.*2026/i);
      expect(feb15Elements.length).toBeGreaterThan(0);
    });

    it("displays view details link for each submission", () => {
      render(<SubmissionList {...defaultProps} testId="test-list" />);

      const viewLinks = screen.getAllByText(/view details/i);
      expect(viewLinks.length).toBe(mockSubmissions.length);
    });
  });

  describe("export functionality", () => {
    it("renders export CSV button", () => {
      render(<SubmissionList {...defaultProps} testId="test-list" />);

      expect(screen.getByRole("button", { name: /export.*csv/i })).toBeInTheDocument();
    });

    it("generates CSV download on click", async () => {
      const user = userEvent.setup();

      // Mock URL.createObjectURL and related functions
      const mockCreateObjectURL = vi.fn(() => "blob:test-url");
      const mockRevokeObjectURL = vi.fn();
      global.URL.createObjectURL = mockCreateObjectURL;
      global.URL.revokeObjectURL = mockRevokeObjectURL;

      render(<SubmissionList {...defaultProps} testId="test-list" />);

      const exportButton = screen.getByRole("button", { name: /export.*csv/i });
      await user.click(exportButton);

      expect(mockCreateObjectURL).toHaveBeenCalled();
    });
  });

  describe("sorting", () => {
    it("supports sorting by score", async () => {
      const onSort = vi.fn();
      const user = userEvent.setup();

      render(<SubmissionList {...defaultProps} onSort={onSort} testId="test-list" />);

      // Find and click on "Score" text
      const scoreText = screen.getByText("Score");
      await user.click(scoreText);

      expect(onSort).toHaveBeenCalledWith("score");
    });

    it("supports sorting by submission time", async () => {
      const onSort = vi.fn();
      const user = userEvent.setup();

      render(<SubmissionList {...defaultProps} onSort={onSort} testId="test-list" />);

      // Find and click on "Submitted" text
      const submittedText = screen.getByText("Submitted");
      await user.click(submittedText);

      expect(onSort).toHaveBeenCalledWith("submittedAt");
    });
  });

  describe("actions", () => {
    it("calls onViewDetails when view details is clicked", async () => {
      const onViewDetails = vi.fn();
      const user = userEvent.setup();

      render(<SubmissionList {...defaultProps} onViewDetails={onViewDetails} testId="test-list" />);

      // View Details buttons have that text
      const viewButtons = screen.getAllByRole("button", { name: /view details/i });
      if (viewButtons[0]) {
        await user.click(viewButtons[0]);
      }

      expect(onViewDetails).toHaveBeenCalledWith(mockSubmissions[0]?.attemptId);
    });
  });

  describe("empty state", () => {
    it("displays empty state when no submissions", () => {
      render(<SubmissionList {...defaultProps} submissions={[]} testId="test-list" />);

      expect(screen.getByText(/no submissions/i)).toBeInTheDocument();
    });
  });

  describe("accessibility", () => {
    it("supports custom className", () => {
      const { container } = render(
        <SubmissionList {...defaultProps} className="custom-list" testId="test-list" />
      );

      // The wrapper div should have custom-list class
      expect(container.firstChild).toHaveClass("custom-list");
    });

    it("supports data-testid", () => {
      render(<SubmissionList {...defaultProps} testId="submission-list-1" />);

      expect(screen.getByTestId("submission-list-1")).toBeInTheDocument();
    });

    it("has proper list structure", () => {
      const { container } = render(<SubmissionList {...defaultProps} testId="test-list" />);

      // Should have submission rows
      const rows = container.querySelectorAll('[class*="divide-y"] > div');
      expect(rows.length).toBeGreaterThanOrEqual(mockSubmissions.length);
    });
  });

  describe("edge cases", () => {
    it("handles null passed status", () => {
      const baseSubmission = mockSubmissions[0];
      const submissionsWithNull: QuizSubmissionSummary[] = baseSubmission
        ? [{ ...baseSubmission, passed: null }]
        : [];

      render(<SubmissionList {...defaultProps} submissions={submissionsWithNull} testId="test-list" />);

      expect(screen.getByText(/pending/i)).toBeInTheDocument();
    });

    it("handles very long names", () => {
      const longName = "A".repeat(100);
      const baseSubmission = mockSubmissions[0];
      const submissionsWithLongName: QuizSubmissionSummary[] = baseSubmission
        ? [{ ...baseSubmission, userName: longName }]
        : [];

      render(<SubmissionList {...defaultProps} submissions={submissionsWithLongName} testId="test-list" />);

      expect(screen.getByText(longName)).toBeInTheDocument();
    });

    it("handles zero score", () => {
      const baseSubmission = mockSubmissions[0];
      const zeroScoreSubmissions: QuizSubmissionSummary[] = baseSubmission
        ? [{ ...baseSubmission, score: 0, percentage: 0, passed: false }]
        : [];

      render(<SubmissionList {...defaultProps} submissions={zeroScoreSubmissions} testId="test-list" />);

      expect(screen.getByText("0%")).toBeInTheDocument();
    });

    it("handles perfect score", () => {
      const baseSubmission = mockSubmissions[0];
      const perfectScoreSubmissions: QuizSubmissionSummary[] = baseSubmission
        ? [{ ...baseSubmission, score: 100, percentage: 100, passed: true }]
        : [];

      render(<SubmissionList {...defaultProps} submissions={perfectScoreSubmissions} testId="test-list" />);

      expect(screen.getByText("100%")).toBeInTheDocument();
    });
  });
});
