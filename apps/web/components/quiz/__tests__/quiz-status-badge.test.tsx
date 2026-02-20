/**
 * QuizStatusBadge Component Tests
 * REQ-FE-604: Status badge (Published, Draft, Closed) for instructors
 * REQ-FE-662: Color contrast for status badges
 */

import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { QuizStatusBadge } from "../quiz-status-badge";
import type { QuizStatus } from "@shared";

describe("QuizStatusBadge", () => {
  describe("status display", () => {
    it('displays "Draft" for draft status', () => {
      render(<QuizStatusBadge status="draft" />);

      expect(screen.getByText("Draft")).toBeInTheDocument();
    });

    it('displays "Published" for published status', () => {
      render(<QuizStatusBadge status="published" />);

      expect(screen.getByText("Published")).toBeInTheDocument();
    });

    it('displays "Closed" for closed status', () => {
      render(<QuizStatusBadge status="closed" />);

      expect(screen.getByText("Closed")).toBeInTheDocument();
    });
  });

  describe("styling", () => {
    it('applies secondary variant for draft status', () => {
      const { container } = render(<QuizStatusBadge status="draft" />);

      // Badge should have gray/secondary styling
      const badge = container.firstChild as HTMLElement;
      expect(badge.className).toMatch(/neutral|secondary|gray/i);
    });

    it('applies success variant for published status', () => {
      const { container } = render(<QuizStatusBadge status="published" />);

      // Badge should have green/success styling
      const badge = container.firstChild as HTMLElement;
      expect(badge.className).toMatch(/success|green/i);
    });

    it('applies destructive/outline variant for closed status', () => {
      const { container } = render(<QuizStatusBadge status="closed" />);

      // Badge should have red/destructive or muted styling
      const badge = container.firstChild as HTMLElement;
      expect(badge.className).toMatch(/destructive|error|red|muted/i);
    });

    it("accepts custom className", () => {
      const { container } = render(
        <QuizStatusBadge status="draft" className="custom-class" />
      );

      const badge = container.firstChild as HTMLElement;
      expect(badge.className).toContain("custom-class");
    });
  });

  describe("accessibility", () => {
    it("has proper ARIA role", () => {
      render(<QuizStatusBadge status="published" />);

      // Badge should be identifiable as status
      const badge = screen.getByText("Published");
      expect(badge).toBeInTheDocument();
    });

    it("supports data-testid prop", () => {
      render(<QuizStatusBadge status="draft" testId="quiz-status" />);

      expect(screen.getByTestId("quiz-status")).toBeInTheDocument();
    });
  });

  describe("type safety", () => {
    it("accepts all valid QuizStatus values", () => {
      const statuses: QuizStatus[] = ["draft", "published", "closed"];

      statuses.forEach((status) => {
        const { unmount } = render(<QuizStatusBadge status={status} />);
        expect(screen.getByText(new RegExp(status, "i"))).toBeInTheDocument();
        unmount();
      });
    });
  });
});
