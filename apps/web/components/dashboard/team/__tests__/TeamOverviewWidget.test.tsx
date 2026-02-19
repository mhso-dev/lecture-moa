/**
 * TeamOverviewWidget Component Tests
 * REQ-FE-231: Team Overview Widget
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { ReactNode } from "react";
import { TeamOverviewWidget } from "../TeamOverviewWidget";
import * as hooks from "~/hooks/dashboard/useTeamDashboard";

// Mock the hook
vi.mock("~/hooks/dashboard/useTeamDashboard", () => ({
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

describe("TeamOverviewWidget", () => {
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
  });

  describe("Loading State", () => {
    it("shows loading skeleton while fetching", () => {
      vi.mocked(hooks.useTeamOverview).mockReturnValue({
        isLoading: true,
        data: undefined,
        error: null,
        isError: false,
        isSuccess: false,
        isFetching: true,
        refetch: vi.fn(),
      } as unknown as ReturnType<typeof hooks.useTeamOverview>);

      render(<TeamOverviewWidget />, { wrapper: Wrapper });

      // Widget should render with test id even when loading
      expect(screen.getByTestId("team-overview-widget")).toBeInTheDocument();
    });
  });

  describe("No Team State", () => {
    it("shows empty state when user has no team", () => {
      vi.mocked(hooks.useTeamOverview).mockReturnValue({
        isLoading: false,
        data: null,
        error: null,
        isError: false,
        isSuccess: true,
        isFetching: false,
        refetch: vi.fn(),
      } as unknown as ReturnType<typeof hooks.useTeamOverview>);

      render(<TeamOverviewWidget />, { wrapper: Wrapper });

      expect(screen.getByText(/not a member of any team/i)).toBeInTheDocument();
      expect(screen.getByText(/browse teams/i)).toBeInTheDocument();
    });
  });

  describe("Team Data Display", () => {
    it("displays team name and course name", () => {
      vi.mocked(hooks.useTeamOverview).mockReturnValue({
        isLoading: false,
        data: {
          id: "team-1",
          name: "React Study Group",
          courseName: "Introduction to React",
          memberCount: 5,
          description: "Weekly study sessions",
          createdAt: new Date("2026-02-01T10:00:00Z"),
        },
        error: null,
        isError: false,
        isSuccess: true,
        isFetching: false,
        refetch: vi.fn(),
      } as unknown as ReturnType<typeof hooks.useTeamOverview>);

      render(<TeamOverviewWidget />, { wrapper: Wrapper });

      expect(screen.getByText("React Study Group")).toBeInTheDocument();
      expect(screen.getByText("Introduction to React")).toBeInTheDocument();
    });

    it("displays member count", () => {
      vi.mocked(hooks.useTeamOverview).mockReturnValue({
        isLoading: false,
        data: {
          id: "team-1",
          name: "React Study Group",
          courseName: "Introduction to React",
          memberCount: 5,
          createdAt: new Date("2026-02-01T10:00:00Z"),
        },
        error: null,
        isError: false,
        isSuccess: true,
        isFetching: false,
        refetch: vi.fn(),
      } as unknown as ReturnType<typeof hooks.useTeamOverview>);

      render(<TeamOverviewWidget />, { wrapper: Wrapper });

      expect(screen.getByText(/5 members/i)).toBeInTheDocument();
    });

    it("displays description when available", () => {
      vi.mocked(hooks.useTeamOverview).mockReturnValue({
        isLoading: false,
        data: {
          id: "team-1",
          name: "React Study Group",
          courseName: "Introduction to React",
          memberCount: 5,
          description: "Weekly study sessions for beginners",
          createdAt: new Date("2026-02-01T10:00:00Z"),
        },
        error: null,
        isError: false,
        isSuccess: true,
        isFetching: false,
        refetch: vi.fn(),
      } as unknown as ReturnType<typeof hooks.useTeamOverview>);

      render(<TeamOverviewWidget />, { wrapper: Wrapper });

      expect(screen.getByText(/Weekly study sessions for beginners/i)).toBeInTheDocument();
    });

    it("displays team creation date", () => {
      vi.mocked(hooks.useTeamOverview).mockReturnValue({
        isLoading: false,
        data: {
          id: "team-1",
          name: "React Study Group",
          courseName: "Introduction to React",
          memberCount: 5,
          createdAt: new Date("2026-02-01T10:00:00Z"),
        },
        error: null,
        isError: false,
        isSuccess: true,
        isFetching: false,
        refetch: vi.fn(),
      } as unknown as ReturnType<typeof hooks.useTeamOverview>);

      render(<TeamOverviewWidget />, { wrapper: Wrapper });

      // Should show created date (relative or formatted)
      expect(screen.getByText(/created/i)).toBeInTheDocument();
    });

    it("displays manage team link", () => {
      vi.mocked(hooks.useTeamOverview).mockReturnValue({
        isLoading: false,
        data: {
          id: "team-1",
          name: "React Study Group",
          courseName: "Introduction to React",
          memberCount: 5,
          createdAt: new Date("2026-02-01T10:00:00Z"),
        },
        error: null,
        isError: false,
        isSuccess: true,
        isFetching: false,
        refetch: vi.fn(),
      } as unknown as ReturnType<typeof hooks.useTeamOverview>);

      render(<TeamOverviewWidget />, { wrapper: Wrapper });

      expect(screen.getByText(/manage team/i)).toBeInTheDocument();
    });
  });

  describe("Error State", () => {
    it("shows error message when fetch fails", () => {
      vi.mocked(hooks.useTeamOverview).mockReturnValue({
        isLoading: false,
        data: undefined,
        error: new Error("Failed to load team"),
        isError: true,
        isSuccess: false,
        isFetching: false,
        refetch: vi.fn(),
      } as unknown as ReturnType<typeof hooks.useTeamOverview>);

      render(<TeamOverviewWidget />, { wrapper: Wrapper });

      expect(screen.getByText(/failed to load team/i)).toBeInTheDocument();
    });

    it("shows retry button on error", () => {
      const mockRefetch = vi.fn();
      vi.mocked(hooks.useTeamOverview).mockReturnValue({
        isLoading: false,
        data: undefined,
        error: new Error("Failed to load team"),
        isError: true,
        isSuccess: false,
        isFetching: false,
        refetch: mockRefetch,
      } as unknown as ReturnType<typeof hooks.useTeamOverview>);

      render(<TeamOverviewWidget />, { wrapper: Wrapper });

      expect(screen.getByRole("button", { name: /retry/i })).toBeInTheDocument();
    });
  });
});
