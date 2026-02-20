/**
 * useTeamSearch Hook Tests
 * TASK-018: Team search hook with debounce
 * REQ-FE-714: Search functionality requirements
 */

import { act, renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useTeamSearch } from "../useTeamSearch";

// Mock useAvailableTeams hook
vi.mock("../useTeams", () => ({
  useAvailableTeams: vi.fn().mockImplementation((search?: string) => ({
    data: search ? [{ id: "team-1", name: "Search Result" }] : [],
    isLoading: false,
    isError: false,
  })),
}));

// Mock useDebounce hook
vi.mock("~/hooks/useDebounce", () => ({
  useDebounce: vi.fn().mockImplementation((value: string, _delay: number) => value),
}));

describe("useTeamSearch", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("REQ-FE-714: Debounced Search", () => {
    it("should return teams from useAvailableTeams", () => {
      const { result } = renderHook(() => useTeamSearch());

      expect(result.current.teams).toBeDefined();
      expect(result.current.isLoading).toBe(false);
    });

    it("should initialize with empty search query", () => {
      const { result } = renderHook(() => useTeamSearch());

      expect(result.current.searchQuery).toBe("");
    });

    it("should update search query when setSearchQuery is called", () => {
      const { result } = renderHook(() => useTeamSearch());

      act(() => {
        result.current.setSearchQuery("test query");
      });

      expect(result.current.searchQuery).toBe("test query");
    });

    it("should debounce search query with 300ms delay", async () => {
      const { useDebounce } = await import("~/hooks/useDebounce");
      const mockUseDebounce = vi.mocked(useDebounce);

      renderHook(() => useTeamSearch());

      // Verify useDebounce is called with 300ms delay
      expect(mockUseDebounce).toHaveBeenCalledWith(
        expect.any(String),
        300
      );
    });

    it("should use debounced search query with useAvailableTeams", async () => {
      const { useAvailableTeams } = await import("../useTeams");
      const mockUseAvailableTeams = vi.mocked(useAvailableTeams) as any;

      const { result } = renderHook(() => useTeamSearch());

      act(() => {
        result.current.setSearchQuery("react");
      });

      await waitFor(() => {
        expect(mockUseAvailableTeams).toHaveBeenCalledWith(
          expect.any(String)
        );
      });
    });
  });

  describe("REQ-FE-714: Search Results", () => {
    it("should return loading state from useAvailableTeams", async () => {
      const { useAvailableTeams } = await import("../useTeams");
      (vi.mocked(useAvailableTeams) as any).mockReturnValueOnce({
        data: [],
        isLoading: true,
        isError: false,
      });

      const { result } = renderHook(() => useTeamSearch());

      expect(result.current.isLoading).toBe(true);
    });

    it("should return teams array from useAvailableTeams", async () => {
      const mockTeams = [
        { id: "team-1", name: "Team 1" },
        { id: "team-2", name: "Team 2" },
      ];

      const { useAvailableTeams } = await import("../useTeams");
      (vi.mocked(useAvailableTeams) as any).mockReturnValueOnce({
        data: mockTeams,
        isLoading: false,
        isError: false,
      });

      const { result } = renderHook(() => useTeamSearch());

      expect(result.current.teams).toEqual(mockTeams);
    });

    it("should return empty array when no teams found", async () => {
      const { useAvailableTeams } = await import("../useTeams");
      (vi.mocked(useAvailableTeams) as any).mockReturnValueOnce({
        data: [],
        isLoading: false,
        isError: false,
      });

      const { result } = renderHook(() => useTeamSearch());

      expect(result.current.teams).toEqual([]);
    });
  });

  describe("REQ-FE-714: Hook Interface", () => {
    it("should return teams property", () => {
      const { result } = renderHook(() => useTeamSearch());

      expect(result.current).toHaveProperty("teams");
    });

    it("should return isLoading property", () => {
      const { result } = renderHook(() => useTeamSearch());

      expect(result.current).toHaveProperty("isLoading");
    });

    it("should return searchQuery property", () => {
      const { result } = renderHook(() => useTeamSearch());

      expect(result.current).toHaveProperty("searchQuery");
    });

    it("should return setSearchQuery function", () => {
      const { result } = renderHook(() => useTeamSearch());

      expect(result.current.setSearchQuery).toBeInstanceOf(Function);
    });
  });
});
