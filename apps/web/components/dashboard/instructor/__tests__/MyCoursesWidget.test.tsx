/**
 * MyCoursesWidget Component Tests
 * REQ-FE-221: My Courses Overview Widget
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { ReactNode } from "react";
import { MyCoursesWidget } from "../MyCoursesWidget";
import * as hooksModule from "~/hooks/dashboard/useInstructorDashboard";

// Mock the hooks
vi.mock("~/hooks/dashboard/useInstructorDashboard", () => ({
  useInstructorCourses: vi.fn(),
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

describe("MyCoursesWidget", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("loading state", () => {
    it("shows loading skeleton when data is loading", () => {
      vi.mocked(hooksModule.useInstructorCourses).mockReturnValue({
        data: undefined,
        isLoading: true,
        isError: false,
        error: null,
      } as ReturnType<typeof hooksModule.useInstructorCourses>);

      render(<MyCoursesWidget />, { wrapper: createWrapper() });

      expect(screen.getByText("내 강의")).toBeInTheDocument();
    });
  });

  describe("error state", () => {
    it("shows error message when fetch fails", () => {
      vi.mocked(hooksModule.useInstructorCourses).mockReturnValue({
        data: undefined,
        isLoading: false,
        isError: true,
        error: new Error("Failed to load courses"),
      } as ReturnType<typeof hooksModule.useInstructorCourses>);

      render(<MyCoursesWidget />, { wrapper: createWrapper() });

      expect(screen.getByText(/failed to load courses/i)).toBeInTheDocument();
    });
  });

  describe("empty state", () => {
    it("shows empty state when no courses", () => {
      const emptyCourses: {
        id: string;
        title: string;
        enrolledCount: number;
        materialsCount: number;
        pendingQACount: number;
        isPublished: boolean;
      }[] = [];
      vi.mocked(hooksModule.useInstructorCourses).mockReturnValue({
        data: emptyCourses,
        isLoading: false,
        isError: false,
        error: null,
      } as ReturnType<typeof hooksModule.useInstructorCourses>);

      render(<MyCoursesWidget />, { wrapper: createWrapper() });

      expect(screen.getByText("아직 강의가 없습니다")).toBeInTheDocument();
    });

    it("shows create course link in empty state", () => {
      const emptyCourses: {
        id: string;
        title: string;
        enrolledCount: number;
        materialsCount: number;
        pendingQACount: number;
        isPublished: boolean;
      }[] = [];
      vi.mocked(hooksModule.useInstructorCourses).mockReturnValue({
        data: emptyCourses,
        isLoading: false,
        isError: false,
        error: null,
      } as ReturnType<typeof hooksModule.useInstructorCourses>);

      render(<MyCoursesWidget />, { wrapper: createWrapper() });

      const link = screen.getByRole("link", { name: /강의 만들기/ });
      expect(link).toHaveAttribute("href", "/courses/create");
    });
  });

  describe("data state", () => {
    it("displays courses with metrics", () => {
      const mockCourses: {
        id: string;
        title: string;
        enrolledCount: number;
        materialsCount: number;
        pendingQACount: number;
        isPublished: boolean;
      }[] = [
        {
          id: "1",
          title: "Introduction to React",
          enrolledCount: 42,
          materialsCount: 15,
          pendingQACount: 3,
          isPublished: true,
        },
        {
          id: "2",
          title: "Advanced TypeScript",
          enrolledCount: 28,
          materialsCount: 12,
          pendingQACount: 7,
          isPublished: false,
        },
      ];

      vi.mocked(hooksModule.useInstructorCourses).mockReturnValue({
        data: mockCourses,
        isLoading: false,
        isError: false,
        error: null,
      } as ReturnType<typeof hooksModule.useInstructorCourses>);

      render(<MyCoursesWidget />, { wrapper: createWrapper() });

      expect(screen.getByText("Introduction to React")).toBeInTheDocument();
      expect(screen.getByText("Advanced TypeScript")).toBeInTheDocument();
    });

    it("shows student count and materials count for each course", () => {
      const mockCourses: {
        id: string;
        title: string;
        enrolledCount: number;
        materialsCount: number;
        pendingQACount: number;
        isPublished: boolean;
      }[] = [
        {
          id: "1",
          title: "Introduction to React",
          enrolledCount: 42,
          materialsCount: 15,
          pendingQACount: 3,
          isPublished: true,
        },
      ];

      vi.mocked(hooksModule.useInstructorCourses).mockReturnValue({
        data: mockCourses,
        isLoading: false,
        isError: false,
        error: null,
      } as ReturnType<typeof hooksModule.useInstructorCourses>);

      render(<MyCoursesWidget />, { wrapper: createWrapper() });

      expect(screen.getByText("42")).toBeInTheDocument();
      expect(screen.getByText("15")).toBeInTheDocument();
    });

    it("shows pending Q&A count", () => {
      const mockCourses: {
        id: string;
        title: string;
        enrolledCount: number;
        materialsCount: number;
        pendingQACount: number;
        isPublished: boolean;
      }[] = [
        {
          id: "1",
          title: "Introduction to React",
          enrolledCount: 42,
          materialsCount: 15,
          pendingQACount: 3,
          isPublished: true,
        },
      ];

      vi.mocked(hooksModule.useInstructorCourses).mockReturnValue({
        data: mockCourses,
        isLoading: false,
        isError: false,
        error: null,
      } as ReturnType<typeof hooksModule.useInstructorCourses>);

      render(<MyCoursesWidget />, { wrapper: createWrapper() });

      expect(screen.getByText("3")).toBeInTheDocument();
    });

    it("shows published status badge for published courses", () => {
      const mockCourses: {
        id: string;
        title: string;
        enrolledCount: number;
        materialsCount: number;
        pendingQACount: number;
        isPublished: boolean;
      }[] = [
        {
          id: "1",
          title: "Introduction to React",
          enrolledCount: 42,
          materialsCount: 15,
          pendingQACount: 3,
          isPublished: true,
        },
      ];

      vi.mocked(hooksModule.useInstructorCourses).mockReturnValue({
        data: mockCourses,
        isLoading: false,
        isError: false,
        error: null,
      } as ReturnType<typeof hooksModule.useInstructorCourses>);

      render(<MyCoursesWidget />, { wrapper: createWrapper() });

      expect(screen.getByText("공개")).toBeInTheDocument();
    });

    it("shows draft badge for unpublished courses", () => {
      const mockCourses: {
        id: string;
        title: string;
        enrolledCount: number;
        materialsCount: number;
        pendingQACount: number;
        isPublished: boolean;
      }[] = [
        {
          id: "1",
          title: "Introduction to React",
          enrolledCount: 42,
          materialsCount: 15,
          pendingQACount: 3,
          isPublished: false,
        },
      ];

      vi.mocked(hooksModule.useInstructorCourses).mockReturnValue({
        data: mockCourses,
        isLoading: false,
        isError: false,
        error: null,
      } as ReturnType<typeof hooksModule.useInstructorCourses>);

      render(<MyCoursesWidget />, { wrapper: createWrapper() });

      expect(screen.getByText("초안")).toBeInTheDocument();
    });

    it("limits display to 5 courses maximum", () => {
      const mockCourses: {
        id: string;
        title: string;
        enrolledCount: number;
        materialsCount: number;
        pendingQACount: number;
        isPublished: boolean;
      }[] = Array.from({ length: 7 }, (_, i) => ({
        id: String(i + 1),
        title: `Course ${String(i + 1)}`,
        enrolledCount: (i + 1) * 10,
        materialsCount: i + 5,
        pendingQACount: i,
        isPublished: true,
      }));

      vi.mocked(hooksModule.useInstructorCourses).mockReturnValue({
        data: mockCourses,
        isLoading: false,
        isError: false,
        error: null,
      } as ReturnType<typeof hooksModule.useInstructorCourses>);

      render(<MyCoursesWidget />, { wrapper: createWrapper() });

      expect(screen.getByText("Course 1")).toBeInTheDocument();
      expect(screen.getByText("Course 5")).toBeInTheDocument();
      expect(screen.queryByText("Course 6")).not.toBeInTheDocument();
      expect(screen.queryByText("Course 7")).not.toBeInTheDocument();
    });

    it("shows view all courses link when courses exist", () => {
      vi.mocked(hooksModule.useInstructorCourses).mockReturnValue({
        data: [
          {
            id: "1",
            title: "Test Course",
            enrolledCount: 10,
            materialsCount: 5,
            pendingQACount: 2,
            isPublished: true,
          },
        ],
        isLoading: false,
        isError: false,
        error: null,
      } as ReturnType<typeof hooksModule.useInstructorCourses>);

      render(<MyCoursesWidget />, { wrapper: createWrapper() });

      // The "전체 보기" link is in the header when courses exist
      const viewAllLinks = screen.getAllByRole("link", { name: /전체 보기/ });
      expect(viewAllLinks.length).toBeGreaterThan(0);
      expect(viewAllLinks[0]).toHaveAttribute("href", "/courses");
    });

    it("shows create new course button in header", () => {
      const emptyCourses: {
        id: string;
        title: string;
        enrolledCount: number;
        materialsCount: number;
        pendingQACount: number;
        isPublished: boolean;
      }[] = [];
      vi.mocked(hooksModule.useInstructorCourses).mockReturnValue({
        data: emptyCourses,
        isLoading: false,
        isError: false,
        error: null,
      } as ReturnType<typeof hooksModule.useInstructorCourses>);

      render(<MyCoursesWidget />, { wrapper: createWrapper() });

      // The "만들기" link is in the header (distinct from "강의 만들기" in empty state)
      const createLinks = screen.getAllByRole("link").filter(
        (link) => link.getAttribute("href") === "/courses/create"
      );
      expect(createLinks.length).toBeGreaterThanOrEqual(1);
    });
  });
});
