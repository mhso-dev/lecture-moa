/**
 * QuizTimer Component Tests
 * REQ-FE-614: Quiz Timer
 *
 * Tests for countdown timer with color states and accessibility
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { QuizTimer } from "../quiz-timer";

// Mock the useQuizTimer hook
// Return null values so component uses its own formatting logic based on props
vi.mock("~/hooks/quiz/useQuizTimer", () => ({
  useQuizTimer: vi.fn(() => ({
    remainingSeconds: null,
    timerStatus: null,
    formattedTime: null,
    pauseTimer: vi.fn(),
    resumeTimer: vi.fn(),
  })),
}));

describe("QuizTimer", () => {
  const mockOnExpire = vi.fn();

  beforeEach(() => {
    mockOnExpire.mockClear();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe("display", () => {
    it("displays time in MM:SS format", () => {
      render(<QuizTimer remainingSeconds={300} status="running" />);

      expect(screen.getByText("05:00")).toBeInTheDocument();
    });

    it("displays 00:00 for zero seconds", () => {
      render(<QuizTimer remainingSeconds={0} status="expired" />);

      expect(screen.getByText("00:00")).toBeInTheDocument();
    });

    it("displays hours correctly for large values", () => {
      render(<QuizTimer remainingSeconds={3661} status="running" />);

      // 1 hour, 1 minute, 1 second = 61:01 or 01:01:01
      expect(screen.getByText("61:01")).toBeInTheDocument();
    });

    it("does not render when remainingSeconds is null", () => {
      const { container } = render(
        <QuizTimer remainingSeconds={null} status="idle" />
      );

      expect(container.firstChild).toBeNull();
    });
  });

  describe("color states", () => {
    it("uses default text color for normal time (>120s)", () => {
      render(<QuizTimer remainingSeconds={300} status="running" />);

      const timer = screen.getByRole("timer");
      expect(timer).not.toHaveClass("text-amber-500");
      expect(timer).not.toHaveClass("text-red-500");
    });

    it("uses amber color at 120 seconds threshold", () => {
      render(<QuizTimer remainingSeconds={120} status="running" />);

      const timer = screen.getByRole("timer");
      expect(timer).toHaveClass("text-amber-500");
    });

    it("uses amber color between 61-120 seconds", () => {
      render(<QuizTimer remainingSeconds={90} status="running" />);

      const timer = screen.getByRole("timer");
      expect(timer).toHaveClass("text-amber-500");
    });

    it("uses red color at 60 seconds threshold", () => {
      render(<QuizTimer remainingSeconds={60} status="running" />);

      const timer = screen.getByRole("timer");
      expect(timer).toHaveClass("text-red-500");
    });

    it("uses red color below 60 seconds", () => {
      render(<QuizTimer remainingSeconds={30} status="running" />);

      const timer = screen.getByRole("timer");
      expect(timer).toHaveClass("text-red-500");
    });

    it("uses red color at 0 seconds", () => {
      render(<QuizTimer remainingSeconds={0} status="expired" />);

      const timer = screen.getByRole("timer");
      expect(timer).toHaveClass("text-red-500");
    });
  });

  describe("animation", () => {
    it("has pulse animation below 60 seconds", () => {
      render(<QuizTimer remainingSeconds={45} status="running" />);

      const timer = screen.getByRole("timer");
      expect(timer).toHaveClass("animate-pulse");
    });

    it("does not have pulse animation at or above 60 seconds", () => {
      render(<QuizTimer remainingSeconds={60} status="running" />);

      const timer = screen.getByRole("timer");
      expect(timer).not.toHaveClass("animate-pulse");
    });
  });

  describe("auto-submit on expire", () => {
    it("passes onExpire callback to useQuizTimer hook", async () => {
      const { useQuizTimer } = await import("~/hooks/quiz/useQuizTimer");

      render(
        <QuizTimer remainingSeconds={300} status="running" onExpire={mockOnExpire} />
      );

      // Verify the hook was called with onExpire callback
      expect(vi.mocked(useQuizTimer)).toHaveBeenCalledWith(
        expect.objectContaining({
          onExpire: mockOnExpire,
        })
      );
    });

    it("does not call onExpire while timer is running", () => {
      render(
        <QuizTimer remainingSeconds={300} status="running" onExpire={mockOnExpire} />
      );

      // The hook manages the callback - component should not call it directly
      expect(mockOnExpire).not.toHaveBeenCalled();
    });
  });

  describe("timer status", () => {
    it("displays paused indicator when paused", () => {
      render(<QuizTimer remainingSeconds={300} status="paused" />);

      expect(screen.getByText(/paused/i)).toBeInTheDocument();
    });

    it("displays expired indicator when expired", () => {
      render(<QuizTimer remainingSeconds={0} status="expired" />);

      expect(screen.getByText(/time's up/i)).toBeInTheDocument();
    });

    it("does not display status indicator when running", () => {
      render(<QuizTimer remainingSeconds={300} status="running" />);

      expect(screen.queryByText(/paused/i)).not.toBeInTheDocument();
      expect(screen.queryByText(/time's up/i)).not.toBeInTheDocument();
    });
  });

  describe("accessibility", () => {
    it("has role='timer'", () => {
      render(<QuizTimer remainingSeconds={300} status="running" />);

      expect(screen.getByRole("timer")).toBeInTheDocument();
    });

    it("has aria-label='Time remaining'", () => {
      render(<QuizTimer remainingSeconds={300} status="running" />);

      const timer = screen.getByRole("timer");
      expect(timer).toHaveAttribute("aria-label", "Time remaining");
    });

    it("has aria-live='off' for normal updates", () => {
      render(<QuizTimer remainingSeconds={300} status="running" />);

      const timer = screen.getByRole("timer");
      expect(timer).toHaveAttribute("aria-live", "off");
    });

    it("has aria-live='polite' for threshold changes (120s)", () => {
      render(<QuizTimer remainingSeconds={120} status="running" />);

      const timer = screen.getByRole("timer");
      expect(timer).toHaveAttribute("aria-live", "polite");
    });

    it("has aria-live='assertive' for critical threshold (60s)", () => {
      render(<QuizTimer remainingSeconds={60} status="running" />);

      const timer = screen.getByRole("timer");
      expect(timer).toHaveAttribute("aria-live", "assertive");
    });

    it("announces threshold warnings via aria-live", () => {
      const { rerender } = render(
        <QuizTimer remainingSeconds={121} status="running" />
      );

      // Initially no announcement
      expect(screen.queryByRole("status")).not.toBeInTheDocument();

      // Cross threshold to 120s
      rerender(<QuizTimer remainingSeconds={120} status="running" />);

      // Should have screen reader announcement
      expect(screen.getByText(/2 minutes remaining/i)).toBeInTheDocument();
    });

    it("supports data-testid", () => {
      render(
        <QuizTimer
          remainingSeconds={300}
          status="running"
          testId="quiz-timer"
        />
      );

      expect(screen.getByTestId("quiz-timer")).toBeInTheDocument();
    });
  });

  describe("useQuizTimer integration", () => {
    it("uses useQuizTimer hook with onExpire callback", async () => {
      const { useQuizTimer } = await import("~/hooks/quiz/useQuizTimer");

      render(
        <QuizTimer remainingSeconds={300} status="running" onExpire={mockOnExpire} />
      );

      expect(vi.mocked(useQuizTimer)).toHaveBeenCalledWith(
        expect.objectContaining({
          onExpire: mockOnExpire,
        })
      );
    });
  });

  describe("formatting edge cases", () => {
    it("formats 59 seconds correctly", () => {
      render(<QuizTimer remainingSeconds={59} status="running" />);

      expect(screen.getByText("00:59")).toBeInTheDocument();
    });

    it("formats 1 second correctly", () => {
      render(<QuizTimer remainingSeconds={1} status="running" />);

      expect(screen.getByText("00:01")).toBeInTheDocument();
    });

    it("formats 3599 seconds (59:59) correctly", () => {
      render(<QuizTimer remainingSeconds={3599} status="running" />);

      expect(screen.getByText("59:59")).toBeInTheDocument();
    });

    it("formats 3600 seconds (1 hour) correctly", () => {
      render(<QuizTimer remainingSeconds={3600} status="running" />);

      expect(screen.getByText("60:00")).toBeInTheDocument();
    });
  });
});
