/**
 * EnrolledCoursesWidget Component Tests
 * REQ-FE-211: Enrolled Courses Progress Widget
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { ReactNode } from "react";
import { EnrolledCoursesWidget } from "../EnrolledCoursesWidget";
import * as hooksModule from "~/hooks/dashboard/useStudentDashboard";

// Mock the hooks
vi.mock("~/hooks/dashboard/useStudentDashboard", () => ({
  useEnrolledCourses: vi.fn(),
}));

// Mock Next.js Link
vi.mock("next/link", () => ({
  default: ({
    children,
    href,
  }: {
    children: ReactNode;
    href: string;
  }) => <a href={href}>{children}</a>,
}));

// Create wrapper for TanStack Query
function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });

  return function Wrapper({ children }: { children: ReactNode }) {
    return (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );
  };
}

describe("EnrolledCoursesWidget", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("loading state", () => {
    it("shows loading skeleton when data is loading", () => {
      vi.mocked(hooksModule.useEnrolledCourses).mockReturnValue({
        data: undefined,
        isLoading: true,
        isError: false,
        error: null,
      } as ReturnType<typeof hooksModule.useEnrolledCourses>);

      render(<EnrolledCoursesWidget />, { wrapper: createWrapper() });

      // Should show widget title
      expect(screen.getByText("My Courses")).toBeInTheDocument();
    });
  });

  describe("error state", () => {
    it("shows error message when fetch fails", () => {
      vi.mocked(hooksModule.useEnrolledCourses).mockReturnValue({
        data: undefined,
        isLoading: false,
        isError: true,
        error: new Error("Failed to load courses"),
      } as ReturnType<typeof hooksModule.useEnrolledCourses>);

      render(<EnrolledCoursesWidget />, { wrapper: createWrapper() });

      expect(screen.getByText(/failed to load courses/i)).toBeInTheDocument();
    });
  });

  describe("empty state", () => {
    it("shows empty state when no courses", () => {
      const emptyCourses: {
        id: string;
        title: string;
        instructorName: string;
        progressPercent: number;
        lastAccessedAt: Date;
      }[] = [];
      vi.mocked(hooksModule.useEnrolledCourses).mockReturnValue({
        data: emptyCourses,
        isLoading: false,
        isError: false,
        error: null,
      } as ReturnType<typeof hooksModule.useEnrolledCourses>);

      render(<EnrolledCoursesWidget />, { wrapper: createWrapper() });

      expect(screen.getByText(/haven't enrolled in any courses/i)).toBeInTheDocument();
    });

    it("shows browse courses link in empty state", () => {
      const emptyCourses: {
        id: string;
        title: string;
        instructorName: string;
        progressPercent: number;
        lastAccessedAt: Date;
      }[] = [];
      vi.mocked(hooksModule.useEnrolledCourses).mockReturnValue({
        data: emptyCourses,
        isLoading: false,
        isError: false,
        error: null,
      } as ReturnType<typeof hooksModule.useEnrolledCourses>);

      render(<EnrolledCoursesWidget />, { wrapper: createWrapper() });

      const link = screen.getByRole("link", { name: /browse courses/i });
      expect(link).toHaveAttribute("href", "/courses");
    });
  });

  describe("data state", () => {
    it("displays enrolled courses with progress", () => {
      const mockCourses: {
        id: string;
        title: string;
        instructorName: string;
        progressPercent: number;
        lastAccessedAt: Date;
      }[] = [
        {
          id: "1",
          title: "Introduction to React",
          instructorName: "John Doe",
          progressPercent: 75,
          lastAccessedAt: new Date("2026-02-18T10:00:00Z"),
        },
        {
          id: "2",
          title: "Advanced TypeScript",
          instructorName: "Jane Smith",
          progressPercent: 50,
          lastAccessedAt: new Date("2026-02-17T15:30:00Z"),
        },
      ];

      vi.mocked(hooksModule.useEnrolledCourses).mockReturnValue({
        data: mockCourses,
        isLoading: false,
        isError: false,
        error: null,
      } as ReturnType<typeof hooksModule.useEnrolledCourses>);

      render(<EnrolledCoursesWidget />, { wrapper: createWrapper() });

      expect(screen.getByText("Introduction to React")).toBeInTheDocument();
      expect(screen.getByText("Advanced TypeScript")).toBeInTheDocument();
      expect(screen.getByText("John Doe")).toBeInTheDocument();
      expect(screen.getByText("Jane Smith")).toBeInTheDocument();
    });

    it("shows progress percentage for each course", () => {
      const mockCourses: {
        id: string;
        title: string;
        instructorName: string;
        progressPercent: number;
        lastAccessedAt: Date;
      }[] = [
        {
          id: "1",
          title: "Introduction to React",
          instructorName: "John Doe",
          progressPercent: 75,
          lastAccessedAt: new Date("2026-02-18T10:00:00Z"),
        },
      ];

      vi.mocked(hooksModule.useEnrolledCourses).mockReturnValue({
        data: mockCourses,
        isLoading: false,
        isError: false,
        error: null,
      } as ReturnType<typeof hooksModule.useEnrolledCourses>);

      render(<EnrolledCoursesWidget />, { wrapper: createWrapper() });

      expect(screen.getByText("75%")).toBeInTheDocument();
    });

    it("limits display to 5 courses maximum", () => {
      const mockCourses: {
        id: string;
        title: string;
        instructorName: string;
        progressPercent: number;
        lastAccessedAt: Date;
      }[] = Array.from({ length: 7 }, (_, i) => ({
        id: String(i + 1),
        title: `Course ${String(i + 1)}`,
        instructorName: `Instructor ${String(i + 1)}`,
        progressPercent: (i + 1) * 10,
        lastAccessedAt: new Date("2026-02-18T10:00:00Z"),
      }));

      vi.mocked(hooksModule.useEnrolledCourses).mockReturnValue({
        data: mockCourses,
        isLoading: false,
        isError: false,
        error: null,
      } as ReturnType<typeof hooksModule.useEnrolledCourses>);

      render(<EnrolledCoursesWidget />, { wrapper: createWrapper() });

      // Should only show 5 courses
      expect(screen.getByText("Course 1")).toBeInTheDocument();
      expect(screen.getByText("Course 5")).toBeInTheDocument();
      expect(screen.queryByText("Course 6")).not.toBeInTheDocument();
      expect(screen.queryByText("Course 7")).not.toBeInTheDocument();
    });

    it("shows view all courses link", () => {
      vi.mocked(hooksModule.useEnrolledCourses).mockReturnValue({
        data: [
          {
            id: "1",
            title: "Test Course",
            instructorName: "Instructor",
            progressPercent: 50,
            lastAccessedAt: new Date("2026-02-18T10:00:00Z"),
          },
        ],
        isLoading: false,
        isError: false,
        error: null,
      } as ReturnType<typeof hooksModule.useEnrolledCourses>);

      render(<EnrolledCoursesWidget />, { wrapper: createWrapper() });

      const viewAllLink = screen.getByRole("link", { name: /view all/i });
      expect(viewAllLink).toHaveAttribute("href", "/courses");
    });
  });
});
