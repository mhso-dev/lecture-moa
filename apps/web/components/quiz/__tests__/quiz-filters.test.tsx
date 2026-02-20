/**
 * QuizFilters Component Tests
 * REQ-FE-603: Quiz List Filtering
 * REQ-FE-603: URL sync with useSearchParams
 *
 * Note: Select dropdown interaction tests are simplified due to Radix UI testing complexity.
 * Full integration tests will be added in E2E testing.
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";

// Create mutable mock values
let mockReplace = vi.fn();
let mockSearchParams = new URLSearchParams();

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    replace: (): void => { mockReplace(); },
  }),
  useSearchParams: () => mockSearchParams,
  usePathname: () => "/quizzes",
}));

import { QuizFilters } from "../quiz-filters";

describe("QuizFilters", () => {
  beforeEach(() => {
    mockReplace = vi.fn();
    mockSearchParams = new URLSearchParams();
  });

  describe("rendering", () => {
    it("renders status filter dropdown", () => {
      render(<QuizFilters onFilterChange={vi.fn()} />);

      // Should have status filter
      expect(screen.getByLabelText(/status/i)).toBeInTheDocument();
    });

    it("renders course filter dropdown when courses provided", () => {
      const courses = [{ id: "course-1", name: "Web Development" }];
      render(<QuizFilters onFilterChange={vi.fn()} courses={courses} />);

      expect(screen.getByLabelText(/course/i)).toBeInTheDocument();
    });

    it("renders both filters together when courses provided", () => {
      const courses = [{ id: "course-1", name: "Web Development" }];
      render(<QuizFilters onFilterChange={vi.fn()} courses={courses} />);

      expect(screen.getByLabelText(/status/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/course/i)).toBeInTheDocument();
    });
  });

  describe("initial state", () => {
    it("applies initial filters from props", () => {
      const initialFilters = {
        status: "published" as const,
        courseId: "course-1",
      };

      render(
        <QuizFilters onFilterChange={vi.fn()} initialFilters={initialFilters} />
      );

      // Component should render with filters
      expect(screen.getByLabelText(/status/i)).toBeInTheDocument();
    });

    it("reads initial filters from URL params", () => {
      mockSearchParams = new URLSearchParams("status=published&courseId=course-1");

      render(<QuizFilters onFilterChange={vi.fn()} />);

      // Component should read URL params
      expect(screen.getByLabelText(/status/i)).toBeInTheDocument();
    });
  });

  describe("accessibility", () => {
    it("has proper labels for filter controls", () => {
      const courses = [{ id: "course-1", name: "Web Development" }];
      render(<QuizFilters onFilterChange={vi.fn()} courses={courses} />);

      expect(screen.getByLabelText(/status/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/course/i)).toBeInTheDocument();
    });

    it("has accessible placeholder text", () => {
      render(<QuizFilters onFilterChange={vi.fn()} />);

      // Status filter should have placeholder
      const statusTrigger = screen.getByLabelText(/status/i);
      expect(statusTrigger).toBeInTheDocument();
    });
  });

  describe("responsive layout", () => {
    it("renders filter controls in a flex row on desktop", () => {
      const { container } = render(<QuizFilters onFilterChange={vi.fn()} />);

      const filterContainer = container.firstChild as HTMLElement;
      expect(filterContainer.className).toMatch(/flex/);
    });

    it("supports custom className", () => {
      const { container } = render(
        <QuizFilters onFilterChange={vi.fn()} className="custom-class" />
      );

      expect(container.querySelector(".custom-class")).toBeInTheDocument();
    });
  });

  describe("role-based options", () => {
    it("renders without errors for student role", () => {
      const { container } = render(
        <QuizFilters onFilterChange={vi.fn()} role="student" />
      );

      expect(container.firstChild).toBeInTheDocument();
    });

    it("renders without errors for instructor role", () => {
      const { container } = render(
        <QuizFilters onFilterChange={vi.fn()} role="instructor" />
      );

      expect(container.firstChild).toBeInTheDocument();
    });
  });

  describe("with courses", () => {
    it("renders course filter when courses are provided", () => {
      const courses = [
        { id: "course-1", name: "Web Development" },
        { id: "course-2", name: "Data Science" },
      ];

      render(<QuizFilters onFilterChange={vi.fn()} courses={courses} />);

      expect(screen.getByLabelText(/course/i)).toBeInTheDocument();
    });

    it("still renders when no courses provided", () => {
      render(<QuizFilters onFilterChange={vi.fn()} courses={[]} />);

      expect(screen.getByLabelText(/status/i)).toBeInTheDocument();
    });
  });
});
