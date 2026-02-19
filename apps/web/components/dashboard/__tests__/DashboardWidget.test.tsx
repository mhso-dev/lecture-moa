/**
 * DashboardWidget Component Tests
 * REQ-FE-240: Generic widget wrapper component
 */

import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { DashboardWidget } from "../DashboardWidget";

// Mock Lucide icons
vi.mock("lucide-react", () => ({
  AlertCircle: () => <span data-testid="alert-circle-icon">AlertCircle</span>,
}));

describe("DashboardWidget", () => {
  describe("rendering", () => {
    it("renders title in header", () => {
      render(
        <DashboardWidget title="Test Widget">
          <div>Content</div>
        </DashboardWidget>
      );

      expect(screen.getByText("Test Widget")).toBeInTheDocument();
    });

    it("renders subtitle when provided", () => {
      render(
        <DashboardWidget title="Test Widget" subtitle="Test subtitle">
          <div>Content</div>
        </DashboardWidget>
      );

      expect(screen.getByText("Test subtitle")).toBeInTheDocument();
    });

    it("renders headerAction when provided", () => {
      render(
        <DashboardWidget
          title="Test Widget"
          headerAction={<button type="button">Action</button>}
        >
          <div>Content</div>
        </DashboardWidget>
      );

      expect(screen.getByRole("button", { name: "Action" })).toBeInTheDocument();
    });

    it("renders children in content area", () => {
      render(
        <DashboardWidget title="Test Widget">
          <div data-testid="child-content">Widget Content</div>
        </DashboardWidget>
      );

      expect(screen.getByTestId("child-content")).toBeInTheDocument();
    });
  });

  describe("loading state", () => {
    it("renders skeleton when isLoading is true", () => {
      const { container } = render(
        <DashboardWidget title="Test Widget" isLoading>
          <div>Content</div>
        </DashboardWidget>
      );

      // Skeleton should be rendered (has animate-pulse class)
      const skeleton = container.querySelector(".animate-pulse");
      expect(skeleton).toBeInTheDocument();
    });

    it("hides content when loading", () => {
      render(
        <DashboardWidget title="Test Widget" isLoading>
          <div>Hidden Content</div>
        </DashboardWidget>
      );

      expect(screen.queryByText("Hidden Content")).not.toBeInTheDocument();
    });
  });

  describe("error state", () => {
    it("renders error message when error is provided", () => {
      render(
        <DashboardWidget title="Test Widget" error="Failed to load data">
          <div>Content</div>
        </DashboardWidget>
      );

      expect(screen.getByText("Failed to load data")).toBeInTheDocument();
    });

    it("renders retry button when onRetry is provided", async () => {
      const onRetry = vi.fn();
      const user = userEvent.setup();

      render(
        <DashboardWidget
          title="Test Widget"
          error="Failed to load data"
          onRetry={onRetry}
        >
          <div>Content</div>
        </DashboardWidget>
      );

      const retryButton = screen.getByRole("button", { name: /retry/i });
      expect(retryButton).toBeInTheDocument();

      await user.click(retryButton);
      expect(onRetry).toHaveBeenCalledTimes(1);
    });

    it("hides content when error is shown", () => {
      render(
        <DashboardWidget title="Test Widget" error="Error occurred">
          <div>Error Content Hidden</div>
        </DashboardWidget>
      );

      expect(screen.queryByText("Error Content Hidden")).not.toBeInTheDocument();
    });
  });

  describe("accessibility", () => {
    it("has proper heading structure for widget title", () => {
      render(
        <DashboardWidget title="Test Widget">
          <div>Content</div>
        </DashboardWidget>
      );

      // Title should be in a heading (h2 or h3 is appropriate for widgets)
      const heading = screen.getByRole("heading", { name: "Test Widget" });
      expect(heading).toBeInTheDocument();
    });

    it("applies data-testid when provided", () => {
      render(
        <DashboardWidget title="Test Widget" testId="custom-widget">
          <div>Content</div>
        </DashboardWidget>
      );

      expect(screen.getByTestId("custom-widget")).toBeInTheDocument();
    });

    it("applies custom className", () => {
      const { container } = render(
        <DashboardWidget title="Test Widget" className="custom-class">
          <div>Content</div>
        </DashboardWidget>
      );

      expect(container.querySelector(".custom-class")).toBeInTheDocument();
    });
  });
});
