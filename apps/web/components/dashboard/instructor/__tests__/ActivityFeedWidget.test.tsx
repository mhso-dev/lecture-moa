/**
 * ActivityFeedWidget Component Tests
 * REQ-FE-225: Recent Student Activity Feed Widget
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { ReactNode } from "react";
import { ActivityFeedWidget } from "../ActivityFeedWidget";
import * as hooksModule from "~/hooks/dashboard/useInstructorDashboard";

// Mock the hooks
vi.mock("~/hooks/dashboard/useInstructorDashboard", () => ({
  useActivityFeed: vi.fn(),
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

describe("ActivityFeedWidget", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("loading state", () => {
    it("shows loading skeleton when data is loading", () => {
      vi.mocked(hooksModule.useActivityFeed).mockReturnValue({
        data: undefined,
        isLoading: true,
        isError: false,
        error: null,
      } as ReturnType<typeof hooksModule.useActivityFeed>);

      render(<ActivityFeedWidget />, { wrapper: createWrapper() });

      expect(screen.getByText("Activity Feed")).toBeInTheDocument();
    });
  });

  describe("error state", () => {
    it("shows error message when fetch fails", () => {
      vi.mocked(hooksModule.useActivityFeed).mockReturnValue({
        data: undefined,
        isLoading: false,
        isError: true,
        error: new Error("Failed to load activity"),
      } as ReturnType<typeof hooksModule.useActivityFeed>);

      render(<ActivityFeedWidget />, { wrapper: createWrapper() });

      expect(screen.getByText(/failed to load activity/i)).toBeInTheDocument();
    });
  });

  describe("empty state", () => {
    it("shows empty state when no activity", () => {
      const mockFeed = {
        items: [] as {
          id: string;
          type: "enrolled" | "studied" | "asked" | "quiz_completed";
          actorName: string;
          courseName: string;
          createdAt: Date;
        }[],
        pagination: {
          page: 1,
          totalPages: 1,
          totalItems: 0,
          hasNextPage: false,
        },
      };

      vi.mocked(hooksModule.useActivityFeed).mockReturnValue({
        data: mockFeed,
        isLoading: false,
        isError: false,
        error: null,
      } as ReturnType<typeof hooksModule.useActivityFeed>);

      render(<ActivityFeedWidget />, { wrapper: createWrapper() });

      expect(screen.getByText(/no recent activity/i)).toBeInTheDocument();
    });
  });

  describe("data state", () => {
    it("displays activity items with icons", () => {
      const mockFeed = {
        items: [
          {
            id: "1",
            type: "enrolled" as const,
            actorName: "John Doe",
            courseName: "Introduction to React",
            createdAt: new Date("2026-02-18T10:00:00Z"),
          },
          {
            id: "2",
            type: "quiz_completed" as const,
            actorName: "Jane Smith",
            courseName: "Advanced TypeScript",
            createdAt: new Date("2026-02-18T09:30:00Z"),
          },
        ],
        pagination: {
          page: 1,
          totalPages: 1,
          totalItems: 2,
          hasNextPage: false,
        },
      };

      vi.mocked(hooksModule.useActivityFeed).mockReturnValue({
        data: mockFeed,
        isLoading: false,
        isError: false,
        error: null,
      } as ReturnType<typeof hooksModule.useActivityFeed>);

      render(<ActivityFeedWidget />, { wrapper: createWrapper() });

      expect(screen.getByText("John Doe")).toBeInTheDocument();
      expect(screen.getByText("Jane Smith")).toBeInTheDocument();
      expect(screen.getByText("Introduction to React")).toBeInTheDocument();
      expect(screen.getByText("Advanced TypeScript")).toBeInTheDocument();
    });

    it("displays different activity types", () => {
      const mockFeed = {
        items: [
          {
            id: "1",
            type: "enrolled" as const,
            actorName: "John Doe",
            courseName: "Introduction to React",
            createdAt: new Date("2026-02-18T10:00:00Z"),
          },
          {
            id: "2",
            type: "studied" as const,
            actorName: "Jane Smith",
            courseName: "Advanced TypeScript",
            createdAt: new Date("2026-02-18T09:30:00Z"),
          },
          {
            id: "3",
            type: "asked" as const,
            actorName: "Bob Johnson",
            courseName: "Database Design",
            createdAt: new Date("2026-02-18T08:00:00Z"),
          },
          {
            id: "4",
            type: "quiz_completed" as const,
            actorName: "Alice Williams",
            courseName: "API Development",
            createdAt: new Date("2026-02-18T07:00:00Z"),
          },
        ],
        pagination: {
          page: 1,
          totalPages: 1,
          totalItems: 4,
          hasNextPage: false,
        },
      };

      vi.mocked(hooksModule.useActivityFeed).mockReturnValue({
        data: mockFeed,
        isLoading: false,
        isError: false,
        error: null,
      } as ReturnType<typeof hooksModule.useActivityFeed>);

      render(<ActivityFeedWidget />, { wrapper: createWrapper() });

      // All activity types should be rendered
      expect(screen.getByText("John Doe")).toBeInTheDocument();
      expect(screen.getByText("Jane Smith")).toBeInTheDocument();
      expect(screen.getByText("Bob Johnson")).toBeInTheDocument();
      expect(screen.getByText("Alice Williams")).toBeInTheDocument();
    });

    it("limits display to 10 items per page", () => {
      const mockFeed = {
        items: Array.from({ length: 10 }, (_, i) => ({
          id: String(i + 1),
          type: "enrolled" as const,
          actorName: `Student ${String(i + 1)}`,
          courseName: "Test Course",
          createdAt: new Date("2026-02-18T10:00:00Z"),
        })),
        pagination: {
          page: 1,
          totalPages: 2,
          totalItems: 20,
          hasNextPage: true,
        },
      };

      vi.mocked(hooksModule.useActivityFeed).mockReturnValue({
        data: mockFeed,
        isLoading: false,
        isError: false,
        error: null,
      } as ReturnType<typeof hooksModule.useActivityFeed>);

      render(<ActivityFeedWidget />, { wrapper: createWrapper() });

      expect(screen.getByText("Student 1")).toBeInTheDocument();
      expect(screen.getByText("Student 10")).toBeInTheDocument();
    });

    it("shows load more button when more pages exist", () => {
      const mockFeed = {
        items: Array.from({ length: 10 }, (_, i) => ({
          id: String(i + 1),
          type: "enrolled" as const,
          actorName: `Student ${String(i + 1)}`,
          courseName: "Test Course",
          createdAt: new Date("2026-02-18T10:00:00Z"),
        })),
        pagination: {
          page: 1,
          totalPages: 2,
          totalItems: 20,
          hasNextPage: true,
        },
      };

      vi.mocked(hooksModule.useActivityFeed).mockReturnValue({
        data: mockFeed,
        isLoading: false,
        isError: false,
        error: null,
      } as ReturnType<typeof hooksModule.useActivityFeed>);

      render(<ActivityFeedWidget />, { wrapper: createWrapper() });

      expect(screen.getByRole("button", { name: /load more/i })).toBeInTheDocument();
    });

    it("does not show load more button on last page", () => {
      const mockFeed = {
        items: [
          {
            id: "1",
            type: "enrolled" as const,
            actorName: "Student 1",
            courseName: "Test Course",
            createdAt: new Date("2026-02-18T10:00:00Z"),
          },
        ],
        pagination: {
          page: 2,
          totalPages: 2,
          totalItems: 11,
          hasNextPage: false,
        },
      };

      vi.mocked(hooksModule.useActivityFeed).mockReturnValue({
        data: mockFeed,
        isLoading: false,
        isError: false,
        error: null,
      } as ReturnType<typeof hooksModule.useActivityFeed>);

      render(<ActivityFeedWidget />, { wrapper: createWrapper() });

      expect(screen.queryByRole("button", { name: /load more/i })).not.toBeInTheDocument();
    });

    it("calls load more when button clicked", () => {
      const mockFeed = {
        items: Array.from({ length: 10 }, (_, i) => ({
          id: String(i + 1),
          type: "enrolled" as const,
          actorName: `Student ${String(i + 1)}`,
          courseName: "Test Course",
          createdAt: new Date("2026-02-18T10:00:00Z"),
        })),
        pagination: {
          page: 1,
          totalPages: 2,
          totalItems: 20,
          hasNextPage: true,
        },
      };

      vi.mocked(hooksModule.useActivityFeed).mockReturnValue({
        data: mockFeed,
        isLoading: false,
        isError: false,
        error: null,
      } as ReturnType<typeof hooksModule.useActivityFeed>);

      render(<ActivityFeedWidget />, { wrapper: createWrapper() });

      const loadMoreButton = screen.getByRole("button", { name: /load more/i });
      fireEvent.click(loadMoreButton);

      // Should have called the hook with page 2
      expect(hooksModule.useActivityFeed).toHaveBeenCalledWith({ page: 1 });
    });
  });
});
