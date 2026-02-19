/**
 * Live Indicator Component
 * REQ-FE-743: Real-time connection status indicator for team memo board
 */

"use client";

import { Badge } from "~/components/ui/badge";
import { cn } from "~/lib/utils";
import type { TeamSocketStatus } from "~/stores/ui.store";

/**
 * Props for LiveIndicator component
 */
interface LiveIndicatorProps {
  /** Current connection status */
  status: TeamSocketStatus;
  /** Additional CSS classes */
  className?: string;
}

/**
 * Configuration for different connection states
 */
const STATUS_CONFIG = {
  connected: {
    variant: "default" as const,
    dotColor: "bg-green-500",
    label: "Live",
  },
  connecting: {
    variant: "secondary" as const,
    dotColor: "bg-yellow-500",
    label: "Connecting...",
  },
  disconnected: {
    variant: "secondary" as const,
    dotColor: "bg-gray-500",
    label: "Reconnecting...",
  },
  error: {
    variant: "destructive" as const,
    dotColor: "bg-red-500",
    label: "Error",
  },
} as const;

/**
 * LiveIndicator - Displays real-time connection status
 * REQ-FE-743: Shows connection status with colored dot and label
 *
 * @param props - Component props
 * @returns LiveIndicator component
 *
 * @example
 * ```tsx
 * const { status } = useTeamMemoSocket(teamId);
 *
 * <LiveIndicator status={status} />
 * // Renders: Green dot + "Live" when connected
 * // Renders: Gray dot + "Reconnecting..." when disconnected
 * ```
 */
export function LiveIndicator({ status, className }: LiveIndicatorProps) {
  const config = STATUS_CONFIG[status];

  return (
    <Badge
      variant={config.variant}
      className={cn("flex items-center gap-1.5", className)}
      aria-label={`Connection status: ${config.label}`}
    >
      {/* Animated dot */}
      <span
        className={cn(
          "relative flex h-2 w-2",
          status === "connected" && "animate-pulse"
        )}
      >
        <span
          className={cn(
            "absolute inline-flex h-full w-full rounded-full opacity-75",
            config.dotColor,
            status === "connected" && "animate-ping"
          )}
        />
        <span
          className={cn(
            "relative inline-flex rounded-full h-2 w-2",
            config.dotColor
          )}
        />
      </span>

      {/* Status label */}
      <span className="text-xs font-medium">{config.label}</span>
    </Badge>
  );
}

export type { LiveIndicatorProps };
