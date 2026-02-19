/**
 * QuizPerformanceWidget Component Tests
 * REQ-FE-224: Quiz Performance Summary Widget
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { ReactNode } from "react";
import { QuizPerformanceWidget } from "../QuizPerformanceWidget";
import * as hooksModule from "~/hooks/dashboard/useInstructorDashboard";

// Mock the hooks
vi.mock("~/hooks/dashboard/useInstructorDashboard", () => ({
  useQuizPerformance: vi.fn(),
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

describe("QuizPerformanceWidget", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("loading state", () => {
    it("shows loading skeleton when data is loading", () => {
      vi.mocked(hooksModule.useQuizPerformance).mockReturnValue({
        data: undefined,
        isLoading: true,
        isError: false,
        error: null,
      } as ReturnType<typeof hooksModule.useQuizPerformance>);

      render(<QuizPerformanceWidget />, { wrapper: createWrapper() });

      expect(screen.getByText("Quiz Performance")).toBeInTheDocument();
    });
  });

  describe("error state", () => {
    it("shows error message when fetch fails", () => {
      vi.mocked(hooksModule.useQuizPerformance).mockReturnValue({
        data: undefined,
        isLoading: false,
        isError: true,
        error: new Error("Failed to load quiz data"),
      } as ReturnType<typeof hooksModule.useQuizPerformance>);

      render(<QuizPerformanceWidget />, { wrapper: createWrapper() });

      expect(screen.getByText(/failed to load quiz data/i)).toBeInTheDocument();
    });
  });

  describe("empty state", () => {
    it("shows empty state when no quizzes", () => {
      vi.mocked(hooksModule.useQuizPerformance).mockReturnValue({
        data: [],
        isLoading: false,
        isError: false,
        error: null,
      } as ReturnType<typeof hooksModule.useQuizPerformance>);

      render(<QuizPerformanceWidget />, { wrapper: createWrapper() });

      expect(screen.getByText(/no quiz data yet/i)).toBeInTheDocument();
    });

    it("shows create quiz link in empty state", () => {
      vi.mocked(hooksModule.useQuizPerformance).mockReturnValue({
        data: [],
        isLoading: false,
        isError: false,
        error: null,
      } as ReturnType<typeof hooksModule.useQuizPerformance>);

      render(<QuizPerformanceWidget />, { wrapper: createWrapper() });

      const link = screen.getByRole("link", { name: /create quiz/i });
      expect(link).toHaveAttribute("href", "/quizzes/create");
    });
  });

  describe("data state", () => {
    it("displays quiz performance summaries", () => {
      const mockSummaries = [
        {
          id: "1",
          quizTitle: "React Basics Quiz",
          courseName: "Introduction to React",
          averageScore: 82.5,
          submissionCount: 38,
          passRate: 89.5,
        },
        {
          id: "2",
          quizTitle: "TypeScript Generics",
          courseName: "Advanced TypeScript",
          averageScore: 75.0,
          submissionCount: 22,
          passRate: 77.3,
        },
      ];

      vi.mocked(hooksModule.useQuizPerformance).mockReturnValue({
        data: mockSummaries,
        isLoading: false,
        isError: false,
        error: null,
      } as ReturnType<typeof hooksModule.useQuizPerformance>);

      render(<QuizPerformanceWidget />, { wrapper: createWrapper() });

      expect(screen.getByText("React Basics Quiz")).toBeInTheDocument();
      expect(screen.getByText("TypeScript Generics")).toBeInTheDocument();
    });

    it("shows average score for each quiz", () => {
      const mockSummaries = [
        {
          id: "1",
          quizTitle: "React Basics Quiz",
          courseName: "Introduction to React",
          averageScore: 82.5,
          submissionCount: 38,
          passRate: 89.5,
        },
      ];

      vi.mocked(hooksModule.useQuizPerformance).mockReturnValue({
        data: mockSummaries,
        isLoading: false,
        isError: false,
        error: null,
      } as ReturnType<typeof hooksModule.useQuizPerformance>);

      render(<QuizPerformanceWidget />, { wrapper: createWrapper() });

      expect(screen.getByText("82.5%")).toBeInTheDocument();
    });

    it("shows submission count for each quiz", () => {
      const mockSummaries = [
        {
          id: "1",
          quizTitle: "React Basics Quiz",
          courseName: "Introduction to React",
          averageScore: 82.5,
          submissionCount: 38,
          passRate: 89.5,
        },
      ];

      vi.mocked(hooksModule.useQuizPerformance).mockReturnValue({
        data: mockSummaries,
        isLoading: false,
        isError: false,
        error: null,
      } as ReturnType<typeof hooksModule.useQuizPerformance>);

      render(<QuizPerformanceWidget />, { wrapper: createWrapper() });

      expect(screen.getByText("38")).toBeInTheDocument();
    });

    it("shows pass rate for each quiz", () => {
      const mockSummaries = [
        {
          id: "1",
          quizTitle: "React Basics Quiz",
          courseName: "Introduction to React",
          averageScore: 82.5,
          submissionCount: 38,
          passRate: 89.5,
        },
      ];

      vi.mocked(hooksModule.useQuizPerformance).mockReturnValue({
        data: mockSummaries,
        isLoading: false,
        isError: false,
        error: null,
      } as ReturnType<typeof hooksModule.useQuizPerformance>);

      render(<QuizPerformanceWidget />, { wrapper: createWrapper() });

      expect(screen.getByText("89.5%")).toBeInTheDocument();
    });

    it("limits display to 5 quizzes maximum", () => {
      const mockSummaries = Array.from({ length: 7 }, (_, i) => ({
        id: String(i + 1),
        quizTitle: `Quiz ${String(i + 1)}`,
        courseName: "Test Course",
        averageScore: 80,
        submissionCount: 10,
        passRate: 75,
      }));

      vi.mocked(hooksModule.useQuizPerformance).mockReturnValue({
        data: mockSummaries,
        isLoading: false,
        isError: false,
        error: null,
      } as ReturnType<typeof hooksModule.useQuizPerformance>);

      render(<QuizPerformanceWidget />, { wrapper: createWrapper() });

      expect(screen.getByText("Quiz 1")).toBeInTheDocument();
      expect(screen.getByText("Quiz 5")).toBeInTheDocument();
      expect(screen.queryByText("Quiz 6")).not.toBeInTheDocument();
      expect(screen.queryByText("Quiz 7")).not.toBeInTheDocument();
    });

    it("shows view all quizzes link", () => {
      vi.mocked(hooksModule.useQuizPerformance).mockReturnValue({
        data: [
          {
            id: "1",
            quizTitle: "Test Quiz",
            courseName: "Test Course",
            averageScore: 80,
            submissionCount: 10,
            passRate: 75,
          },
        ],
        isLoading: false,
        isError: false,
        error: null,
      } as ReturnType<typeof hooksModule.useQuizPerformance>);

      render(<QuizPerformanceWidget />, { wrapper: createWrapper() });

      const viewAllLink = screen.getByRole("link", { name: /view all/i });
      expect(viewAllLink).toHaveAttribute("href", "/quizzes");
    });
  });
});
