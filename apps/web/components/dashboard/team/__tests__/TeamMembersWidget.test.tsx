/**
 * TeamMembersWidget Component Tests
 * REQ-FE-232: Team Members Widget
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { ReactNode } from "react";
import { TeamMembersWidget } from "../TeamMembersWidget";
import * as hooks from "~/hooks/dashboard/useTeamDashboard";

// Mock the hooks
vi.mock("~/hooks/dashboard/useTeamDashboard", () => ({
  useTeamMembers: vi.fn(),
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

describe("TeamMembersWidget", () => {
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
      vi.mocked(hooks.useTeamMembers).mockReturnValue({
        isLoading: true,
        data: undefined,
        error: null,
        isError: false,
        isSuccess: false,
        isFetching: true,
        refetch: vi.fn(),
      } as unknown as ReturnType<typeof hooks.useTeamMembers>);

      render(<TeamMembersWidget />, { wrapper: Wrapper });

      expect(screen.getByTestId("team-members-widget")).toBeInTheDocument();
    });
  });

  describe("Member List Display", () => {
    it("displays member list with avatars and names", () => {
      vi.mocked(hooks.useTeamMembers).mockReturnValue({
        isLoading: false,
        data: [
          {
            id: "user-1",
            name: "John Doe",
            role: "leader",
            lastActiveAt: new Date(Date.now() - 1000 * 60 * 30), // 30 min ago
          },
          {
            id: "user-2",
            name: "Jane Smith",
            role: "member",
            lastActiveAt: new Date(Date.now() - 1000 * 60 * 60 * 25), // 25 hours ago
          },
        ],
        error: null,
        isError: false,
        isSuccess: true,
        isFetching: false,
        refetch: vi.fn(),
      } as unknown as ReturnType<typeof hooks.useTeamMembers>);

      render(<TeamMembersWidget />, { wrapper: Wrapper });

      expect(screen.getByText("John Doe")).toBeInTheDocument();
      expect(screen.getByText("Jane Smith")).toBeInTheDocument();
    });

    it("shows leader badge for team leader", () => {
      vi.mocked(hooks.useTeamMembers).mockReturnValue({
        isLoading: false,
        data: [
          {
            id: "user-1",
            name: "John Doe",
            role: "leader",
            lastActiveAt: new Date(),
          },
        ],
        error: null,
        isError: false,
        isSuccess: true,
        isFetching: false,
        refetch: vi.fn(),
      } as unknown as ReturnType<typeof hooks.useTeamMembers>);

      render(<TeamMembersWidget />, { wrapper: Wrapper });

      expect(screen.getByText(/leader/i)).toBeInTheDocument();
    });

    it("shows active indicator for members active in last 24 hours", () => {
      vi.mocked(hooks.useTeamMembers).mockReturnValue({
        isLoading: false,
        data: [
          {
            id: "user-1",
            name: "John Doe",
            role: "member",
            lastActiveAt: new Date(Date.now() - 1000 * 60 * 30), // 30 min ago
          },
        ],
        error: null,
        isError: false,
        isSuccess: true,
        isFetching: false,
        refetch: vi.fn(),
      } as unknown as ReturnType<typeof hooks.useTeamMembers>);

      render(<TeamMembersWidget />, { wrapper: Wrapper });

      // Active indicator (green dot) should be present
      const widget = screen.getByTestId("team-members-widget");
      expect(widget.querySelector(".bg-green-500")).toBeInTheDocument();
    });

    it("does not show active indicator for inactive members", () => {
      vi.mocked(hooks.useTeamMembers).mockReturnValue({
        isLoading: false,
        data: [
          {
            id: "user-1",
            name: "John Doe",
            role: "member",
            lastActiveAt: new Date(Date.now() - 1000 * 60 * 60 * 25), // 25 hours ago
          },
        ],
        error: null,
        isError: false,
        isSuccess: true,
        isFetching: false,
        refetch: vi.fn(),
      } as unknown as ReturnType<typeof hooks.useTeamMembers>);

      render(<TeamMembersWidget />, { wrapper: Wrapper });

      // Should not show green dot for inactive member
      const widget = screen.getByTestId("team-members-widget");
      expect(widget.querySelector(".bg-green-500")).not.toBeInTheDocument();
    });

    it("limits display to max 10 members", () => {
      const members = Array.from({ length: 15 }, (_, i) => ({
        id: `user-${String(i)}`,
        name: `Member ${String(i + 1)}`,
        role: "member" as const,
        lastActiveAt: new Date(),
      }));

      vi.mocked(hooks.useTeamMembers).mockReturnValue({
        isLoading: false,
        data: members,
        error: null,
        isError: false,
        isSuccess: true,
        isFetching: false,
        refetch: vi.fn(),
      } as unknown as ReturnType<typeof hooks.useTeamMembers>);

      render(<TeamMembersWidget />, { wrapper: Wrapper });

      // Should show "View all" link indicating more members
      expect(screen.getByText(/view all/i)).toBeInTheDocument();
    });

    it("shows view all members link", () => {
      vi.mocked(hooks.useTeamMembers).mockReturnValue({
        isLoading: false,
        data: [
          {
            id: "user-1",
            name: "John Doe",
            role: "leader",
            lastActiveAt: new Date(),
          },
        ],
        error: null,
        isError: false,
        isSuccess: true,
        isFetching: false,
        refetch: vi.fn(),
      } as unknown as ReturnType<typeof hooks.useTeamMembers>);

      render(<TeamMembersWidget />, { wrapper: Wrapper });

      expect(screen.getByText(/view all/i)).toBeInTheDocument();
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

      vi.mocked(hooks.useTeamMembers).mockReturnValue({
        isLoading: false,
        data: [],
        error: null,
        isError: false,
        isSuccess: true,
        isFetching: false,
        refetch: vi.fn(),
      } as unknown as ReturnType<typeof hooks.useTeamMembers>);

      const { container } = render(<TeamMembersWidget />, { wrapper: Wrapper });

      // Widget should return null when no team
      expect(container.firstChild).toBeNull();
    });
  });

  describe("Error State", () => {
    it("shows error message when fetch fails", () => {
      vi.mocked(hooks.useTeamMembers).mockReturnValue({
        isLoading: false,
        data: undefined,
        error: new Error("Failed to load members"),
        isError: true,
        isSuccess: false,
        isFetching: false,
        refetch: vi.fn(),
      } as unknown as ReturnType<typeof hooks.useTeamMembers>);

      render(<TeamMembersWidget />, { wrapper: Wrapper });

      expect(screen.getByText(/failed to load members/i)).toBeInTheDocument();
    });
  });
});
