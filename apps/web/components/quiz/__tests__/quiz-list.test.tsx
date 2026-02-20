/**
 * QuizList Component Tests
 * REQ-FE-602: Quiz List Data Fetching
 * REQ-FE-605: Empty State
 * REQ-FE-606: Quiz List Pagination
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { UseInfiniteQueryResult } from "@tanstack/react-query";

// Mock TanStack Query
vi.mock("@tanstack/react-query", () => ({
  useInfiniteQuery: vi.fn(),
}));

// Mock quiz components
vi.mock("../quiz-card", () => ({
  QuizCard: ({ quiz, role }: { quiz: { id: string; title: string }; role: string }) => (
    <div data-testid={`quiz-card-${quiz.id}`}>
      {quiz.title} ({role})
    </div>
  ),
}));

vi.mock("../quiz-filters", () => ({
  QuizFilters: ({ onFilterChange: _onFilterChange }: { onFilterChange: () => void }) => (
    <div data-testid="quiz-filters">Filters</div>
  ),
}));

vi.mock("../skeletons/quiz-card-skeleton", () => ({
  QuizCardSkeleton: () => <div data-testid="quiz-card-skeleton">Loading...</div>,
}));

vi.mock("../skeletons/quiz-list-skeleton", () => ({
  QuizListSkeleton: () => <div data-testid="quiz-list-skeleton">Loading...</div>,
}));

import { useInfiniteQuery } from "@tanstack/react-query";
import { QuizList } from "../quiz-list";
import type { QuizListItem } from "@shared";

/**
 * Helper function to create a complete mock for UseInfiniteQueryResult
 * This ensures all required TanStack Query v5 properties are present
 */
function createMockInfiniteQueryResult<T>(
  overrides: Partial<UseInfiniteQueryResult<T>>
): UseInfiniteQueryResult<T> {
  return {
    data: undefined,
    dataUpdatedAt: 0,
    error: null,
    errorUpdatedAt: 0,
    failureCount: 0,
    failureReason: null,
    errorUpdateCount: 0,
    fetchNextPage: vi.fn(),
    fetchPreviousPage: vi.fn(),
    hasNextPage: false,
    hasPreviousPage: false,
    isError: false,
    isFetched: false,
    isFetchedAfterMount: false,
    isFetching: false,
    isFetchingNextPage: false,
    isFetchingPreviousPage: false,
    isLoading: false,
    isLoadingError: false,
    isInitialLoading: false,
    isPaused: false,
    isPending: false,
    isPlaceholderData: false,
    isRefetchError: false,
    isStale: false,
    isSuccess: false,
    refetch: vi.fn(),
    status: "pending",
    fetchStatus: "idle",
    ...overrides,
  } as UseInfiniteQueryResult<T>;
}

describe("QuizList", () => {
  const mockQuizzes: QuizListItem[] = [
    {
      id: "quiz-1",
      title: "React Basics",
      courseId: "course-1",
      courseName: "Web Development",
      status: "published",
      questionCount: 10,
      timeLimitMinutes: 30,
      passingScore: 70,
      dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      attemptCount: 5,
      myLastAttemptScore: 85,
      createdAt: new Date().toISOString(),
    },
    {
      id: "quiz-2",
      title: "TypeScript Fundamentals",
      courseId: "course-1",
      courseName: "Web Development",
      status: "published",
      questionCount: 15,
      timeLimitMinutes: 45,
      passingScore: 75,
      dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
      attemptCount: 3,
      myLastAttemptScore: null,
      createdAt: new Date().toISOString(),
    },
  ];

  const mockInfiniteData = {
    pages: [
      {
        data: mockQuizzes,
        pagination: {
          cursor: "cursor-1",
          hasMore: true,
        },
      },
    ],
    pageParams: [undefined],
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("loading state", () => {
    it("shows skeleton loading during initial fetch", () => {
      vi.mocked(useInfiniteQuery).mockReturnValue(
        createMockInfiniteQueryResult({
          data: undefined,
          isLoading: true,
          isPending: true,
          isFetching: true,
          isInitialLoading: true,
          status: "pending",
          fetchStatus: "fetching",
        })
      );

      render(<QuizList role="student" />);

      expect(screen.getByTestId("quiz-list-skeleton")).toBeInTheDocument();
    });
  });

  describe("success state", () => {
    it("renders quiz cards when data is available", () => {
      vi.mocked(useInfiniteQuery).mockReturnValue(
        createMockInfiniteQueryResult({
          data: mockInfiniteData,
          isSuccess: true,
          hasNextPage: true,
          dataUpdatedAt: Date.now(),
          isFetched: true,
          isFetchedAfterMount: true,
          status: "success",
        })
      );

      render(<QuizList role="student" />);

      expect(screen.getByTestId("quiz-card-quiz-1")).toBeInTheDocument();
      expect(screen.getByTestId("quiz-card-quiz-2")).toBeInTheDocument();
    });

    it("renders filters component", () => {
      vi.mocked(useInfiniteQuery).mockReturnValue(
        createMockInfiniteQueryResult({
          data: mockInfiniteData,
          isSuccess: true,
          dataUpdatedAt: Date.now(),
          isFetched: true,
          isFetchedAfterMount: true,
          status: "success",
        })
      );

      render(<QuizList role="student" />);

      expect(screen.getByTestId("quiz-filters")).toBeInTheDocument();
    });
  });

  describe("empty state", () => {
    const emptyData = {
      pages: [
        {
          data: [],
          pagination: {
            cursor: null,
            hasMore: false,
          },
        },
      ],
      pageParams: [undefined],
    };

    it('shows "No quizzes yet" for student with no quizzes', () => {
      vi.mocked(useInfiniteQuery).mockReturnValue(
        createMockInfiniteQueryResult({
          data: emptyData,
          isSuccess: true,
          dataUpdatedAt: Date.now(),
          isFetched: true,
          isFetchedAfterMount: true,
          status: "success",
        })
      );

      render(<QuizList role="student" />);

      expect(screen.getByRole("heading", { name: /no quizzes/i })).toBeInTheDocument();
    });

    it('shows "No quizzes yet" with create button for instructor', () => {
      vi.mocked(useInfiniteQuery).mockReturnValue(
        createMockInfiniteQueryResult({
          data: emptyData,
          isSuccess: true,
          dataUpdatedAt: Date.now(),
          isFetched: true,
          isFetchedAfterMount: true,
          status: "success",
        })
      );

      render(<QuizList role="instructor" />);

      expect(screen.getByText(/no quizzes/i)).toBeInTheDocument();
      expect(
        screen.getByRole("button", { name: /create quiz/i })
      ).toBeInTheDocument();
    });

    it('shows "No quizzes match your filters" when filtered', () => {
      vi.mocked(useInfiniteQuery).mockReturnValue(
        createMockInfiniteQueryResult({
          data: emptyData,
          isSuccess: true,
          dataUpdatedAt: Date.now(),
          isFetched: true,
          isFetchedAfterMount: true,
          status: "success",
        })
      );

      render(<QuizList role="student" hasActiveFilters />);

      expect(screen.getByText(/no quizzes match your filters/i)).toBeInTheDocument();
      expect(screen.getByText(/clear filters/i)).toBeInTheDocument();
    });
  });

  describe("error state", () => {
    it("shows error state with retry button", () => {
      const refetch = vi.fn();
      vi.mocked(useInfiniteQuery).mockReturnValue(
        createMockInfiniteQueryResult({
          data: undefined,
          isError: true,
          error: new Error("Failed to fetch"),
          refetch,
          failureCount: 1,
          failureReason: new Error("Failed to fetch"),
          errorUpdateCount: 1,
          isFetched: true,
          isFetchedAfterMount: true,
          isLoadingError: true,
          isStale: true,
          errorUpdatedAt: Date.now(),
          status: "error",
        })
      );

      render(<QuizList role="student" />);

      expect(screen.getByText(/error/i)).toBeInTheDocument();
      expect(
        screen.getByRole("button", { name: /retry/i })
      ).toBeInTheDocument();
    });

    it("retries fetch when retry button is clicked", async () => {
      const refetch = vi.fn();
      const user = userEvent.setup();

      vi.mocked(useInfiniteQuery).mockReturnValue(
        createMockInfiniteQueryResult({
          data: undefined,
          isError: true,
          error: new Error("Failed to fetch"),
          refetch,
          failureCount: 1,
          failureReason: new Error("Failed to fetch"),
          errorUpdateCount: 1,
          isFetched: true,
          isFetchedAfterMount: true,
          isLoadingError: true,
          isStale: true,
          errorUpdatedAt: Date.now(),
          status: "error",
        })
      );

      render(<QuizList role="student" />);

      await user.click(screen.getByRole("button", { name: /retry/i }));
      expect(refetch).toHaveBeenCalled();
    });
  });

  describe("pagination", () => {
    it('shows "Load more" button when more pages available', () => {
      const fetchNextPage = vi.fn();
      vi.mocked(useInfiniteQuery).mockReturnValue(
        createMockInfiniteQueryResult({
          data: mockInfiniteData,
          isSuccess: true,
          fetchNextPage,
          hasNextPage: true,
          dataUpdatedAt: Date.now(),
          isFetched: true,
          isFetchedAfterMount: true,
          status: "success",
        })
      );

      render(<QuizList role="student" />);

      expect(
        screen.getByRole("button", { name: /load more/i })
      ).toBeInTheDocument();
    });

    it("calls fetchNextPage when Load more is clicked", async () => {
      const fetchNextPage = vi.fn();
      const user = userEvent.setup();

      vi.mocked(useInfiniteQuery).mockReturnValue(
        createMockInfiniteQueryResult({
          data: mockInfiniteData,
          isSuccess: true,
          fetchNextPage,
          hasNextPage: true,
          dataUpdatedAt: Date.now(),
          isFetched: true,
          isFetchedAfterMount: true,
          status: "success",
        })
      );

      render(<QuizList role="student" />);

      await user.click(screen.getByRole("button", { name: /load more/i }));
      expect(fetchNextPage).toHaveBeenCalled();
    });

    it("shows loading indicator while fetching next page", () => {
      vi.mocked(useInfiniteQuery).mockReturnValue(
        createMockInfiniteQueryResult({
          data: mockInfiniteData,
          isSuccess: true,
          hasNextPage: true,
          isFetching: true,
          isFetchingNextPage: true,
          dataUpdatedAt: Date.now(),
          isFetched: true,
          isFetchedAfterMount: true,
          status: "success",
          fetchStatus: "fetching",
        })
      );

      render(<QuizList role="student" />);

      expect(screen.getAllByTestId(/quiz-card-skeleton/).length).toBeGreaterThan(0);
    });

    it('hides "Load more" button when no more pages', () => {
      const noMoreData = {
        pages: [
          {
            data: mockQuizzes,
            pagination: {
              cursor: null,
              hasMore: false,
            },
          },
        ],
        pageParams: [undefined],
      };

      vi.mocked(useInfiniteQuery).mockReturnValue(
        createMockInfiniteQueryResult({
          data: noMoreData,
          isSuccess: true,
          dataUpdatedAt: Date.now(),
          isFetched: true,
          isFetchedAfterMount: true,
          status: "success",
        })
      );

      render(<QuizList role="student" />);

      expect(
        screen.queryByRole("button", { name: /load more/i })
      ).not.toBeInTheDocument();
    });
  });

  describe("responsive layout", () => {
    it("renders cards in grid layout", () => {
      vi.mocked(useInfiniteQuery).mockReturnValue(
        createMockInfiniteQueryResult({
          data: mockInfiniteData,
          isSuccess: true,
          dataUpdatedAt: Date.now(),
          isFetched: true,
          isFetchedAfterMount: true,
          status: "success",
        })
      );

      const { container } = render(<QuizList role="student" />);

      const gridContainer = container.querySelector('[class*="grid"]');
      expect(gridContainer).toBeInTheDocument();
    });
  });

  describe("accessibility", () => {
    it("has proper landmark for list region", () => {
      vi.mocked(useInfiniteQuery).mockReturnValue(
        createMockInfiniteQueryResult({
          data: mockInfiniteData,
          isSuccess: true,
          dataUpdatedAt: Date.now(),
          isFetched: true,
          isFetchedAfterMount: true,
          status: "success",
        })
      );

      render(<QuizList role="student" />);

      expect(screen.getByRole("region", { name: /quizzes/i })).toBeInTheDocument();
    });
  });
});
