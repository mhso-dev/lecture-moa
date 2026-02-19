/**
 * TeamActivityWidget Component Tests
 * REQ-FE-234: Team Activity Widget
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { ReactNode } from "react";
import { TeamActivityWidget } from "../TeamActivityWidget";
import * as hooks from "~/hooks/dashboard/useTeamDashboard";

// Mock the hooks
vi.mock("~/hooks/dashboard/useTeamDashboard", () => ({
  useTeamActivity: vi.fn(),
  useTeamOverview: vi.fn(),
}));

describe("TeamActivityWidget", () => {
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
      vi.mocked(hooks.useTeamActivity).mockReturnValue({
        isLoading: true,
        data: undefined,
        error: null,
        isError: false,
        isSuccess: false,
        isFetching: true,
        refetch: vi.fn(),
      } as unknown as ReturnType<typeof hooks.useTeamActivity>);

      render(<TeamActivityWidget />, { wrapper: Wrapper });

      expect(screen.getByTestId("team-activity-widget")).toBeInTheDocument();
    });
  });

  describe("Activity Timeline Display", () => {
    it("displays activity timeline with actor name and time", () => {
      vi.mocked(hooks.useTeamActivity).mockReturnValue({
        isLoading: false,
        data: [
          {
            id: "activity-1",
            type: "memo_created",
            actorName: "John Doe",
            description: "Created a new memo: React Hooks Notes",
            createdAt: new Date(Date.now() - 1000 * 60 * 30), // 30 min ago
          },
        ],
        error: null,
        isError: false,
        isSuccess: true,
        isFetching: false,
        refetch: vi.fn(),
      } as unknown as ReturnType<typeof hooks.useTeamActivity>);

      render(<TeamActivityWidget />, { wrapper: Wrapper });

      expect(screen.getByText("John Doe")).toBeInTheDocument();
      expect(screen.getByText(/30 minutes ago/i)).toBeInTheDocument();
    });

    it("displays activity description", () => {
      vi.mocked(hooks.useTeamActivity).mockReturnValue({
        isLoading: false,
        data: [
          {
            id: "activity-1",
            type: "memo_created",
            actorName: "John Doe",
            description: "Created a new memo: React Hooks Notes",
            createdAt: new Date(),
          },
        ],
        error: null,
        isError: false,
        isSuccess: true,
        isFetching: false,
        refetch: vi.fn(),
      } as unknown as ReturnType<typeof hooks.useTeamActivity>);

      render(<TeamActivityWidget />, { wrapper: Wrapper });

      expect(screen.getByText(/Created a new memo: React Hooks Notes/i)).toBeInTheDocument();
    });

    it("shows different icons for different activity types", () => {
      vi.mocked(hooks.useTeamActivity).mockReturnValue({
        isLoading: false,
        data: [
          {
            id: "activity-1",
            type: "memo_created",
            actorName: "John Doe",
            description: "Created a new memo",
            createdAt: new Date(),
          },
          {
            id: "activity-2",
            type: "member_joined",
            actorName: "Jane Smith",
            description: "Joined the team",
            createdAt: new Date(),
          },
        ],
        error: null,
        isError: false,
        isSuccess: true,
        isFetching: false,
        refetch: vi.fn(),
      } as unknown as ReturnType<typeof hooks.useTeamActivity>);

      render(<TeamActivityWidget />, { wrapper: Wrapper });

      // Both activities should be rendered
      expect(screen.getByText("John Doe")).toBeInTheDocument();
      expect(screen.getByText("Jane Smith")).toBeInTheDocument();
    });

    it("limits display to max 10 items", () => {
      const activities = Array.from({ length: 15 }, (_, i) => ({
        id: `activity-${String(i)}`,
        type: "memo_created" as const,
        actorName: `User ${String(i)}`,
        description: `Activity ${String(i)}`,
        createdAt: new Date(),
      }));

      vi.mocked(hooks.useTeamActivity).mockReturnValue({
        isLoading: false,
        data: activities,
        error: null,
        isError: false,
        isSuccess: true,
        isFetching: false,
        refetch: vi.fn(),
      } as unknown as ReturnType<typeof hooks.useTeamActivity>);

      render(<TeamActivityWidget />, { wrapper: Wrapper });

      // Should show "Load more" button
      expect(screen.getByRole("button", { name: /load more/i })).toBeInTheDocument();
    });
  });

  describe("Empty State", () => {
    it("shows empty state when no activity", () => {
      vi.mocked(hooks.useTeamActivity).mockReturnValue({
        isLoading: false,
        data: [],
        error: null,
        isError: false,
        isSuccess: true,
        isFetching: false,
        refetch: vi.fn(),
      } as unknown as ReturnType<typeof hooks.useTeamActivity>);

      render(<TeamActivityWidget />, { wrapper: Wrapper });

      expect(screen.getByText(/no recent activity/i)).toBeInTheDocument();
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

      vi.mocked(hooks.useTeamActivity).mockReturnValue({
        isLoading: false,
        data: [],
        error: null,
        isError: false,
        isSuccess: true,
        isFetching: false,
        refetch: vi.fn(),
      } as unknown as ReturnType<typeof hooks.useTeamActivity>);

      const { container } = render(<TeamActivityWidget />, { wrapper: Wrapper });

      // Widget should return null when no team
      expect(container.firstChild).toBeNull();
    });
  });

  describe("Error State", () => {
    it("shows error message when fetch fails", () => {
      vi.mocked(hooks.useTeamActivity).mockReturnValue({
        isLoading: false,
        data: undefined,
        error: new Error("Failed to load activity"),
        isError: true,
        isSuccess: false,
        isFetching: false,
        refetch: vi.fn(),
      } as unknown as ReturnType<typeof hooks.useTeamActivity>);

      render(<TeamActivityWidget />, { wrapper: Wrapper });

      expect(screen.getByText(/failed to load activity/i)).toBeInTheDocument();
    });
  });

  describe("Load More Pagination", () => {
    it("shows load more button when there are more items", () => {
      const activities = Array.from({ length: 12 }, (_, i) => ({
        id: `activity-${String(i)}`,
        type: "memo_created" as const,
        actorName: `User ${String(i)}`,
        description: `Activity ${String(i)}`,
        createdAt: new Date(),
      }));

      vi.mocked(hooks.useTeamActivity).mockReturnValue({
        isLoading: false,
        data: activities,
        error: null,
        isError: false,
        isSuccess: true,
        isFetching: false,
        refetch: vi.fn(),
      } as unknown as ReturnType<typeof hooks.useTeamActivity>);

      render(<TeamActivityWidget />, { wrapper: Wrapper });

      expect(screen.getByRole("button", { name: /load more/i })).toBeInTheDocument();
    });
  });
});
