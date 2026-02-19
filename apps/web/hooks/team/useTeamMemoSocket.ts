/**
 * Team Memo WebSocket Hook
 * REQ-FE-742: WebSocket connection management for team memo real-time updates
 *
 * Following the pattern from useTeamRealtimeUpdates.ts
 */

"use client";

import { useEffect, useRef, useCallback } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { EVENTS } from "@shared/constants/events";
import { useTeamSocketStatus } from "~/stores/ui.store";
import { memoKeys } from "~/hooks/memo/useMemos";

/**
 * Hook return type
 */
interface UseTeamMemoSocketReturn {
  /** Whether the WebSocket connection is established */
  isConnected: boolean;
  /** Connection status string */
  status: "connected" | "disconnected" | "connecting" | "error";
}

/**
 * Hook for real-time team memo updates via WebSocket.
 * REQ-FE-742: Implements WebSocket connection with reconnection logic
 *
 * This is a skeleton implementation that will be enhanced when WebSocket SPEC is available.
 * Currently manages connection state and cache invalidation placeholders.
 *
 * Future implementation will:
 * - Establish WebSocket connection to /ws/team/{teamId}/memos
 * - Subscribe to team memo events: created, updated, deleted
 * - Invalidate TanStack Query cache on events
 * - Handle reconnection with exponential backoff (max 5 retries)
 * - Update ui.store.ts teamSocketStatus state
 *
 * @param teamId - The team ID to subscribe to
 * @returns Object with connection status
 *
 * @example
 * ```tsx
 * function TeamMemoBoard({ teamId }: { teamId: string }) {
 *   const { isConnected, status } = useTeamMemoSocket(teamId);
 *
 *   return (
 *     <div>
 *       <LiveIndicator status={status} />
 *       <MemoList teamId={teamId} />
 *     </div>
 *   );
 * }
 * ```
 */
export function useTeamMemoSocket(teamId: string): UseTeamMemoSocketReturn {
  const queryClient = useQueryClient();
  const setTeamSocketStatus = useTeamSocketStatus();
  const retryCountRef = useRef(0);
  const maxRetries = 5;
  const wsRef = useRef<WebSocket | null>(null);

  /**
   * Handle incoming WebSocket events
   * REQ-FE-742: Invalidate cache on memo events
   */
  const handleWebSocketMessage = useCallback(
    (event: MessageEvent) => {
      try {
        const data = JSON.parse(event.data);
        const { type } = data;

        // Handle team memo events
        switch (type) {
          case EVENTS.TEAM_MEMO_CREATED:
          case EVENTS.TEAM_MEMO_UPDATED:
          case EVENTS.TEAM_MEMO_DELETED:
            // Invalidate team memos cache to trigger refetch
            queryClient.invalidateQueries({
              queryKey: memoKeys.teamList(teamId),
            });
            break;

          case EVENTS.TEAM_MEMBER_JOINED:
          case EVENTS.TEAM_MEMBER_LEFT:
            // Invalidate team member cache
            queryClient.invalidateQueries({
              queryKey: ["team", teamId, "members"],
            });
            break;

          default:
            // Unknown event type - ignore
            break;
        }
      } catch (error) {
        // Log error but don't crash UI
        console.error("[useTeamMemoSocket] Failed to parse message:", error);
      }
    },
    [queryClient, teamId]
  );

  /**
   * Establish WebSocket connection
   * REQ-FE-742: Connection lifecycle management
   */
  const connect = useCallback(() => {
    // TODO: Implement actual WebSocket connection when WS SPEC is available
    // For now, this is a skeleton that simulates connection behavior

    setTeamSocketStatus("connecting");

    // Simulate connection attempt
    const connectTimeout = setTimeout(() => {
      // Mock successful connection for skeleton
      setTeamSocketStatus("connected");
      retryCountRef.current = 0;
    }, 500);

    return () => clearTimeout(connectTimeout);
  }, [setTeamSocketStatus]);

  /**
   * Handle connection errors with exponential backoff
   * REQ-FE-742: Reconnection with exponential backoff, max 5 retries
   */
  const handleReconnect = useCallback(() => {
    if (retryCountRef.current >= maxRetries) {
      setTeamSocketStatus("error");
      console.error(
        "[useTeamMemoSocket] Max reconnection attempts reached"
      );
      return;
    }

    const delay = Math.pow(2, retryCountRef.current) * 1000; // Exponential backoff
    retryCountRef.current += 1;

    setTimeout(() => {
      connect();
    }, delay);
  }, [connect, setTeamSocketStatus]);

  /**
   * Connection lifecycle: connect on mount, disconnect on unmount
   * REQ-FE-742: Connect on component mount, disconnect on unmount
   */
  useEffect(() => {
    if (!teamId) {
      setTeamSocketStatus("disconnected");
      return;
    }

    const cleanup = connect();

    return () => {
      cleanup?.();
      setTeamSocketStatus("disconnected");
      if (wsRef.current) {
        wsRef.current.close();
        wsRef.current = null;
      }
    };
  }, [teamId, connect, setTeamSocketStatus]);

  // Get current status from store
  const status = useTeamSocketStatus();
  const isConnected = status === "connected";

  return {
    isConnected,
    status,
  };
}

export type { UseTeamMemoSocketReturn };
