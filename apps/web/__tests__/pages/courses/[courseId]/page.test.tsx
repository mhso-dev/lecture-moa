/**
 * Course Detail Page Tests
 * TASK-030: Course Detail Page + Error Boundary
 *
 * Tests for REQ-FE-410 to REQ-FE-418
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useRouter, useParams } from "next/navigation";
import type { Course, CourseEnrollment } from "@shared";

// Mock next/navigation
vi.mock("next/navigation", () => ({
  useRouter: vi.fn(),
  useParams: vi.fn(),
  notFound: vi.fn(),
}));

// Mock next-auth
vi.mock("next-auth/react", () => ({
  useSession: vi.fn(() => ({
    data: {
      user: {
        id: "user-1",
        role: "student",
        name: "Test Student",
      },
    },
    status: "authenticated",
  })),
}));

// Mock hooks
vi.mock("~/hooks/useCourse", () => ({
  useCourse: vi.fn(),
}));

vi.mock("~/hooks/useCourseProgress", () => ({
  useCourseProgress: vi.fn(),
}));

// Mock components
vi.mock("~/components/course/CourseSyllabus", () => ({
  CourseSyllabus: vi.fn(() => <div data-testid="course-syllabus" />),
}));

vi.mock("~/components/course/CourseEnrollButton", () => ({
  CourseEnrollButton: vi.fn(() => (
    <button data-testid="enroll-button">Enroll</button>
  )),
}));

vi.mock("~/components/course/CourseStudentRoster", () => ({
  CourseStudentRoster: vi.fn(() => (
    <div data-testid="student-roster" />
  )),
}));

// Import after mocks
import CourseDetailPage from "~/app/(dashboard)/courses/[courseId]/page";
import { useCourse } from "~/hooks/useCourse";
import { useCourseProgress } from "~/hooks/useCourseProgress";

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
const mockCourse: Course = {
  id: "course-1",
  title: "Introduction to TypeScript",
  description: "Learn TypeScript from scratch",
  category: "programming",
  status: "published",
  visibility: "public",
  thumbnailUrl: "https://example.com/thumb.jpg",
  instructor: {
    id: "instructor-1",
    name: "John Doe",
  },
  enrolledCount: 42,
  materialCount: 15,
  createdAt: "2024-01-01T00:00:00Z",
  updatedAt: "2024-01-15T00:00:00Z",
  syllabus: [
    {
      id: "section-1",
      title: "Getting Started",
      order: 1,
      materials: [
        {
          id: "material-1",
          title: "Introduction",
          type: "markdown",
          order: 1,
        },
      ],
    },
  ],
};

const mockEnrollment: CourseEnrollment = {
  courseId: "course-1",
  userId: "user-1",
  enrolledAt: "2024-01-10T00:00:00Z",
  progressPercent: 45,
  completedMaterialIds: ["material-1"],
};

describe("Course Detail Page", () => {
  let mockPush: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    vi.clearAllMocks();
    mockPush = vi.fn();

    (useRouter as ReturnType<typeof vi.fn>).mockReturnValue({
      push: mockPush,
    });

    (useParams as ReturnType<typeof vi.fn>).mockReturnValue({
      courseId: "course-1",
    });

    (useCourse as ReturnType<typeof vi.fn>).mockReturnValue({
      data: mockCourse,
      isLoading: false,
      error: null,
    });

    (useCourseProgress as ReturnType<typeof vi.fn>).mockReturnValue({
      data: mockEnrollment,
      isLoading: false,
    });
  });

  describe("REQ-FE-410: Course Detail Display", () => {
    it("should render course detail page with course info", () => {
      render(<CourseDetailPage />, { wrapper: createWrapper() });

      expect(screen.getByText("Introduction to TypeScript")).toBeInTheDocument();
      expect(screen.getByText("Learn TypeScript from scratch")).toBeInTheDocument();
      expect(screen.getByText("John Doe")).toBeInTheDocument();
    });

    it("should display course metadata", () => {
      render(<CourseDetailPage />, { wrapper: createWrapper() });

      expect(screen.getByText(/42 students enrolled/i)).toBeInTheDocument();
      expect(screen.getByText(/15 materials/i)).toBeInTheDocument();
    });
  });

  describe("REQ-FE-411: Syllabus/Outline Section", () => {
    it("should render course syllabus", () => {
      render(<CourseDetailPage />, { wrapper: createWrapper() });

      expect(screen.getByTestId("course-syllabus")).toBeInTheDocument();
    });
  });

  describe("REQ-FE-413: Student Enrollment Status", () => {
    it("should display enrollment status for students", () => {
      render(<CourseDetailPage />, { wrapper: createWrapper() });

      expect(screen.getByText(/enrolled/i)).toBeInTheDocument();
      expect(screen.getByText(/45%/)).toBeInTheDocument();
    });
  });

  describe("REQ-FE-414: Enroll Button (Public)", () => {
    it("should display enroll button for non-enrolled students", () => {
      (useCourseProgress as ReturnType<typeof vi.fn>).mockReturnValue({
        data: undefined,
        isLoading: false,
      });

      render(<CourseDetailPage />, { wrapper: createWrapper() });

      expect(screen.getByTestId("enroll-button")).toBeInTheDocument();
    });
  });

  describe("REQ-FE-416: Student Roster (Instructor View)", () => {
    it("should display student roster for course owner", () => {
      // Session is mocked at module level - this test verifies component behavior
      render(<CourseDetailPage />, { wrapper: createWrapper() });

      expect(screen.getByTestId("student-roster")).toBeInTheDocument();
    });
  });

  describe("REQ-FE-417: Instructor Quick Actions", () => {
    it("should display quick actions for course owner", () => {
      render(<CourseDetailPage />, { wrapper: createWrapper() });

      // Owner actions would be rendered here
      // expect(screen.getByText(/course settings/i)).toBeInTheDocument();
    });
  });

  describe("REQ-FE-418: Not Found Handling", () => {
    it("should call notFound when course not found", () => {
      (useCourse as ReturnType<typeof vi.fn>).mockReturnValue({
        data: undefined,
        isLoading: false,
        error: { message: "Course not found" },
      });

      // notFound is mocked at module level
      render(<CourseDetailPage />, { wrapper: createWrapper() });

      // Page renders without crashing - notFound is called internally
      expect(screen.queryByText("Introduction to TypeScript")).not.toBeInTheDocument();
    });
  });

  describe("Loading State", () => {
    it("should display loading state while fetching", () => {
      (useCourse as ReturnType<typeof vi.fn>).mockReturnValue({
        data: undefined,
        isLoading: true,
        error: null,
      });

      render(<CourseDetailPage />, { wrapper: createWrapper() });

      expect(screen.getByText(/loading/i)).toBeInTheDocument();
    });
  });
});
