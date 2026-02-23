/**
 * QAHighlightTooltip Component Tests
 * REQ-FE-009: Tooltip popup for Q&A highlighted text
 *
 * TDD: RED phase - write failing tests first
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { ReactNode } from "react";
import { QAHighlightTooltip } from "../QAHighlightTooltip";

// Mock the QA store
const mockCloseHighlightTooltip = vi.fn();
let mockActiveHighlightValue: {
  highlightId: string;
  anchorRect: DOMRect;
  questionIds: string[];
} | null = {
  highlightId: "q1,q2",
  anchorRect: new DOMRect(100, 200, 150, 20),
  questionIds: ["q1", "q2"],
};

vi.mock("~/stores/qa.store", () => ({
  useActiveHighlight: vi.fn(() => mockActiveHighlightValue),
  useQAStore: vi.fn((selector: (state: Record<string, unknown>) => unknown) =>
    selector({
      closeHighlightTooltip: mockCloseHighlightTooltip,
      activeHighlight: mockActiveHighlightValue,
    })
  ),
}));

// Mock Q&A detail -- simplified, just need title/status
vi.mock("~/hooks/qa", () => ({
  useQADetail: vi.fn(() => ({
    data: {
      id: "q1",
      title: "Test Question 1",
      status: "OPEN",
      content: "Question body",
      author: { id: "u1", name: "Test User", avatarUrl: null, role: "student" },
      upvoteCount: 3,
      answerCount: 1,
      createdAt: "2024-01-01T00:00:00Z",
    },
    isLoading: false,
  })),
}));

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return function Wrapper({ children }: { children: ReactNode }) {
    return (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );
  };
}

describe("QAHighlightTooltip", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockActiveHighlightValue = {
      highlightId: "q1,q2",
      anchorRect: new DOMRect(100, 200, 150, 20),
      questionIds: ["q1", "q2"],
    };
  });

  it("should render when activeHighlight is set", () => {
    render(<QAHighlightTooltip />, { wrapper: createWrapper() });

    expect(screen.getByRole("dialog")).toBeInTheDocument();
  });

  it("should display the question count", () => {
    render(<QAHighlightTooltip />, { wrapper: createWrapper() });

    // 2 questions linked to this highlight
    expect(screen.getByText(/2/)).toBeInTheDocument();
  });

  it("should close on Escape key", () => {
    render(<QAHighlightTooltip />, { wrapper: createWrapper() });

    fireEvent.keyDown(document, { key: "Escape" });

    expect(mockCloseHighlightTooltip).toHaveBeenCalled();
  });

  it("should not render when activeHighlight is null", () => {
    mockActiveHighlightValue = null;

    const { container } = render(<QAHighlightTooltip />, {
      wrapper: createWrapper(),
    });

    expect(container.querySelector("[role='dialog']")).toBeNull();
  });
});
