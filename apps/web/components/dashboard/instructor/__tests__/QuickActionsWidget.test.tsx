/**
 * QuickActionsWidget Component Tests
 * REQ-FE-226: Quick Actions Widget
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { ReactNode } from "react";
import { QuickActionsWidget } from "../QuickActionsWidget";

// Mock Next.js Link
vi.mock("next/link", () => ({
  default: ({
    children,
    href,
  }: {
    children: ReactNode;
    href: string;
  }) => <a href={href}>{children}</a>,
}));

// Create wrapper for TanStack Query
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

describe("QuickActionsWidget", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("rendering", () => {
    it("displays widget title", () => {
      render(<QuickActionsWidget />, { wrapper: createWrapper() });

      expect(screen.getByText("Quick Actions")).toBeInTheDocument();
    });

    it("always renders (no loading state)", () => {
      render(<QuickActionsWidget />, { wrapper: createWrapper() });

      // Should always show content
      expect(screen.getByText("Quick Actions")).toBeInTheDocument();
    });

    it("shows upload material action", () => {
      render(<QuickActionsWidget />, { wrapper: createWrapper() });

      const link = screen.getByRole("link", { name: /upload material/i });
      expect(link).toHaveAttribute("href", "/materials/upload");
    });

    it("shows create quiz action", () => {
      render(<QuickActionsWidget />, { wrapper: createWrapper() });

      const link = screen.getByRole("link", { name: /create quiz/i });
      expect(link).toHaveAttribute("href", "/quizzes/create");
    });

    it("shows view all Q&A action", () => {
      render(<QuickActionsWidget />, { wrapper: createWrapper() });

      const link = screen.getByRole("link", { name: /view all q&a/i });
      expect(link).toHaveAttribute("href", "/qa");
    });

    it("shows manage courses action", () => {
      render(<QuickActionsWidget />, { wrapper: createWrapper() });

      const link = screen.getByRole("link", { name: /manage courses/i });
      expect(link).toHaveAttribute("href", "/courses");
    });

    it("displays all 4 actions", () => {
      render(<QuickActionsWidget />, { wrapper: createWrapper() });

      expect(screen.getByText(/upload material/i)).toBeInTheDocument();
      expect(screen.getByText(/create quiz/i)).toBeInTheDocument();
      expect(screen.getByText(/view all q&a/i)).toBeInTheDocument();
      expect(screen.getByText(/manage courses/i)).toBeInTheDocument();
    });

    it("shows icons for each action", () => {
      const { container } = render(<QuickActionsWidget />, { wrapper: createWrapper() });

      // Should have 4 SVG icons (one per action)
      const svgs = container.querySelectorAll("svg");
      expect(svgs.length).toBeGreaterThanOrEqual(4);
    });
  });
});
