/**
 * DashboardGrid Component Tests
 * REQ-FE-241: Responsive grid layout component for dashboard widgets
 */

import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { DashboardGrid } from "../DashboardGrid";

describe("DashboardGrid", () => {
  describe("rendering", () => {
    it("renders children in grid layout", () => {
      render(
        <DashboardGrid>
          <div data-testid="widget-1">Widget 1</div>
          <div data-testid="widget-2">Widget 2</div>
          <div data-testid="widget-3">Widget 3</div>
        </DashboardGrid>
      );

      expect(screen.getByTestId("widget-1")).toBeInTheDocument();
      expect(screen.getByTestId("widget-2")).toBeInTheDocument();
      expect(screen.getByTestId("widget-3")).toBeInTheDocument();
    });

    it("applies grid display class", () => {
      const { container } = render(
        <DashboardGrid>
          <div>Widget</div>
        </DashboardGrid>
      );

      const grid = container.firstChild as HTMLElement;
      expect(grid.className).toMatch(/grid/);
    });
  });

  describe("responsive columns", () => {
    it("applies default column classes (1/2/3 for mobile/tablet/desktop)", () => {
      const { container } = render(
        <DashboardGrid>
          <div>Widget</div>
        </DashboardGrid>
      );

      const grid = container.firstChild as HTMLElement;
      // Default: mobile=1, tablet=2, desktop=3
      expect(grid.className).toMatch(/grid-cols-1/);
      expect(grid.className).toMatch(/md:grid-cols-2/);
      expect(grid.className).toMatch(/xl:grid-cols-3/);
    });

    it("applies custom column configuration", () => {
      const { container } = render(
        <DashboardGrid columns={{ mobile: 1, tablet: 2, desktop: 2 }}>
          <div>Widget</div>
        </DashboardGrid>
      );

      const grid = container.firstChild as HTMLElement;
      expect(grid.className).toMatch(/grid-cols-1/);
      expect(grid.className).toMatch(/md:grid-cols-2/);
      expect(grid.className).toMatch(/xl:grid-cols-2/);
    });

    it("supports team dashboard column configuration (1/2/2)", () => {
      const { container } = render(
        <DashboardGrid columns={{ mobile: 1, tablet: 2, desktop: 2 }}>
          <div>Widget</div>
        </DashboardGrid>
      );

      const grid = container.firstChild as HTMLElement;
      expect(grid.className).toMatch(/xl:grid-cols-2/);
    });
  });

  describe("gap configuration", () => {
    it("applies responsive gap classes", () => {
      const { container } = render(
        <DashboardGrid>
          <div>Widget</div>
        </DashboardGrid>
      );

      const grid = container.firstChild as HTMLElement;
      // Gap: 16px mobile, 20px tablet, 24px desktop
      // Tailwind: gap-4 (16px), md:gap-5 (20px), xl:gap-6 (24px)
      expect(grid.className).toMatch(/gap-4/);
      expect(grid.className).toMatch(/md:gap-5/);
      expect(grid.className).toMatch(/xl:gap-6/);
    });
  });

  describe("accessibility and customization", () => {
    it("applies data-testid when provided", () => {
      render(
        <DashboardGrid testId="dashboard-grid">
          <div>Widget</div>
        </DashboardGrid>
      );

      expect(screen.getByTestId("dashboard-grid")).toBeInTheDocument();
    });

    it("applies custom className", () => {
      const { container } = render(
        <DashboardGrid className="custom-grid">
          <div>Widget</div>
        </DashboardGrid>
      );

      expect(container.querySelector(".custom-grid")).toBeInTheDocument();
    });

    it("maintains proper DOM structure for screen readers", () => {
      const { container } = render(
        <DashboardGrid>
          <div role="region" aria-label="Widget 1">Content</div>
          <div role="region" aria-label="Widget 2">Content</div>
        </DashboardGrid>
      );

      const regions = container.querySelectorAll('[role="region"]');
      expect(regions).toHaveLength(2);
    });
  });
});
