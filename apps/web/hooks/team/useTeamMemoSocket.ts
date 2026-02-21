/**
 * Team Memo Realtime Hook
 * REQ-BE-006-040~046: Supabase Realtime subscription for team memo updates
 *
 * Subscribes to postgres_changes on the memos table filtered by team_id.
 * Invalidates TanStack Query cache on INSERT/UPDATE/DELETE events.
 */

"use client";

import { useEffect, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";
import type { RealtimeChannel } from "@supabase/supabase-js";
import { createClient } from "~/lib/supabase/client";
import { memoKeys } from "~/hooks/memo";
import {
  REALTIME_CHANNELS,
  REALTIME_CONFIG,
} from "@shared/constants/realtime";
import { useUIStore, useTeamSocketStatus } from "~/stores/ui.store";

/**
 * Hook return type
 */
interface UseTeamMemoSocketReturn {
  /** Whether the Realtime connection is established */
  isConnected: boolean;
  /** Connection status string */
  status: "connected" | "disconnected" | "connecting" | "error";
}

/**
 * Hook for real-time team memo updates via Supabase Realtime.
 * REQ-BE-006-040: Subscribes to postgres_changes on memos table filtered by team_id
 * REQ-BE-006-041: Invalidates team memo list on INSERT
 * REQ-BE-006-042: Invalidates memo detail and list on UPDATE
 * REQ-BE-006-043: Removes memo detail cache and invalidates list on DELETE
 * REQ-BE-006-044: Cleans up channel on unmount
 * REQ-BE-006-045: Reflects connection status in ui.store teamSocketStatus
 * REQ-BE-006-046: Relies on Supabase built-in reconnection (no manual retry)
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
  const setTeamSocketStatus = useUIStore((state) => state.setTeamSocketStatus);
  const channelRef = useRef<RealtimeChannel | null>(null);

  useEffect(() => {
    if (!teamId) {
      setTeamSocketStatus("disconnected");
      return;
    }

    const supabase = createClient();
    setTeamSocketStatus("connecting");

    const channel = supabase
      .channel(REALTIME_CHANNELS.TEAM_MEMOS(teamId))
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: REALTIME_CONFIG.SCHEMA,
          table: REALTIME_CONFIG.TABLE,
          filter: `team_id=eq.${teamId}`,
        },
        (payload) => {
          if (
            payload.eventType === "INSERT" ||
            payload.eventType === "UPDATE"
          ) {
            void queryClient.invalidateQueries({
              queryKey: memoKeys.teamList(teamId),
            });
            void queryClient.invalidateQueries({
              queryKey: memoKeys.lists(),
            });
          }

          if (payload.eventType === "DELETE") {
            const oldRecord = payload.old as Record<string, unknown> | undefined;
            if (oldRecord?.id != null) {
              queryClient.removeQueries({
                queryKey: memoKeys.detail(oldRecord.id as string),
              });
            }
            void queryClient.invalidateQueries({
              queryKey: memoKeys.teamList(teamId),
            });
            void queryClient.invalidateQueries({
              queryKey: memoKeys.lists(),
            });
          }
        },
      )
      .subscribe((status: string) => {
        if (status === "SUBSCRIBED") {
          setTeamSocketStatus("connected");
        } else if (status === "CHANNEL_ERROR") {
          setTeamSocketStatus("error");
        } else if (status === "CLOSED") {
          setTeamSocketStatus("disconnected");
        }
      });

    channelRef.current = channel;

    return () => {
      void supabase.removeChannel(channel);
      setTeamSocketStatus("disconnected");
    };
  }, [teamId, queryClient, setTeamSocketStatus]);

  // Get current status from store
  const status = useTeamSocketStatus();
  const isConnected = status === "connected";

  return {
    isConnected,
    status,
  };
}

export type { UseTeamMemoSocketReturn };
