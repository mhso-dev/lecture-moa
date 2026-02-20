/**
 * ResultsChart Component Tests
 * REQ-FE-623: Results visualization with SVG donut chart
 */

import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { ResultsChart } from "../results-chart";

describe("ResultsChart", () => {
  describe("rendering", () => {
    it("renders SVG element", () => {
      render(<ResultsChart correct={5} incorrect={3} unanswered={2} />);

      const svg = document.querySelector("svg");
      expect(svg).toBeInTheDocument();
    });

    it("displays correct count in legend", () => {
      render(<ResultsChart correct={5} incorrect={3} unanswered={2} />);

      // Check for the specific legend item
      const legendItems = screen.getAllByText(/correct/i);
      expect(legendItems.length).toBeGreaterThan(0);
      expect(screen.getByText("5")).toBeInTheDocument();
    });

    it("displays incorrect count in legend", () => {
      render(<ResultsChart correct={5} incorrect={3} unanswered={2} />);

      const legendItems = screen.getAllByText(/incorrect/i);
      expect(legendItems.length).toBeGreaterThan(0);
      expect(screen.getByText("3")).toBeInTheDocument();
    });

    it("displays unanswered count in legend", () => {
      render(<ResultsChart correct={5} incorrect={3} unanswered={2} />);

      const legendItems = screen.getAllByText(/unanswered/i);
      expect(legendItems.length).toBeGreaterThan(0);
      expect(screen.getByText("2")).toBeInTheDocument();
    });

    it("handles all correct answers", () => {
      render(<ResultsChart correct={10} incorrect={0} unanswered={0} />);

      expect(screen.getByText("10")).toBeInTheDocument();
    });

    it("handles all incorrect answers", () => {
      render(<ResultsChart correct={0} incorrect={10} unanswered={0} />);

      expect(screen.getByText("10")).toBeInTheDocument();
    });

    it("handles all unanswered", () => {
      render(<ResultsChart correct={0} incorrect={0} unanswered={10} />);

      expect(screen.getByText("10")).toBeInTheDocument();
    });
  });

  describe("accessibility", () => {
    it("has aria-hidden on SVG", () => {
      render(<ResultsChart correct={5} incorrect={3} unanswered={2} />);

      const svg = document.querySelector("svg");
      expect(svg).toHaveAttribute("aria-hidden", "true");
    });

    it("provides text alternative for screen readers", () => {
      render(<ResultsChart correct={5} incorrect={3} unanswered={2} />);

      // Should have a text description for screen readers
      expect(
        screen.getByText(/5 correct, 3 incorrect, 2 unanswered/)
      ).toBeInTheDocument();
    });

    it("uses proper color contrast for segments", () => {
      const { container } = render(
        <ResultsChart correct={5} incorrect={3} unanswered={2} />
      );

      // SVG circles should exist for each segment (background + 3 segments)
      const circles = container.querySelectorAll("circle");
      expect(circles.length).toBeGreaterThan(0);
    });
  });

  describe("visual representation", () => {
    it("renders donut chart segments", () => {
      const { container } = render(
        <ResultsChart correct={5} incorrect={3} unanswered={2} />
      );

      // Background circle + 3 segment circles = 4 total
      const circles = container.querySelectorAll("circle");
      expect(circles.length).toBe(4); // Background + 3 segments
    });

    it("renders center text showing percentage", () => {
      render(<ResultsChart correct={5} incorrect={3} unanswered={2} />);

      // 5/10 = 50%
      expect(screen.getByText("50%")).toBeInTheDocument();
    });

    it("calculates percentage correctly", () => {
      render(<ResultsChart correct={7} incorrect={2} unanswered={1} />);

      // 7/10 = 70%
      expect(screen.getByText("70%")).toBeInTheDocument();
    });

    it("handles zero total gracefully", () => {
      render(<ResultsChart correct={0} incorrect={0} unanswered={0} />);

      // Should display 0% or handle edge case
      expect(screen.getByText("0%")).toBeInTheDocument();
    });

    it("applies green color to correct segment", () => {
      const { container } = render(
        <ResultsChart correct={5} incorrect={3} unanswered={2} />
      );

      const circles = container.querySelectorAll("circle");
      // First circle after background should be correct segment
      const correctCircle = circles[1];
      expect(correctCircle).toHaveAttribute("stroke");
      expect(correctCircle?.getAttribute("stroke")).toContain("chart-2");
    });

    it("applies red color to incorrect segment", () => {
      const { container } = render(
        <ResultsChart correct={5} incorrect={3} unanswered={2} />
      );

      const circles = container.querySelectorAll("circle");
      const incorrectCircle = circles[2];
      expect(incorrectCircle).toHaveAttribute("stroke");
      expect(incorrectCircle?.getAttribute("stroke")).toContain("destructive");
    });

    it("applies gray color to unanswered segment", () => {
      const { container } = render(
        <ResultsChart correct={5} incorrect={3} unanswered={2} />
      );

      const circles = container.querySelectorAll("circle");
      const unansweredCircle = circles[3];
      expect(unansweredCircle).toHaveAttribute("stroke");
      expect(unansweredCircle?.getAttribute("stroke")).toContain("muted-foreground");
    });
  });

  describe("responsive design", () => {
    it("accepts custom className", () => {
      const { container } = render(
        <ResultsChart
          correct={5}
          incorrect={3}
          unanswered={2}
          className="custom-chart"
        />
      );

      expect(container.firstChild).toHaveClass("custom-chart");
    });

    it("accepts custom size props", () => {
      const { container } = render(
        <ResultsChart
          correct={5}
          incorrect={3}
          unanswered={2}
          size={300}
        />
      );

      const svg = container.querySelector("svg");
      expect(svg).toHaveAttribute("width", "300");
      expect(svg).toHaveAttribute("height", "300");
    });

    it("uses default size when not specified", () => {
      const { container } = render(
        <ResultsChart correct={5} incorrect={3} unanswered={2} />
      );

      const svg = container.querySelector("svg");
      expect(svg).toHaveAttribute("width");
      expect(svg).toHaveAttribute("height");
    });
  });

  describe("edge cases", () => {
    it("handles very small correct percentage", () => {
      render(<ResultsChart correct={1} incorrect={99} unanswered={0} />);

      // 1/100 = 1%
      expect(screen.getByText("1%")).toBeInTheDocument();
    });

    it("handles 100% correct", () => {
      render(<ResultsChart correct={100} incorrect={0} unanswered={0} />);

      expect(screen.getByText("100%")).toBeInTheDocument();
    });

    it("handles large numbers", () => {
      render(<ResultsChart correct={500} incorrect={300} unanswered={200} />);

      // 500/1000 = 50%
      expect(screen.getByText("50%")).toBeInTheDocument();
    });
  });
});
