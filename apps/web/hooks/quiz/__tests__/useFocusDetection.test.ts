/**
 * useFocusDetection Hook Tests
 * REQ-FE-618: Anti-Cheat Focus Detection
 *
 * Tests for focus detection including:
 * - Listen to document.visibilitychange (tab switch)
 * - Listen to window.blur (window focus loss)
 * - Only attach listeners when enabled=true
 * - Increment focusLossCount on each event
 * - Show warning modal on focus loss
 */

import { describe, it, expect, beforeEach, vi, afterEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useQuizTakingStore } from "~/stores/quiz-taking.store";

describe("useFocusDetection", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useQuizTakingStore.getState().reset();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe("initialization", () => {
    it("returns initial state with focusLossCount 0", async () => {
      const { useFocusDetection } = await import("../useFocusDetection");

      const { result } = renderHook(() =>
        useFocusDetection({
          enabled: true,
        })
      );

      expect(result.current.focusLossCount).toBe(0);
      expect(result.current.isWarningOpen).toBe(false);
    });

    it("does not attach listeners when enabled is false", async () => {
      const addEventListenerSpy = vi.spyOn(document, "addEventListener");
      const windowAddEventListenerSpy = vi.spyOn(window, "addEventListener");

      const { useFocusDetection } = await import("../useFocusDetection");

      renderHook(() =>
        useFocusDetection({
          enabled: false,
        })
      );

      expect(addEventListenerSpy).not.toHaveBeenCalledWith(
        "visibilitychange",
        expect.any(Function)
      );
      expect(windowAddEventListenerSpy).not.toHaveBeenCalledWith(
        "blur",
        expect.any(Function)
      );

      addEventListenerSpy.mockRestore();
      windowAddEventListenerSpy.mockRestore();
    });

    it("attaches listeners when enabled is true", async () => {
      const addEventListenerSpy = vi.spyOn(document, "addEventListener");
      const windowAddEventListenerSpy = vi.spyOn(window, "addEventListener");

      const { useFocusDetection } = await import("../useFocusDetection");

      renderHook(() =>
        useFocusDetection({
          enabled: true,
        })
      );

      expect(addEventListenerSpy).toHaveBeenCalledWith(
        "visibilitychange",
        expect.any(Function)
      );
      expect(windowAddEventListenerSpy).toHaveBeenCalledWith(
        "blur",
        expect.any(Function)
      );

      addEventListenerSpy.mockRestore();
      windowAddEventListenerSpy.mockRestore();
    });
  });

  describe("visibility change detection", () => {
    it("increments focusLossCount when tab becomes hidden", async () => {
      const { useFocusDetection } = await import("../useFocusDetection");

      renderHook(() =>
        useFocusDetection({
          enabled: true,
        })
      );

      // Simulate tab becoming hidden
      Object.defineProperty(document, "hidden", {
        value: true,
        writable: true,
      });

      act(() => {
        document.dispatchEvent(new Event("visibilitychange"));
      });

      expect(useQuizTakingStore.getState().focusLossCount).toBe(1);
    });

    it("does not increment when tab becomes visible", async () => {
      const { useFocusDetection } = await import("../useFocusDetection");

      renderHook(() =>
        useFocusDetection({
          enabled: true,
        })
      );

      // Simulate tab becoming visible
      Object.defineProperty(document, "hidden", {
        value: false,
        writable: true,
      });

      act(() => {
        document.dispatchEvent(new Event("visibilitychange"));
      });

      expect(useQuizTakingStore.getState().focusLossCount).toBe(0);
    });

    it("does not increment when disabled", async () => {
      const { useFocusDetection } = await import("../useFocusDetection");

      renderHook(() =>
        useFocusDetection({
          enabled: false,
        })
      );

      // Simulate tab becoming hidden
      Object.defineProperty(document, "hidden", {
        value: true,
        writable: true,
      });

      act(() => {
        document.dispatchEvent(new Event("visibilitychange"));
      });

      expect(useQuizTakingStore.getState().focusLossCount).toBe(0);
    });
  });

  describe("window blur detection", () => {
    it("increments focusLossCount on window blur", async () => {
      const { useFocusDetection } = await import("../useFocusDetection");

      renderHook(() =>
        useFocusDetection({
          enabled: true,
        })
      );

      act(() => {
        window.dispatchEvent(new FocusEvent("blur"));
      });

      expect(useQuizTakingStore.getState().focusLossCount).toBe(1);
    });

    it("does not increment on blur when disabled", async () => {
      const { useFocusDetection } = await import("../useFocusDetection");

      renderHook(() =>
        useFocusDetection({
          enabled: false,
        })
      );

      act(() => {
        window.dispatchEvent(new FocusEvent("blur"));
      });

      expect(useQuizTakingStore.getState().focusLossCount).toBe(0);
    });
  });

  describe("warning modal", () => {
    it("opens warning modal on focus loss", async () => {
      const { useFocusDetection } = await import("../useFocusDetection");

      const { result } = renderHook(() =>
        useFocusDetection({
          enabled: true,
        })
      );

      expect(result.current.isWarningOpen).toBe(false);

      // Simulate tab becoming hidden
      Object.defineProperty(document, "hidden", {
        value: true,
        writable: true,
      });

      act(() => {
        document.dispatchEvent(new Event("visibilitychange"));
      });

      expect(result.current.isWarningOpen).toBe(true);
    });

    it("closes warning modal on closeWarning", async () => {
      const { useFocusDetection } = await import("../useFocusDetection");

      const { result } = renderHook(() =>
        useFocusDetection({
          enabled: true,
        })
      );

      // Simulate focus loss
      Object.defineProperty(document, "hidden", {
        value: true,
        writable: true,
      });

      act(() => {
        document.dispatchEvent(new Event("visibilitychange"));
      });

      expect(result.current.isWarningOpen).toBe(true);

      // Close warning
      act(() => {
        result.current.closeWarning();
      });

      expect(result.current.isWarningOpen).toBe(false);
    });

    it("does not open warning modal when disabled", async () => {
      const { useFocusDetection } = await import("../useFocusDetection");

      const { result } = renderHook(() =>
        useFocusDetection({
          enabled: false,
        })
      );

      // Simulate focus loss
      Object.defineProperty(document, "hidden", {
        value: true,
        writable: true,
      });

      act(() => {
        document.dispatchEvent(new Event("visibilitychange"));
      });

      expect(result.current.isWarningOpen).toBe(false);
    });
  });

  describe("onFocusLoss callback", () => {
    it("calls onFocusLoss callback when focus is lost", async () => {
      const onFocusLoss = vi.fn();

      const { useFocusDetection } = await import("../useFocusDetection");

      renderHook(() =>
        useFocusDetection({
          enabled: true,
          onFocusLoss,
        })
      );

      // Simulate focus loss
      Object.defineProperty(document, "hidden", {
        value: true,
        writable: true,
      });

      act(() => {
        document.dispatchEvent(new Event("visibilitychange"));
      });

      expect(onFocusLoss).toHaveBeenCalledTimes(1);
    });

    it("does not call onFocusLoss when disabled", async () => {
      const onFocusLoss = vi.fn();

      const { useFocusDetection } = await import("../useFocusDetection");

      renderHook(() =>
        useFocusDetection({
          enabled: false,
          onFocusLoss,
        })
      );

      // Simulate focus loss
      Object.defineProperty(document, "hidden", {
        value: true,
        writable: true,
      });

      act(() => {
        document.dispatchEvent(new Event("visibilitychange"));
      });

      expect(onFocusLoss).not.toHaveBeenCalled();
    });
  });

  describe("cleanup", () => {
    it("removes event listeners on unmount", async () => {
      const removeEventListenerSpy = vi.spyOn(document, "removeEventListener");
      const windowRemoveEventListenerSpy = vi.spyOn(window, "removeEventListener");

      const { useFocusDetection } = await import("../useFocusDetection");

      const { unmount } = renderHook(() =>
        useFocusDetection({
          enabled: true,
        })
      );

      unmount();

      expect(removeEventListenerSpy).toHaveBeenCalledWith(
        "visibilitychange",
        expect.any(Function)
      );
      expect(windowRemoveEventListenerSpy).toHaveBeenCalledWith(
        "blur",
        expect.any(Function)
      );

      removeEventListenerSpy.mockRestore();
      windowRemoveEventListenerSpy.mockRestore();
    });

    it("does not remove listeners if never attached (disabled)", async () => {
      const removeEventListenerSpy = vi.spyOn(document, "removeEventListener");
      const windowRemoveEventListenerSpy = vi.spyOn(window, "removeEventListener");

      const { useFocusDetection } = await import("../useFocusDetection");

      const { unmount } = renderHook(() =>
        useFocusDetection({
          enabled: false,
        })
      );

      unmount();

      expect(removeEventListenerSpy).not.toHaveBeenCalledWith(
        "visibilitychange",
        expect.any(Function)
      );
      expect(windowRemoveEventListenerSpy).not.toHaveBeenCalledWith(
        "blur",
        expect.any(Function)
      );

      removeEventListenerSpy.mockRestore();
      windowRemoveEventListenerSpy.mockRestore();
    });
  });

  describe("focusLossCount tracking", () => {
    it("tracks multiple focus loss events", async () => {
      const { useFocusDetection } = await import("../useFocusDetection");

      const { result } = renderHook(() =>
        useFocusDetection({
          enabled: true,
        })
      );

      // First focus loss
      Object.defineProperty(document, "hidden", {
        value: true,
        writable: true,
      });

      act(() => {
        document.dispatchEvent(new Event("visibilitychange"));
      });

      expect(result.current.focusLossCount).toBe(1);

      // Close warning and reset
      act(() => {
        result.current.closeWarning();
      });

      // Second focus loss
      act(() => {
        document.dispatchEvent(new Event("visibilitychange"));
      });

      expect(result.current.focusLossCount).toBe(2);

      // Third focus loss via blur
      act(() => {
        window.dispatchEvent(new FocusEvent("blur"));
      });

      expect(result.current.focusLossCount).toBe(3);
    });
  });

  describe("enabled toggle", () => {
    it("attaches listeners when enabled changes from false to true", async () => {
      const addEventListenerSpy = vi.spyOn(document, "addEventListener");

      const { useFocusDetection } = await import("../useFocusDetection");

      const { rerender } = renderHook(
        ({ enabled }: { enabled: boolean }) =>
          useFocusDetection({
            enabled,
          }),
        { initialProps: { enabled: false } }
      );

      // Initially disabled - no listeners
      expect(addEventListenerSpy).not.toHaveBeenCalledWith(
        "visibilitychange",
        expect.any(Function)
      );

      // Enable
      rerender({ enabled: true });

      expect(addEventListenerSpy).toHaveBeenCalledWith(
        "visibilitychange",
        expect.any(Function)
      );

      addEventListenerSpy.mockRestore();
    });

    it("removes listeners when enabled changes from true to false", async () => {
      const removeEventListenerSpy = vi.spyOn(document, "removeEventListener");

      const { useFocusDetection } = await import("../useFocusDetection");

      const { rerender } = renderHook(
        ({ enabled }: { enabled: boolean }) =>
          useFocusDetection({
            enabled,
          }),
        { initialProps: { enabled: true } }
      );

      // Disable
      rerender({ enabled: false });

      expect(removeEventListenerSpy).toHaveBeenCalledWith(
        "visibilitychange",
        expect.any(Function)
      );

      removeEventListenerSpy.mockRestore();
    });
  });
});
