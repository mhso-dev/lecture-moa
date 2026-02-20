/**
 * QuizProgressBar Component Tests
 * REQ-FE-615: Progress Bar
 *
 * Tests for the quiz progress bar displaying answered/total questions
 */

import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { QuizProgressBar } from "../quiz-progress-bar";

// Mock the Progress component
vi.mock("~/components/ui/progress", () => ({
  Progress: ({ value, className, ...props }: { value: number; className?: string }) => (
    <div
      role="progressbar"
      aria-valuenow={value}
      aria-valuemin={0}
      aria-valuemax={100}
      className={className}
      data-testid="progress-bar"
      {...props}
    />
  ),
}));

describe("QuizProgressBar", () => {
  describe("display", () => {
    it("displays answered count and total", () => {
      render(<QuizProgressBar answered={5} total={10} />);

      expect(screen.getByText("5/10")).toBeInTheDocument();
    });

    it("displays percentage", () => {
      render(<QuizProgressBar answered={5} total={10} />);

      expect(screen.getByText("50%")).toBeInTheDocument();
    });

    it("calculates percentage correctly for different values", () => {
      const { rerender } = render(<QuizProgressBar answered={3} total={8} />);

      expect(screen.getByText("3/8")).toBeInTheDocument();
      expect(screen.getByText("38%")).toBeInTheDocument();

      rerender(<QuizProgressBar answered={7} total={7} />);
      expect(screen.getByText("7/7")).toBeInTheDocument();
      expect(screen.getByText("100%")).toBeInTheDocument();
    });

    it("handles zero answered", () => {
      render(<QuizProgressBar answered={0} total={10} />);

      expect(screen.getByText("0/10")).toBeInTheDocument();
      expect(screen.getByText("0%")).toBeInTheDocument();
    });

    it("handles all answered", () => {
      render(<QuizProgressBar answered={10} total={10} />);

      expect(screen.getByText("10/10")).toBeInTheDocument();
      expect(screen.getByText("100%")).toBeInTheDocument();
    });
  });

  describe("progress bar", () => {
    it("renders progress bar with correct value", () => {
      render(<QuizProgressBar answered={5} total={10} />);

      const progressBar = screen.getByTestId("progress-bar");
      expect(progressBar).toHaveAttribute("aria-valuenow", "50");
    });

    it("updates progress bar value when answered changes", () => {
      const { rerender } = render(<QuizProgressBar answered={2} total={10} />);

      let progressBar = screen.getByTestId("progress-bar");
      expect(progressBar).toHaveAttribute("aria-valuenow", "20");

      rerender(<QuizProgressBar answered={8} total={10} />);
      progressBar = screen.getByTestId("progress-bar");
      expect(progressBar).toHaveAttribute("aria-valuenow", "80");
    });
  });

  describe("accessibility", () => {
    it("has role='progressbar' via Progress component", () => {
      render(<QuizProgressBar answered={5} total={10} />);

      expect(screen.getByRole("progressbar")).toBeInTheDocument();
    });

    it("has aria-valuenow attribute", () => {
      render(<QuizProgressBar answered={5} total={10} />);

      const progressBar = screen.getByRole("progressbar");
      expect(progressBar).toHaveAttribute("aria-valuenow", "50");
    });

    it("has aria-valuemin='0'", () => {
      render(<QuizProgressBar answered={5} total={10} />);

      const progressBar = screen.getByRole("progressbar");
      expect(progressBar).toHaveAttribute("aria-valuemin", "0");
    });

    it("has aria-valuemax='100'", () => {
      render(<QuizProgressBar answered={5} total={10} />);

      const progressBar = screen.getByRole("progressbar");
      expect(progressBar).toHaveAttribute("aria-valuemax", "100");
    });

    it("supports custom testId", () => {
      render(<QuizProgressBar answered={5} total={10} testId="custom-progress" />);

      expect(screen.getByTestId("custom-progress")).toBeInTheDocument();
    });
  });

  describe("edge cases", () => {
    it("handles total of 0 gracefully", () => {
      // Should not crash and show 0%
      render(<QuizProgressBar answered={0} total={0} />);

      expect(screen.getByText("0/0")).toBeInTheDocument();
      const progressBar = screen.getByTestId("progress-bar");
      expect(progressBar).toHaveAttribute("aria-valuenow", "0");
    });

    it("handles large numbers", () => {
      render(<QuizProgressBar answered={45} total={50} />);

      expect(screen.getByText("45/50")).toBeInTheDocument();
      expect(screen.getByText("90%")).toBeInTheDocument();
    });
  });
});
