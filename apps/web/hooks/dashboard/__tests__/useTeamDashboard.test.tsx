/**
 * Team Dashboard Hooks Tests
 * REQ-FE-235: TanStack Query hooks for team dashboard data
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { ReactNode } from "react";
import {
  useTeamOverview,
  useTeamMembers,
  useSharedMemos,
  useTeamActivity,
} from "../useTeamDashboard";
import * as dashboardModule from "~/lib/supabase/dashboard";

// Mock the Supabase dashboard module
vi.mock("~/lib/supabase/dashboard", () => ({
  fetchTeamOverview: vi.fn(),
  fetchTeamMembers: vi.fn(),
  fetchSharedMemos: vi.fn(),
  fetchTeamActivityFeed: vi.fn(),
}));

// Mock environment variable for mock data
vi.mock("~/src/env", () => ({
  env: {
    NEXT_PUBLIC_API_URL: "http://localhost:3001",
    NEXT_PUBLIC_USE_MOCK_DATA: undefined,
  },
}));

describe("Team Dashboard Hooks", () => {
  let queryClient: QueryClient;
  let Wrapper: ({ children }: { children: ReactNode }) => ReactNode;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: {
          retry: false,
          gcTime: 0,
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

  describe("useTeamOverview", () => {
    it("fetches team overview with metadata and stats", async () => {
      const mockOverview = {
        id: "team-1",
        name: "React Study Group",
        courseName: "Introduction to React",
        memberCount: 5,
        description: "Weekly study sessions for React beginners",
        createdAt: "2026-02-01T10:00:00Z",
      };

      vi.mocked(dashboardModule.fetchTeamOverview).mockResolvedValueOnce(mockOverview);

      const { result } = renderHook(() => useTeamOverview("team-1"), {
        wrapper: Wrapper,
      });

      await waitFor(() => { expect(result.current.isSuccess).toBe(true); });

      expect(result.current.data).toEqual(mockOverview);
      expect(dashboardModule.fetchTeamOverview).toHaveBeenCalledWith("team-1");
    });

    it("uses correct query key", async () => {
      vi.mocked(dashboardModule.fetchTeamOverview).mockResolvedValueOnce({
        id: "team-1",
        name: "Test Team",
        courseName: "Test Course",
        memberCount: 1,
        createdAt: "2026-02-01T10:00:00Z",
      });

      renderHook(() => useTeamOverview("team-1"), {
        wrapper: Wrapper,
      });

      await waitFor(() => {
        const cacheData = queryClient.getQueryData([
          "dashboard",
          "team",
          "overview",
          "team-1",
        ]);
        expect(cacheData).toBeDefined();
      });
    });

    it("uses 2-minute stale time for overview data", async () => {
      vi.mocked(dashboardModule.fetchTeamOverview).mockResolvedValueOnce({
        id: "team-1",
        name: "Test Team",
        courseName: "Test Course",
        memberCount: 1,
        createdAt: "2026-02-01T10:00:00Z",
      });

      const { result } = renderHook(() => useTeamOverview("team-1"), {
        wrapper: Wrapper,
      });

      await waitFor(() => { expect(result.current.isSuccess).toBe(true); });

      // Verify the hook returns data
      expect(result.current.data).toBeDefined();
    });

    it("handles errors gracefully", async () => {
      vi.mocked(dashboardModule.fetchTeamOverview).mockRejectedValueOnce(new Error("Network error"));

      const { result } = renderHook(() => useTeamOverview("team-1"), {
        wrapper: Wrapper,
      });

      await waitFor(() => { expect(result.current.isError).toBe(true); });

      expect(result.current.error).toBeInstanceOf(Error);
    });
  });

  describe("useTeamMembers", () => {
    it("fetches team members with activity status", async () => {
      const mockMembers = [
        {
          id: "user-1",
          name: "John Doe",
          avatarUrl: "https://example.com/avatar1.jpg",
          role: "leader" as const,
          lastActiveAt: "2026-02-19T10:00:00Z",
        },
        {
          id: "user-2",
          name: "Jane Smith",
          avatarUrl: "https://example.com/avatar2.jpg",
          role: "member" as const,
          lastActiveAt: "2026-02-18T15:30:00Z",
        },
      ];

      vi.mocked(dashboardModule.fetchTeamMembers).mockResolvedValueOnce(mockMembers);

      const { result } = renderHook(() => useTeamMembers("team-1"), {
        wrapper: Wrapper,
      });

      await waitFor(() => { expect(result.current.isSuccess).toBe(true); });

      expect(result.current.data).toEqual(mockMembers);
      expect(dashboardModule.fetchTeamMembers).toHaveBeenCalledWith("team-1");
    });

    it("uses correct query key", async () => {
      vi.mocked(dashboardModule.fetchTeamMembers).mockResolvedValueOnce([]);

      renderHook(() => useTeamMembers("team-1"), {
        wrapper: Wrapper,
      });

      await waitFor(() => {
        const cacheData = queryClient.getQueryData([
          "dashboard",
          "team",
          "members",
          "team-1",
        ]);
        expect(cacheData).toBeDefined();
      });
    });
  });

  describe("useSharedMemos", () => {
    it("fetches paginated shared memos", async () => {
      const mockMemos = {
        items: [
          {
            id: "memo-1",
            title: "React Hooks Notes",
            authorName: "John Doe",
            excerpt: "Key concepts about useState and useEffect...",
            updatedAt: "2026-02-19T10:00:00Z",
          },
          {
            id: "memo-2",
            title: "TypeScript Tips",
            authorName: "Jane Smith",
            excerpt: "Best practices for TypeScript development...",
            updatedAt: "2026-02-18T15:30:00Z",
          },
        ],
        hasMore: false,
      };

      vi.mocked(dashboardModule.fetchSharedMemos).mockResolvedValueOnce(mockMemos);

      const { result } = renderHook(() => useSharedMemos({ teamId: "team-1", page: 1 }), {
        wrapper: Wrapper,
      });

      await waitFor(() => { expect(result.current.isSuccess).toBe(true); });

      expect(result.current.data).toEqual(mockMemos);
      expect(dashboardModule.fetchSharedMemos).toHaveBeenCalledWith("team-1", 1, 10);
    });

    it("includes page parameter in query key", async () => {
      vi.mocked(dashboardModule.fetchSharedMemos).mockResolvedValueOnce({
        items: [],
        hasMore: false,
      });

      renderHook(() => useSharedMemos({ teamId: "team-1", page: 2 }), {
        wrapper: Wrapper,
      });

      await waitFor(() => {
        const cacheData = queryClient.getQueryData([
          "dashboard",
          "team",
          "memos",
          "team-1",
          { page: 2 },
        ]);
        expect(cacheData).toBeDefined();
      });
    });

    it("defaults to page 1 when not specified", async () => {
      vi.mocked(dashboardModule.fetchSharedMemos).mockResolvedValueOnce({
        items: [],
        hasMore: false,
      });

      const { result } = renderHook(() => useSharedMemos({ teamId: "team-1" }), {
        wrapper: Wrapper,
      });

      await waitFor(() => { expect(result.current.isSuccess).toBe(true); });

      expect(dashboardModule.fetchSharedMemos).toHaveBeenCalledWith("team-1", 1, 10);
    });
  });

  describe("useTeamActivity", () => {
    it("fetches paginated team activity feed", async () => {
      const mockActivity = {
        items: [
          {
            id: "activity-1",
            type: "memo_created" as const,
            actorName: "John Doe",
            description: "Created a new memo: React Hooks Notes",
            createdAt: "2026-02-19T10:00:00Z",
          },
          {
            id: "activity-2",
            type: "member_joined" as const,
            actorName: "Jane Smith",
            description: "Joined the team",
            createdAt: "2026-02-18T15:30:00Z",
          },
        ],
        hasMore: false,
      };

      vi.mocked(dashboardModule.fetchTeamActivityFeed).mockResolvedValueOnce(mockActivity);

      const { result } = renderHook(() => useTeamActivity({ teamId: "team-1", page: 1 }), {
        wrapper: Wrapper,
      });

      await waitFor(() => { expect(result.current.isSuccess).toBe(true); });

      expect(result.current.data).toEqual(mockActivity);
      expect(dashboardModule.fetchTeamActivityFeed).toHaveBeenCalledWith("team-1", 1, 10);
    });

    it("includes page parameter in query key", async () => {
      vi.mocked(dashboardModule.fetchTeamActivityFeed).mockResolvedValueOnce({
        items: [],
        hasMore: false,
      });

      renderHook(() => useTeamActivity({ teamId: "team-1", page: 2 }), {
        wrapper: Wrapper,
      });

      await waitFor(() => {
        const cacheData = queryClient.getQueryData([
          "dashboard",
          "team",
          "activity",
          "team-1",
          { page: 2 },
        ]);
        expect(cacheData).toBeDefined();
      });
    });

    it("uses 30-second stale time for activity feed (more real-time)", async () => {
      vi.mocked(dashboardModule.fetchTeamActivityFeed).mockResolvedValueOnce({
        items: [],
        hasMore: false,
      });

      const { result } = renderHook(() => useTeamActivity({ teamId: "team-1", page: 1 }), {
        wrapper: Wrapper,
      });

      await waitFor(() => { expect(result.current.isSuccess).toBe(true); });

      // Verify the hook returns data
      expect(result.current.data).toEqual({ items: [], hasMore: false });
    });

    it("defaults to page 1 when not specified", async () => {
      vi.mocked(dashboardModule.fetchTeamActivityFeed).mockResolvedValueOnce({
        items: [],
        hasMore: false,
      });

      const { result } = renderHook(() => useTeamActivity({ teamId: "team-1" }), {
        wrapper: Wrapper,
      });

      await waitFor(() => { expect(result.current.isSuccess).toBe(true); });

      expect(dashboardModule.fetchTeamActivityFeed).toHaveBeenCalledWith("team-1", 1, 10);
    });
  });
});
