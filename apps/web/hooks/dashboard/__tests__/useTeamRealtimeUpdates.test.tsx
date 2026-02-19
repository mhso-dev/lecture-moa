/**
 * Team Realtime Updates Hook Tests
 * REQ-FE-237: Real-Time Hook Skeleton for team dashboard data
 */

import { describe, it, expect } from "vitest";
import { renderHook } from "@testing-library/react";
import { useTeamRealtimeUpdates } from "../useTeamRealtimeUpdates";

describe("useTeamRealtimeUpdates", () => {
  it("returns isConnected as false (skeleton implementation)", () => {
    const { result } = renderHook(() => useTeamRealtimeUpdates());

    expect(result.current.isConnected).toBe(false);
  });

  it("returns consistent object shape", () => {
    const { result } = renderHook(() => useTeamRealtimeUpdates());

    expect(result.current).toHaveProperty("isConnected");
    expect(typeof result.current.isConnected).toBe("boolean");
  });
});
