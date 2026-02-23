/**
 * useQAHighlights Hook Tests
 * REQ-FE-009: TanStack Query hook for Q&A highlight data
 *
 * TDD: RED phase - write failing tests first
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { ReactNode } from "react";
import { useQAHighlights } from "./useQAHighlights";
import type { QAHighlightData } from "@shared";

// Mock the Supabase Q&A query layer
vi.mock("~/lib/supabase/qa", () => ({
  getHighlightsForMaterial: vi.fn(),
}));

import { getHighlightsForMaterial } from "~/lib/supabase/qa";

// Test wrapper with QueryClient
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

// Mock data
const mockHighlights: QAHighlightData[] = [
  {
    id: "q1",
    selectedText: "important text",
    headingId: "introduction",
    status: "OPEN",
    title: "Question about importance",
  },
  {
    id: "q2",
    selectedText: "another passage",
    headingId: "section-2",
    status: "RESOLVED",
    title: "Follow-up question",
  },
];

describe("useQAHighlights", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should fetch highlights for a given materialId", async () => {
    vi.mocked(getHighlightsForMaterial).mockResolvedValueOnce(mockHighlights);

    const { result } = renderHook(() => useQAHighlights("mat-1"), {
      wrapper: createWrapper(),
    });

    // Initially loading
    expect(result.current.isLoading).toBe(true);

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(getHighlightsForMaterial).toHaveBeenCalledWith("mat-1");
    expect(result.current.data).toEqual(mockHighlights);
  });

  it("should not fetch when materialId is empty", async () => {
    const { result } = renderHook(() => useQAHighlights(""), {
      wrapper: createWrapper(),
    });

    // Should not be loading (query disabled)
    await waitFor(() => {
      expect(result.current.fetchStatus).toBe("idle");
    });

    expect(getHighlightsForMaterial).not.toHaveBeenCalled();
  });

  it("should handle fetch error", async () => {
    const mockError = new Error("Database error");
    vi.mocked(getHighlightsForMaterial).mockRejectedValueOnce(mockError);

    const { result } = renderHook(() => useQAHighlights("mat-1"), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });

    expect(result.current.error).toBeInstanceOf(Error);
  });

  it("should return empty array as initial data", async () => {
    vi.mocked(getHighlightsForMaterial).mockResolvedValueOnce([]);

    const { result } = renderHook(() => useQAHighlights("mat-1"), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(result.current.data).toEqual([]);
  });
});
