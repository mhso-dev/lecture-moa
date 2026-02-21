/**
 * useTeamMemoSocket Hook - Unit Tests
 *
 * Tests Supabase Realtime subscription for team memo updates.
 * REQ-BE-006-040~046
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act, cleanup } from "@testing-library/react";

// ---------------------------------------------------------------------------
// Mock setup - must be before imports that use them
// ---------------------------------------------------------------------------

// Capture the postgres_changes callback so we can invoke it in tests
let postgresChangesCallback: ((payload: Record<string, unknown>) => void) | null = null;
let subscribeCallback: ((status: string, err?: Error) => void) | null = null;

function createMockChannel() {
  const channel = {
    on: vi.fn().mockImplementation(
      (_type: string, _config: unknown, cb: (payload: Record<string, unknown>) => void) => {
        postgresChangesCallback = cb;
        return channel;
      },
    ),
    subscribe: vi.fn().mockImplementation(
      (cb: (status: string, err?: Error) => void) => {
        subscribeCallback = cb;
        return channel;
      },
    ),
  };
  return channel;
}

let mockChannel = createMockChannel();
const mockRemoveChannel = vi.fn();

const mockSupabaseClient = {
  channel: vi.fn(() => mockChannel),
  removeChannel: mockRemoveChannel,
};

vi.mock("~/lib/supabase/client", () => ({
  createClient: vi.fn(() => mockSupabaseClient),
}));

// Mock @tanstack/react-query
// IMPORTANT: Use a stable object reference to prevent useEffect from re-running
// on every render (queryClient is in the dependency array).
const mockInvalidateQueries = vi.fn();
const mockRemoveQueries = vi.fn();
const mockQueryClient = {
  invalidateQueries: mockInvalidateQueries,
  removeQueries: mockRemoveQueries,
};

vi.mock("@tanstack/react-query", () => ({
  useQueryClient: vi.fn(() => mockQueryClient),
}));

// Import AFTER mocks are set up
import { useTeamMemoSocket } from "../../../hooks/team/useTeamMemoSocket";
import { useUIStore } from "../../../stores/ui.store";
import { REALTIME_CHANNELS, REALTIME_CONFIG } from "@shared/constants/realtime";

// ---------------------------------------------------------------------------
// Helpers – extract captured callbacks from mock call history
// ---------------------------------------------------------------------------

/**
 * Retrieve the subscribe status callback that the hook passed to
 * `channel.subscribe(cb)`.  Uses the LAST call to handle React
 * double-effect execution where the first effect is cleaned up.
 */
function getSubscribeCb(): ((status: string, err?: Error) => void) | null {
  const calls = mockChannel.subscribe.mock.calls;
  if (calls.length > 0) {
    const lastCall = calls[calls.length - 1] as unknown[] | undefined;
    if (lastCall && typeof lastCall[0] === "function") {
      return lastCall[0] as (status: string, err?: Error) => void;
    }
  }
  return subscribeCallback;
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("useTeamMemoSocket", () => {
  beforeEach(() => {
    cleanup();
    postgresChangesCallback = null;
    subscribeCallback = null;

    // Clear call history BEFORE setting up fresh mocks
    mockSupabaseClient.channel.mockClear();
    mockRemoveChannel.mockClear();
    mockInvalidateQueries.mockClear();
    mockRemoveQueries.mockClear();

    // Create fresh channel and wire it up
    mockChannel = createMockChannel();
    mockSupabaseClient.channel.mockReturnValue(mockChannel);

    // Reset zustand store
    useUIStore.setState({ teamSocketStatus: "disconnected" });
  });

  it("should subscribe to the correct channel name with teamId", () => {
    const teamId = "team-abc-123";

    renderHook(() => useTeamMemoSocket(teamId));

    expect(mockSupabaseClient.channel).toHaveBeenCalledWith(
      REALTIME_CHANNELS.TEAM_MEMOS(teamId),
    );
  });

  it("should subscribe to postgres_changes with correct config", () => {
    const teamId = "team-abc-123";

    renderHook(() => useTeamMemoSocket(teamId));

    expect(mockChannel.on).toHaveBeenCalledWith(
      "postgres_changes",
      {
        event: "*",
        schema: REALTIME_CONFIG.SCHEMA,
        table: REALTIME_CONFIG.TABLE,
        filter: `team_id=eq.${teamId}`,
      },
      expect.any(Function),
    );
  });

  it("should set status to 'connecting' on mount", () => {
    renderHook(() => useTeamMemoSocket("team-123"));

    // The effect sets "connecting" synchronously, then subscribe is called.
    // The store should reflect "connecting" because subscribe callback
    // hasn't fired yet.
    expect(useUIStore.getState().teamSocketStatus).toBe("connecting");
    expect(mockChannel.subscribe).toHaveBeenCalled();
  });

  it("should set status to 'connected' when subscription succeeds", () => {
    renderHook(() => useTeamMemoSocket("team-123"));

    // Verify we start as connecting
    expect(useUIStore.getState().teamSocketStatus).toBe("connecting");

    // Simulate successful subscription via mock.calls extraction
    const cb = getSubscribeCb();
    expect(cb).not.toBeNull();
    act(() => {
      cb!("SUBSCRIBED");
    });

    expect(useUIStore.getState().teamSocketStatus).toBe("connected");
  });

  it("should set status to 'error' on CHANNEL_ERROR", () => {
    renderHook(() => useTeamMemoSocket("team-123"));

    const cb = getSubscribeCb();
    expect(cb).not.toBeNull();
    act(() => {
      cb!("CHANNEL_ERROR");
    });

    expect(useUIStore.getState().teamSocketStatus).toBe("error");
  });

  it("should set status to 'disconnected' on CLOSED", () => {
    renderHook(() => useTeamMemoSocket("team-123"));

    const cb = getSubscribeCb();
    expect(cb).not.toBeNull();

    // First set to connected
    act(() => {
      cb!("SUBSCRIBED");
    });
    expect(useUIStore.getState().teamSocketStatus).toBe("connected");

    // Then close
    act(() => {
      cb!("CLOSED");
    });
    expect(useUIStore.getState().teamSocketStatus).toBe("disconnected");
  });

  it("should call invalidateQueries on INSERT event", () => {
    const teamId = "team-123";
    renderHook(() => useTeamMemoSocket(teamId));

    act(() => {
      postgresChangesCallback?.({
        eventType: "INSERT",
        new: { id: "memo-1", team_id: teamId, content: "new memo" },
        old: {},
        schema: "public",
        table: "memos",
        commit_timestamp: "2026-01-01T00:00:00Z",
      });
    });

    expect(mockInvalidateQueries).toHaveBeenCalledWith({
      queryKey: ["memos", "list", "team", { teamId }],
    });
    expect(mockInvalidateQueries).toHaveBeenCalledWith({
      queryKey: ["memos", "list"],
    });
  });

  it("should call invalidateQueries on UPDATE event", () => {
    const teamId = "team-456";
    renderHook(() => useTeamMemoSocket(teamId));

    act(() => {
      postgresChangesCallback?.({
        eventType: "UPDATE",
        new: { id: "memo-1", team_id: teamId, content: "updated" },
        old: { id: "memo-1" },
        schema: "public",
        table: "memos",
        commit_timestamp: "2026-01-01T00:00:00Z",
      });
    });

    expect(mockInvalidateQueries).toHaveBeenCalledWith({
      queryKey: ["memos", "list", "team", { teamId }],
    });
    expect(mockInvalidateQueries).toHaveBeenCalledWith({
      queryKey: ["memos", "list"],
    });
  });

  it("should call removeQueries and invalidateQueries on DELETE event", () => {
    const teamId = "team-789";
    const memoId = "memo-to-delete";
    renderHook(() => useTeamMemoSocket(teamId));

    act(() => {
      postgresChangesCallback?.({
        eventType: "DELETE",
        new: {},
        old: { id: memoId },
        schema: "public",
        table: "memos",
        commit_timestamp: "2026-01-01T00:00:00Z",
      });
    });

    expect(mockRemoveQueries).toHaveBeenCalledWith({
      queryKey: ["memos", "detail", memoId],
    });
    expect(mockInvalidateQueries).toHaveBeenCalledWith({
      queryKey: ["memos", "list", "team", { teamId }],
    });
    expect(mockInvalidateQueries).toHaveBeenCalledWith({
      queryKey: ["memos", "list"],
    });
  });

  it("should not call removeQueries on DELETE when old record has no id", () => {
    const teamId = "team-no-id";
    renderHook(() => useTeamMemoSocket(teamId));

    act(() => {
      postgresChangesCallback?.({
        eventType: "DELETE",
        new: {},
        old: {},
        schema: "public",
        table: "memos",
        commit_timestamp: "2026-01-01T00:00:00Z",
      });
    });

    expect(mockRemoveQueries).not.toHaveBeenCalled();
    // But lists should still be invalidated
    expect(mockInvalidateQueries).toHaveBeenCalledWith({
      queryKey: ["memos", "list", "team", { teamId }],
    });
  });

  it("should remove channel on unmount", () => {
    const { unmount } = renderHook(() => useTeamMemoSocket("team-123"));

    unmount();

    expect(mockRemoveChannel).toHaveBeenCalledWith(mockChannel);
  });

  it("should set status to 'disconnected' on unmount", () => {
    const { unmount } = renderHook(() => useTeamMemoSocket("team-123"));

    const cb = getSubscribeCb();
    expect(cb).not.toBeNull();

    // First connect
    act(() => {
      cb!("SUBSCRIBED");
    });
    expect(useUIStore.getState().teamSocketStatus).toBe("connected");

    // Then unmount
    unmount();
    expect(useUIStore.getState().teamSocketStatus).toBe("disconnected");
  });

  it("should set 'disconnected' when no teamId is provided", () => {
    renderHook(() => useTeamMemoSocket(""));

    expect(useUIStore.getState().teamSocketStatus).toBe("disconnected");
    expect(mockSupabaseClient.channel).not.toHaveBeenCalled();
  });

  it("should return isConnected=true when status is 'connected'", () => {
    const { result } = renderHook(() => useTeamMemoSocket("team-123"));

    const cb = getSubscribeCb();
    expect(cb).not.toBeNull();
    act(() => {
      cb!("SUBSCRIBED");
    });

    expect(result.current.isConnected).toBe(true);
    expect(result.current.status).toBe("connected");
  });

  it("should return isConnected=false when status is not 'connected'", () => {
    const { result } = renderHook(() => useTeamMemoSocket("team-123"));

    const cb = getSubscribeCb();
    expect(cb).not.toBeNull();
    act(() => {
      cb!("CHANNEL_ERROR");
    });

    expect(result.current.isConnected).toBe(false);
    expect(result.current.status).toBe("error");
  });

  it("should re-subscribe when teamId changes", () => {
    const { rerender } = renderHook(
      ({ teamId }: { teamId: string }) => useTeamMemoSocket(teamId),
      { initialProps: { teamId: "team-A" } },
    );

    expect(mockSupabaseClient.channel).toHaveBeenCalledWith(
      REALTIME_CHANNELS.TEAM_MEMOS("team-A"),
    );

    // Change teamId - create a fresh channel for the new subscription
    const firstChannel = mockChannel;
    mockChannel = createMockChannel();
    mockSupabaseClient.channel.mockReturnValue(mockChannel);

    rerender({ teamId: "team-B" });

    // Should have cleaned up old channel and created new one
    expect(mockRemoveChannel).toHaveBeenCalledWith(firstChannel);
    expect(mockSupabaseClient.channel).toHaveBeenCalledWith(
      REALTIME_CHANNELS.TEAM_MEMOS("team-B"),
    );
  });
});
