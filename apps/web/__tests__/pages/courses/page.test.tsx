/**
 * Course List Page Tests
 * TASK-023: Course List Page
 *
 * Tests for REQ-FE-400 to REQ-FE-408
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useRouter, useSearchParams } from "next/navigation";
import type { PaginatedCourseList, CourseListItem } from "@shared";

// Mock next/navigation
vi.mock("next/navigation", () => ({
  useRouter: vi.fn(),
  useSearchParams: vi.fn(),
}));

// Mock useSession from next-auth
vi.mock("next-auth/react", () => ({
  useSession: vi.fn(() => ({
    data: {
      user: {
        id: "user-1",
        role: "instructor",
        name: "Test Instructor",
      },
    },
    status: "authenticated",
  })),
}));

// Mock hooks
vi.mock("~/hooks/useCourses", () => ({
  useCourses: vi.fn(),
}));

// Mock components
vi.mock("~/components/course", () => ({
  CourseSearchBar: vi.fn(({ onSearch }) => (
    <input
      data-testid="course-search-bar"
      placeholder="Search courses..."
      onChange={(e) => onSearch?.(e.target.value)}
    />
  )),
  CourseFilter: vi.fn(() => <div data-testid="course-filter" />),
  CourseGrid: vi.fn(({ courses, isLoading }) => {
    if (isLoading) {
      return <div data-testid="course-grid-loading">Loading...</div>;
    }
    if (courses.length === 0) {
      return <div data-testid="empty-state">No courses yet</div>;
    }
    return (
      <div data-testid="course-grid" role="list">
        {courses.map((course: CourseListItem) => (
          <div key={course.id} role="listitem">
            {course.title}
          </div>
        ))}
      </div>
    );
  }),
  CourseList: vi.fn(({ courses, isLoading }) => {
    if (isLoading) {
      return <div data-testid="course-list-loading">Loading...</div>;
    }
    if (courses.length === 0) {
      return <div data-testid="empty-state">No courses yet</div>;
    }
    return (
      <div data-testid="course-list" role="list">
        {courses.map((course: CourseListItem) => (
          <div key={course.id} role="listitem">
            {course.title}
          </div>
        ))}
      </div>
    );
  }),
}));

// Import after mocks
import CourseListPage from "~/app/(dashboard)/courses/page";
import { useCourses } from "~/hooks/useCourses";

// Test utilities
const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });

  return function Wrapper({ children }: { children: React.ReactNode }) {
    return (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );
  };
};

// Mock data
const mockCourses: CourseListItem[] = [
  {
    id: "course-1",
    title: "Introduction to TypeScript",
    description: "Learn TypeScript basics",
    category: "programming",
    status: "published",
    visibility: "public",
    thumbnailUrl: "https://example.com/thumb1.jpg",
    instructor: {
      id: "instructor-1",
      name: "John Doe",
    },
    enrolledCount: 42,
    materialCount: 15,
    createdAt: "2024-01-01T00:00:00Z",
    updatedAt: "2024-01-15T00:00:00Z",
  },
  {
    id: "course-2",
    title: "Advanced React Patterns",
    description: "Master React patterns",
    category: "programming",
    status: "published",
    visibility: "public",
    thumbnailUrl: "https://example.com/thumb2.jpg",
    instructor: {
      id: "instructor-2",
      name: "Jane Smith",
    },
    enrolledCount: 28,
    materialCount: 20,
    createdAt: "2024-01-02T00:00:00Z",
    updatedAt: "2024-01-16T00:00:00Z",
  },
];

const mockPaginatedResponse: PaginatedCourseList = {
  data: mockCourses,
  total: 2,
  page: 1,
  limit: 20,
};

describe("Course List Page", () => {
  let mockPush: ReturnType<typeof vi.fn>;
  let mockReplace: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    vi.clearAllMocks();
    mockPush = vi.fn();
    mockReplace = vi.fn();

    (useRouter as ReturnType<typeof vi.fn>).mockReturnValue({
      push: mockPush,
      replace: mockReplace,
    });

    (useSearchParams as ReturnType<typeof vi.fn>).mockReturnValue(
      new URLSearchParams()
    );

    (useCourses as ReturnType<typeof vi.fn>).mockReturnValue({
      data: mockPaginatedResponse,
      isLoading: false,
      error: null,
    });
  });

  describe("REQ-FE-400: Course List Display", () => {
    it("should render course list page with courses", () => {
      render(<CourseListPage />, { wrapper: createWrapper() });

      expect(screen.getByText("Courses")).toBeInTheDocument();
      expect(screen.getByTestId("course-grid")).toBeInTheDocument();
    });

    it("should display course titles in grid", () => {
      render(<CourseListPage />, { wrapper: createWrapper() });

      expect(screen.getByText("Introduction to TypeScript")).toBeInTheDocument();
      expect(screen.getByText("Advanced React Patterns")).toBeInTheDocument();
    });
  });

  describe("REQ-FE-401: Grid and List View Toggle", () => {
    it("should display view toggle button", () => {
      render(<CourseListPage />, { wrapper: createWrapper() });

      const viewToggle = screen.getByRole("button", {
        name: /switch to list view/i,
      });
      expect(viewToggle).toBeInTheDocument();
    });

    it("should toggle between grid and list view when clicked", async () => {
      const user = userEvent.setup();
      render(<CourseListPage />, { wrapper: createWrapper() });

      // Initially in grid view
      expect(screen.getByTestId("course-grid")).toBeInTheDocument();

      // Click toggle button
      const toggleButton = screen.getByRole("button", {
        name: /switch to list view/i,
      });
      await user.click(toggleButton);

      // Should switch to list view
      await waitFor(() => {
        expect(screen.getByTestId("course-list")).toBeInTheDocument();
      });
    });
  });

  describe("REQ-FE-402: Course Search", () => {
    it("should render search bar", () => {
      render(<CourseListPage />, { wrapper: createWrapper() });

      expect(screen.getByTestId("course-search-bar")).toBeInTheDocument();
    });

    it("should update search query when user types", async () => {
      const user = userEvent.setup();
      render(<CourseListPage />, { wrapper: createWrapper() });

      const searchInput = screen.getByTestId("course-search-bar");
      await user.type(searchInput, "TypeScript");

      // Search should be debounced (not testing debounce timing here)
      expect(searchInput).toHaveValue("TypeScript");
    });
  });

  describe("REQ-FE-403 & REQ-FE-404: Category Filter and Sort Options", () => {
    it("should render filter component", () => {
      render(<CourseListPage />, { wrapper: createWrapper() });

      expect(screen.getByTestId("course-filter")).toBeInTheDocument();
    });
  });

  describe("REQ-FE-406: Empty State", () => {
    it("should display empty state when no courses", () => {
      (useCourses as ReturnType<typeof vi.fn>).mockReturnValue({
        data: { data: [], total: 0, page: 1, limit: 20 },
        isLoading: false,
        error: null,
      });

      render(<CourseListPage />, { wrapper: createWrapper() });

      expect(screen.getByText(/no courses yet/i)).toBeInTheDocument();
    });
  });

  describe("REQ-FE-407: Loading Skeleton", () => {
    it("should display loading state while fetching", () => {
      (useCourses as ReturnType<typeof vi.fn>).mockReturnValue({
        data: undefined,
        isLoading: true,
        error: null,
      });

      render(<CourseListPage />, { wrapper: createWrapper() });

      expect(screen.getByTestId(/loading/i)).toBeInTheDocument();
    });
  });

  describe("REQ-FE-408: Role-based Create Button", () => {
    it("should display create button for instructors", () => {
      render(<CourseListPage />, { wrapper: createWrapper() });

      const createButton = screen.getByRole("button", {
        name: /create course/i,
      });
      expect(createButton).toBeInTheDocument();
    });

    it("should navigate to create page when button clicked", async () => {
      const user = userEvent.setup();
      render(<CourseListPage />, { wrapper: createWrapper() });

      const createButton = screen.getByRole("button", {
        name: /create course/i,
      });
      await user.click(createButton);

      expect(mockPush).toHaveBeenCalledWith("/courses/create");
    });
  });

  describe("REQ-FE-405: Pagination", () => {
    it("should display pagination controls when total exceeds limit", () => {
      (useCourses as ReturnType<typeof vi.fn>).mockReturnValue({
        data: {
          data: mockCourses,
          total: 50,
          page: 1,
          limit: 20,
        },
        isLoading: false,
        error: null,
      });

      render(<CourseListPage />, { wrapper: createWrapper() });

      // Pagination should be visible
      expect(screen.getByRole("navigation")).toBeInTheDocument();
    });
  });
});
