/**
 * PendingQAWidget Component Tests
 * REQ-FE-223: Pending Q&A Widget
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { ReactNode } from "react";
import { PendingQAWidget } from "../PendingQAWidget";
import * as hooksModule from "~/hooks/dashboard/useInstructorDashboard";

// Mock the hooks
vi.mock("~/hooks/dashboard/useInstructorDashboard", () => ({
  usePendingQA: vi.fn(),
}));

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

describe("PendingQAWidget", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("loading state", () => {
    it("shows loading skeleton when data is loading", () => {
      vi.mocked(hooksModule.usePendingQA).mockReturnValue({
        data: undefined,
        isLoading: true,
        isError: false,
        error: null,
      } as ReturnType<typeof hooksModule.usePendingQA>);

      render(<PendingQAWidget />, { wrapper: createWrapper() });

      expect(screen.getByText("Pending Q&A")).toBeInTheDocument();
    });
  });

  describe("error state", () => {
    it("shows error message when fetch fails", () => {
      vi.mocked(hooksModule.usePendingQA).mockReturnValue({
        data: undefined,
        isLoading: false,
        isError: true,
        error: new Error("Failed to load Q&A"),
      } as ReturnType<typeof hooksModule.usePendingQA>);

      render(<PendingQAWidget />, { wrapper: createWrapper() });

      expect(screen.getByText(/failed to load q&a/i)).toBeInTheDocument();
    });
  });

  describe("empty state", () => {
    it("shows empty state when no pending questions", () => {
      vi.mocked(hooksModule.usePendingQA).mockReturnValue({
        data: [],
        isLoading: false,
        isError: false,
        error: null,
      } as ReturnType<typeof hooksModule.usePendingQA>);

      render(<PendingQAWidget />, { wrapper: createWrapper() });

      expect(screen.getByText(/no pending questions/i)).toBeInTheDocument();
    });
  });

  describe("data state", () => {
    it("displays pending questions", () => {
      const mockItems = [
        {
          id: "1",
          questionExcerpt: "How do I use useEffect properly?",
          studentName: "John Doe",
          courseName: "Introduction to React",
          askedAt: "2026-02-18T10:00:00Z",
          isUrgent: false,
        },
        {
          id: "2",
          questionExcerpt: "What is the difference between interface and type?",
          studentName: "Jane Smith",
          courseName: "Advanced TypeScript",
          askedAt: "2026-02-15T08:00:00Z",
          isUrgent: true,
        },
      ];

      vi.mocked(hooksModule.usePendingQA).mockReturnValue({
        data: mockItems,
        isLoading: false,
        isError: false,
        error: null,
      } as ReturnType<typeof hooksModule.usePendingQA>);

      render(<PendingQAWidget />, { wrapper: createWrapper() });

      expect(screen.getByText(/useEffect properly/i)).toBeInTheDocument();
      expect(screen.getByText(/interface and type/i)).toBeInTheDocument();
      expect(screen.getByText("John Doe")).toBeInTheDocument();
      expect(screen.getByText("Jane Smith")).toBeInTheDocument();
    });

    it("shows urgent badge for questions older than 48 hours", () => {
      const mockItems = [
        {
          id: "1",
          questionExcerpt: "Old question",
          studentName: "John Doe",
          courseName: "Introduction to React",
          askedAt: "2026-02-15T08:00:00Z",
          isUrgent: true,
        },
      ];

      vi.mocked(hooksModule.usePendingQA).mockReturnValue({
        data: mockItems,
        isLoading: false,
        isError: false,
        error: null,
      } as ReturnType<typeof hooksModule.usePendingQA>);

      render(<PendingQAWidget />, { wrapper: createWrapper() });

      expect(screen.getByText(/urgent/i)).toBeInTheDocument();
    });

    it("shows answer button linking to Q&A detail", () => {
      const mockItems = [
        {
          id: "1",
          questionExcerpt: "Test question",
          studentName: "John Doe",
          courseName: "Introduction to React",
          askedAt: "2026-02-18T10:00:00Z",
          isUrgent: false,
        },
      ];

      vi.mocked(hooksModule.usePendingQA).mockReturnValue({
        data: mockItems,
        isLoading: false,
        isError: false,
        error: null,
      } as ReturnType<typeof hooksModule.usePendingQA>);

      render(<PendingQAWidget />, { wrapper: createWrapper() });

      const answerLink = screen.getByRole("link", { name: /answer/i });
      expect(answerLink).toHaveAttribute("href", "/qa/1");
    });

    it("limits display to 5 items maximum", () => {
      const mockItems = Array.from({ length: 7 }, (_, i) => ({
        id: String(i + 1),
        questionExcerpt: `Question ${String(i + 1)}`,
        studentName: `Student ${String(i + 1)}`,
        courseName: "Test Course",
        askedAt: "2026-02-18T10:00:00Z",
        isUrgent: false,
      }));

      vi.mocked(hooksModule.usePendingQA).mockReturnValue({
        data: mockItems,
        isLoading: false,
        isError: false,
        error: null,
      } as ReturnType<typeof hooksModule.usePendingQA>);

      render(<PendingQAWidget />, { wrapper: createWrapper() });

      expect(screen.getByText("Question 1")).toBeInTheDocument();
      expect(screen.getByText("Question 5")).toBeInTheDocument();
      expect(screen.queryByText("Question 6")).not.toBeInTheDocument();
      expect(screen.queryByText("Question 7")).not.toBeInTheDocument();
    });

    it("shows view all Q&A link", () => {
      vi.mocked(hooksModule.usePendingQA).mockReturnValue({
        data: [
          {
            id: "1",
            questionExcerpt: "Test question",
            studentName: "John Doe",
            courseName: "Introduction to React",
            askedAt: "2026-02-18T10:00:00Z",
            isUrgent: false,
          },
        ],
        isLoading: false,
        isError: false,
        error: null,
      } as ReturnType<typeof hooksModule.usePendingQA>);

      render(<PendingQAWidget />, { wrapper: createWrapper() });

      const viewAllLink = screen.getByRole("link", { name: /view all/i });
      expect(viewAllLink).toHaveAttribute("href", "/qa");
    });
  });
});
