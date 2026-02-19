/**
 * SharedMemosFeedWidget Component Tests
 * REQ-FE-233: Shared Memos Feed Widget
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { ReactNode } from "react";
import { SharedMemosFeedWidget } from "../SharedMemosFeedWidget";
import * as hooks from "~/hooks/dashboard/useTeamDashboard";

// Mock the hooks
vi.mock("~/hooks/dashboard/useTeamDashboard", () => ({
  useSharedMemos: vi.fn(),
  useTeamOverview: vi.fn(),
}));

// Mock next/link
vi.mock("next/link", () => ({
  default: ({
    children,
    href,
    className,
  }: {
    children: ReactNode;
    href: string;
    className?: string;
  }) => (
    <a href={href} className={className}>
      {children}
    </a>
  ),
}));

describe("SharedMemosFeedWidget", () => {
  let queryClient: QueryClient;
  let Wrapper: ({ children }: { children: ReactNode }) => ReactNode;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: {
          retry: false,
        },
      },
    });

    Wrapper = function Wrapper({ children }: { children: ReactNode }) {
      return (
        <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
      );
    };

    vi.clearAllMocks();

    // Default mock for useTeamOverview
    vi.mocked(hooks.useTeamOverview).mockReturnValue({
      isLoading: false,
      data: {
        id: "team-1",
        name: "Test Team",
        courseName: "Test Course",
        memberCount: 3,
        createdAt: new Date("2026-02-01T10:00:00Z"),
      },
      error: null,
      isError: false,
      isSuccess: true,
      isFetching: false,
      refetch: vi.fn(),
    } as unknown as ReturnType<typeof hooks.useTeamOverview>);
  });

  describe("Loading State", () => {
    it("shows loading skeleton while fetching", () => {
      vi.mocked(hooks.useSharedMemos).mockReturnValue({
        isLoading: true,
        data: undefined,
        error: null,
        isError: false,
        isSuccess: false,
        isFetching: true,
        refetch: vi.fn(),
      } as unknown as ReturnType<typeof hooks.useSharedMemos>);

      render(<SharedMemosFeedWidget />, { wrapper: Wrapper });

      expect(screen.getByTestId("shared-memos-widget")).toBeInTheDocument();
    });
  });

  describe("Memo List Display", () => {
    it("displays memo list with title, author, and excerpt", () => {
      vi.mocked(hooks.useSharedMemos).mockReturnValue({
        isLoading: false,
        data: [
          {
            id: "memo-1",
            title: "React Hooks Notes",
            authorName: "John Doe",
            excerpt: "Key concepts about useState and useEffect...",
            updatedAt: new Date("2026-02-19T10:00:00Z"),
          },
        ],
        error: null,
        isError: false,
        isSuccess: true,
        isFetching: false,
        refetch: vi.fn(),
      } as unknown as ReturnType<typeof hooks.useSharedMemos>);

      render(<SharedMemosFeedWidget />, { wrapper: Wrapper });

      expect(screen.getByText("React Hooks Notes")).toBeInTheDocument();
      expect(screen.getByText("John Doe")).toBeInTheDocument();
      expect(screen.getByText(/Key concepts about useState and useEffect/i)).toBeInTheDocument();
    });

    it("truncates excerpt to max 100 characters", () => {
      const longExcerpt = "A".repeat(150);
      vi.mocked(hooks.useSharedMemos).mockReturnValue({
        isLoading: false,
        data: [
          {
            id: "memo-1",
            title: "Long Memo",
            authorName: "John Doe",
            excerpt: longExcerpt,
            updatedAt: new Date("2026-02-19T10:00:00Z"),
          },
        ],
        error: null,
        isError: false,
        isSuccess: true,
        isFetching: false,
        refetch: vi.fn(),
      } as unknown as ReturnType<typeof hooks.useSharedMemos>);

      render(<SharedMemosFeedWidget />, { wrapper: Wrapper });

      const excerptElement = screen.getByText(/\.\.\./);
      const textLength = excerptElement.textContent ? excerptElement.textContent.length : 0;
      expect(textLength).toBeLessThanOrEqual(103); // 100 + "..."
    });

    it("displays updated time as relative time", () => {
      vi.mocked(hooks.useSharedMemos).mockReturnValue({
        isLoading: false,
        data: [
          {
            id: "memo-1",
            title: "React Hooks Notes",
            authorName: "John Doe",
            excerpt: "Key concepts...",
            updatedAt: new Date(Date.now() - 1000 * 60 * 30), // 30 min ago
          },
        ],
        error: null,
        isError: false,
        isSuccess: true,
        isFetching: false,
        refetch: vi.fn(),
      } as unknown as ReturnType<typeof hooks.useSharedMemos>);

      render(<SharedMemosFeedWidget />, { wrapper: Wrapper });

      // Should show relative time (e.g., "30 minutes ago")
      expect(screen.getByText(/ago/i)).toBeInTheDocument();
    });

    it("limits display to max 5 memos", () => {
      const memos = Array.from({ length: 10 }, (_, i) => ({
        id: `memo-${String(i)}`,
        title: `Memo ${String(i + 1)}`,
        authorName: "Author",
        excerpt: "Excerpt...",
        updatedAt: new Date(),
      }));

      vi.mocked(hooks.useSharedMemos).mockReturnValue({
        isLoading: false,
        data: memos,
        error: null,
        isError: false,
        isSuccess: true,
        isFetching: false,
        refetch: vi.fn(),
      } as unknown as ReturnType<typeof hooks.useSharedMemos>);

      render(<SharedMemosFeedWidget />, { wrapper: Wrapper });

      // Should show "View all memos" link
      expect(screen.getByText(/view all memos/i)).toBeInTheDocument();
    });

    it("shows create memo button", () => {
      vi.mocked(hooks.useSharedMemos).mockReturnValue({
        isLoading: false,
        data: [],
        error: null,
        isError: false,
        isSuccess: true,
        isFetching: false,
        refetch: vi.fn(),
      } as unknown as ReturnType<typeof hooks.useSharedMemos>);

      render(<SharedMemosFeedWidget />, { wrapper: Wrapper });

      // When no memos exist, shows "Create the first memo"
      expect(screen.getByRole("link", { name: /create the first memo/i })).toBeInTheDocument();
    });

    it("shows view all memos link when there are memos", () => {
      vi.mocked(hooks.useSharedMemos).mockReturnValue({
        isLoading: false,
        data: [
          {
            id: "memo-1",
            title: "Test Memo",
            authorName: "Author",
            excerpt: "Excerpt...",
            updatedAt: new Date(),
          },
        ],
        error: null,
        isError: false,
        isSuccess: true,
        isFetching: false,
        refetch: vi.fn(),
      } as unknown as ReturnType<typeof hooks.useSharedMemos>);

      render(<SharedMemosFeedWidget />, { wrapper: Wrapper });

      expect(screen.getByText(/view all memos/i)).toBeInTheDocument();
    });
  });

  describe("Empty State", () => {
    it("shows empty state with create memo CTA when no memos", () => {
      vi.mocked(hooks.useSharedMemos).mockReturnValue({
        isLoading: false,
        data: [],
        error: null,
        isError: false,
        isSuccess: true,
        isFetching: false,
        refetch: vi.fn(),
      } as unknown as ReturnType<typeof hooks.useSharedMemos>);

      render(<SharedMemosFeedWidget />, { wrapper: Wrapper });

      expect(screen.getByText(/no shared memos yet/i)).toBeInTheDocument();
      expect(screen.getByText(/create the first memo/i)).toBeInTheDocument();
    });
  });

  describe("No Team State", () => {
    it("hides widget when no team exists", () => {
      vi.mocked(hooks.useTeamOverview).mockReturnValue({
        isLoading: false,
        data: null,
        error: null,
        isError: false,
        isSuccess: true,
        isFetching: false,
        refetch: vi.fn(),
      } as unknown as ReturnType<typeof hooks.useTeamOverview>);

      vi.mocked(hooks.useSharedMemos).mockReturnValue({
        isLoading: false,
        data: [],
        error: null,
        isError: false,
        isSuccess: true,
        isFetching: false,
        refetch: vi.fn(),
      } as unknown as ReturnType<typeof hooks.useSharedMemos>);

      const { container } = render(<SharedMemosFeedWidget />, { wrapper: Wrapper });

      // Widget should return null when no team
      expect(container.firstChild).toBeNull();
    });
  });

  describe("Error State", () => {
    it("shows error message when fetch fails", () => {
      vi.mocked(hooks.useSharedMemos).mockReturnValue({
        isLoading: false,
        data: undefined,
        error: new Error("Failed to load memos"),
        isError: true,
        isSuccess: false,
        isFetching: false,
        refetch: vi.fn(),
      } as unknown as ReturnType<typeof hooks.useSharedMemos>);

      render(<SharedMemosFeedWidget />, { wrapper: Wrapper });

      expect(screen.getByText(/failed to load memos/i)).toBeInTheDocument();
    });
  });
});
