/**
 * QANotificationProvider Tests
 * TASK-035: Toast Notifications
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { QANotificationProvider } from "./QANotificationProvider";
import { useQAWebSocket } from "~/hooks/qa";

// Mock dependencies
vi.mock("~/hooks/qa", () => ({
  useQAWebSocket: vi.fn(),
}));

vi.mock("sonner", () => ({
  toast: {
    success: vi.fn(),
  },
}));

vi.mock("next/navigation", () => ({
  useRouter: vi.fn(() => ({
    push: vi.fn(),
  })),
}));

vi.mock("~/stores/qa.store", () => ({
  useQAStore: vi.fn((selector: (state: { addNotification: ReturnType<typeof vi.fn>; activeQuestionId: null }) => unknown) => {
    const state = {
      addNotification: vi.fn(),
      activeQuestionId: null,
    };
    return selector(state);
  }),
}));

describe("QANotificationProvider", () => {
  const mockUseQAWebSocket = vi.mocked(useQAWebSocket);

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should render children", () => {
    render(
      <QANotificationProvider>
        <div>Test Child</div>
      </QANotificationProvider>
    );

    expect(screen.getByText("Test Child")).toBeInTheDocument();
  });

  it("should call useQAWebSocket with callback handlers", () => {
    render(
      <QANotificationProvider>
        <div>Test</div>
      </QANotificationProvider>
    );

    expect(mockUseQAWebSocket).toHaveBeenCalled();
    const options = mockUseQAWebSocket.mock.calls[0]?.[0];
    expect(options).toHaveProperty("onNewAnswer");
    expect(options).toHaveProperty("onAiSuggestionReady");
    expect(options).toHaveProperty("onQuestionResolved");
  });

  it("should have correct callback function types", () => {
    render(
      <QANotificationProvider>
        <div>Test</div>
      </QANotificationProvider>
    );

    const options = mockUseQAWebSocket.mock.calls[0]?.[0];

    // Verify callbacks are functions
    expect(typeof options?.onNewAnswer).toBe("function");
    expect(typeof options?.onAiSuggestionReady).toBe("function");
    expect(typeof options?.onQuestionResolved).toBe("function");
  });
});
