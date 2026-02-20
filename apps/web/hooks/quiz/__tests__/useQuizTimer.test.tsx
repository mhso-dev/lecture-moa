/**
 * useQuizTimer Hook Tests
 * REQ-FE-614: Timer state management for quiz-taking
 */

import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useQuizTakingStore } from "~/stores/quiz-taking.store";

describe("useQuizTimer", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    // Reset store to initial state
    useQuizTakingStore.getState().reset();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.clearAllMocks();
  });

  describe("initial state", () => {
    it("returns remainingSeconds from store", async () => {
      // Set state in store
      act(() => {
        useQuizTakingStore.setState({
          remainingSeconds: 1800,
          timerStatus: "running",
        });
      });

      const { useQuizTimer } = await import("../useQuizTimer");
      const { result } = renderHook(() => useQuizTimer());

      expect(result.current.remainingSeconds).toBe(1800);
    });

    it("returns timerStatus from store", async () => {
      act(() => {
        useQuizTakingStore.setState({
          remainingSeconds: 1800,
          timerStatus: "running",
        });
      });

      const { useQuizTimer } = await import("../useQuizTimer");
      const { result } = renderHook(() => useQuizTimer());

      expect(result.current.timerStatus).toBe("running");
    });
  });

  describe("timer lifecycle", () => {
    it("starts interval when timer is running", async () => {
      act(() => {
        useQuizTakingStore.setState({
          remainingSeconds: 1800,
          timerStatus: "running",
        });
      });

      const { useQuizTimer } = await import("../useQuizTimer");
      renderHook(() => useQuizTimer());

      // Fast-forward 1 second
      act(() => {
        vi.advanceTimersByTime(1000);
      });

      // Timer should have ticked
      expect(useQuizTakingStore.getState().remainingSeconds).toBe(1799);
    });

    it("calls tickTimer every second when running", async () => {
      act(() => {
        useQuizTakingStore.setState({
          remainingSeconds: 1800,
          timerStatus: "running",
        });
      });

      const { useQuizTimer } = await import("../useQuizTimer");
      renderHook(() => useQuizTimer());

      // Fast-forward 5 seconds
      act(() => {
        vi.advanceTimersByTime(5000);
      });

      // Timer should have ticked 5 times
      expect(useQuizTakingStore.getState().remainingSeconds).toBe(1795);
    });

    it("does not tick when timer is paused", async () => {
      act(() => {
        useQuizTakingStore.setState({
          remainingSeconds: 1800,
          timerStatus: "paused",
        });
      });

      const { useQuizTimer } = await import("../useQuizTimer");
      renderHook(() => useQuizTimer());

      // Fast-forward 5 seconds
      act(() => {
        vi.advanceTimersByTime(5000);
      });

      expect(useQuizTakingStore.getState().remainingSeconds).toBe(1800);
    });

    it("does not tick when timer is idle", async () => {
      act(() => {
        useQuizTakingStore.setState({
          remainingSeconds: null,
          timerStatus: "idle",
        });
      });

      const { useQuizTimer } = await import("../useQuizTimer");
      renderHook(() => useQuizTimer());

      // Fast-forward 5 seconds
      act(() => {
        vi.advanceTimersByTime(5000);
      });

      expect(useQuizTakingStore.getState().remainingSeconds).toBeNull();
    });

    it("does not tick when timer is expired", async () => {
      act(() => {
        useQuizTakingStore.setState({
          remainingSeconds: 0,
          timerStatus: "expired",
        });
      });

      const { useQuizTimer } = await import("../useQuizTimer");
      renderHook(() => useQuizTimer());

      // Fast-forward 5 seconds
      act(() => {
        vi.advanceTimersByTime(5000);
      });

      expect(useQuizTakingStore.getState().remainingSeconds).toBe(0);
    });
  });

  describe("cleanup on unmount", () => {
    it("clears interval on unmount", async () => {
      act(() => {
        useQuizTakingStore.setState({
          remainingSeconds: 1800,
          timerStatus: "running",
        });
      });

      const { useQuizTimer } = await import("../useQuizTimer");
      const { unmount } = renderHook(() => useQuizTimer());

      // Let interval start
      act(() => {
        vi.advanceTimersByTime(1000);
      });

      expect(useQuizTakingStore.getState().remainingSeconds).toBe(1799);

      // Unmount
      unmount();

      // Advance more time - should not tick anymore
      act(() => {
        vi.advanceTimersByTime(5000);
      });

      // Still 1799 (no more ticks after unmount)
      expect(useQuizTakingStore.getState().remainingSeconds).toBe(1799);
    });
  });

  describe("control functions", () => {
    it("provides pauseTimer function that pauses timer", async () => {
      act(() => {
        useQuizTakingStore.setState({
          remainingSeconds: 1800,
          timerStatus: "running",
        });
      });

      const { useQuizTimer } = await import("../useQuizTimer");
      const { result } = renderHook(() => useQuizTimer());

      // Pause the timer
      act(() => {
        result.current.pauseTimer();
      });

      expect(useQuizTakingStore.getState().timerStatus).toBe("paused");
    });

    it("provides resumeTimer function that resumes timer", async () => {
      act(() => {
        useQuizTakingStore.setState({
          remainingSeconds: 1800,
          timerStatus: "paused",
        });
      });

      const { useQuizTimer } = await import("../useQuizTimer");
      const { result } = renderHook(() => useQuizTimer());

      // Resume the timer
      act(() => {
        result.current.resumeTimer();
      });

      expect(useQuizTakingStore.getState().timerStatus).toBe("running");
    });
  });

  describe("auto-submit callback", () => {
    it("calls onExpire callback when timer reaches 0", async () => {
      const onExpire = vi.fn();
      act(() => {
        useQuizTakingStore.setState({
          remainingSeconds: 1,
          timerStatus: "running",
        });
      });

      const { useQuizTimer } = await import("../useQuizTimer");
      renderHook(() => useQuizTimer({ onExpire }));

      // Tick to 0
      act(() => {
        vi.advanceTimersByTime(1000);
      });

      // Check store state
      expect(useQuizTakingStore.getState().remainingSeconds).toBe(0);
      expect(useQuizTakingStore.getState().timerStatus).toBe("expired");

      // Run pending timers and effects
      act(() => {
        vi.runAllTimers();
      });

      // onExpire should have been called
      expect(onExpire).toHaveBeenCalled();
    });

    it("does not call onExpire if timer is paused before 0", async () => {
      const onExpire = vi.fn();
      act(() => {
        useQuizTakingStore.setState({
          remainingSeconds: 5,
          timerStatus: "running",
        });
      });

      const { useQuizTimer } = await import("../useQuizTimer");
      const { result } = renderHook(() => useQuizTimer({ onExpire }));

      // Advance some time
      act(() => {
        vi.advanceTimersByTime(3000);
      });

      // Pause before expiry
      act(() => {
        result.current.pauseTimer();
      });

      // Advance more time
      act(() => {
        vi.advanceTimersByTime(5000);
      });

      expect(onExpire).not.toHaveBeenCalled();
    });
  });

  describe("remaining time display", () => {
    it("formats remaining time as MM:SS", async () => {
      act(() => {
        useQuizTakingStore.setState({
          remainingSeconds: 125, // 2:05
          timerStatus: "running",
        });
      });

      const { useQuizTimer } = await import("../useQuizTimer");
      const { result } = renderHook(() => useQuizTimer());

      expect(result.current.formattedTime).toBe("02:05");
    });

    it("formats 0 seconds as 00:00", async () => {
      act(() => {
        useQuizTakingStore.setState({
          remainingSeconds: 0,
          timerStatus: "expired",
        });
      });

      const { useQuizTimer } = await import("../useQuizTimer");
      const { result } = renderHook(() => useQuizTimer());

      expect(result.current.formattedTime).toBe("00:00");
    });

    it("formats 3600 seconds as 60:00", async () => {
      act(() => {
        useQuizTakingStore.setState({
          remainingSeconds: 3600,
          timerStatus: "running",
        });
      });

      const { useQuizTimer } = await import("../useQuizTimer");
      const { result } = renderHook(() => useQuizTimer());

      expect(result.current.formattedTime).toBe("60:00");
    });

    it("returns null formattedTime when remainingSeconds is null", async () => {
      act(() => {
        useQuizTakingStore.setState({
          remainingSeconds: null,
          timerStatus: "idle",
        });
      });

      const { useQuizTimer } = await import("../useQuizTimer");
      const { result } = renderHook(() => useQuizTimer());

      expect(result.current.formattedTime).toBeNull();
    });
  });
});
