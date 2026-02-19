/**
 * EmptyState Component Tests
 * REQ-FE-242: Reusable empty state component for widgets with no data
 */

import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { EmptyState } from "../EmptyState";
import { FileX } from "lucide-react";

describe("EmptyState", () => {
  describe("rendering", () => {
    it("renders title", () => {
      render(<EmptyState title="No data available" />);

      expect(screen.getByText("No data available")).toBeInTheDocument();
    });

    it("renders description when provided", () => {
      render(
        <EmptyState
          title="No courses"
          description="You haven't enrolled in any courses yet."
        />
      );

      expect(screen.getByText("No courses")).toBeInTheDocument();
      expect(
        screen.getByText("You haven't enrolled in any courses yet.")
      ).toBeInTheDocument();
    });

    it("renders icon when provided", () => {
      render(<EmptyState title="Empty" icon={FileX} />);

      // Lucide icons render as SVG
      const icon = document.querySelector("svg");
      expect(icon).toBeInTheDocument();
    });

    it("renders action button when provided", async () => {
      const onAction = vi.fn();
      const user = userEvent.setup();

      render(
        <EmptyState
          title="No courses"
          action={{
            label: "Browse Courses",
            onClick: onAction,
          }}
        />
      );

      const button = screen.getByRole("button", { name: "Browse Courses" });
      expect(button).toBeInTheDocument();

      await user.click(button);
      expect(onAction).toHaveBeenCalledTimes(1);
    });

    it("renders action link when href is provided", () => {
      render(
        <EmptyState
          title="No courses"
          action={{
            label: "Browse Courses",
            href: "/courses",
          }}
        />
      );

      const link = screen.getByRole("link", { name: "Browse Courses" });
      expect(link).toBeInTheDocument();
      expect(link).toHaveAttribute("href", "/courses");
    });
  });

  describe("layout", () => {
    it("is centered within container", () => {
      const { container } = render(<EmptyState title="Empty" />);

      // Should have flex and centering classes
      const wrapper = container.firstChild as HTMLElement;
      expect(wrapper.className).toMatch(/flex/);
      expect(wrapper.className).toMatch(/items-center/);
      expect(wrapper.className).toMatch(/justify-center/);
    });

    it("has appropriate spacing between elements", () => {
      const { container } = render(
        <EmptyState
          title="Empty"
          description="Description text"
          icon={FileX}
        />
      );

      const wrapper = container.firstChild as HTMLElement;
      expect(wrapper.className).toMatch(/space-y-/);
    });
  });

  describe("accessibility", () => {
    it("has proper heading for title", () => {
      render(<EmptyState title="No Data" />);

      const heading = screen.getByRole("heading", { name: "No Data" });
      expect(heading).toBeInTheDocument();
    });

    it("applies data-testid when provided", () => {
      render(<EmptyState title="Empty" testId="empty-state-test" />);

      expect(screen.getByTestId("empty-state-test")).toBeInTheDocument();
    });

    it("applies custom className", () => {
      const { container } = render(
        <EmptyState title="Empty" className="custom-empty" />
      );

      expect(container.querySelector(".custom-empty")).toBeInTheDocument();
    });

    it("icon has aria-hidden attribute", () => {
      render(<EmptyState title="Empty" icon={FileX} />);

      const icon = document.querySelector("svg");
      expect(icon).toHaveAttribute("aria-hidden", "true");
    });
  });
});
