/**
 * StudentActivityWidget Component Tests
 * REQ-FE-222: Student Enrollment & Activity Widget
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { ReactNode } from "react";
import { StudentActivityWidget } from "../StudentActivityWidget";
import * as hooksModule from "~/hooks/dashboard/useInstructorDashboard";

// Mock the hooks
vi.mock("~/hooks/dashboard/useInstructorDashboard", () => ({
  useStudentActivity: vi.fn(),
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

describe("StudentActivityWidget", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("loading state", () => {
    it("shows loading skeleton when data is loading", () => {
      vi.mocked(hooksModule.useStudentActivity).mockReturnValue({
        data: undefined,
        isLoading: true,
        isError: false,
        error: null,
      } as ReturnType<typeof hooksModule.useStudentActivity>);

      render(<StudentActivityWidget />, { wrapper: createWrapper() });

      expect(screen.getByText("Student Activity")).toBeInTheDocument();
    });
  });

  describe("error state", () => {
    it("shows error message when fetch fails", () => {
      vi.mocked(hooksModule.useStudentActivity).mockReturnValue({
        data: undefined,
        isLoading: false,
        isError: true,
        error: new Error("Failed to load activity"),
      } as ReturnType<typeof hooksModule.useStudentActivity>);

      render(<StudentActivityWidget />, { wrapper: createWrapper() });

      expect(screen.getByText(/failed to load activity/i)).toBeInTheDocument();
    });
  });

  describe("data state", () => {
    it("displays all activity metrics", () => {
      const mockStats = {
        totalStudents: 150,
        activeStudents7d: 87,
        avgCompletionRate: 68.5,
        studySessions7d: 423,
      };

      vi.mocked(hooksModule.useStudentActivity).mockReturnValue({
        data: mockStats,
        isLoading: false,
        isError: false,
        error: null,
      } as ReturnType<typeof hooksModule.useStudentActivity>);

      render(<StudentActivityWidget />, { wrapper: createWrapper() });

      expect(screen.getByText("150")).toBeInTheDocument();
      expect(screen.getByText("87")).toBeInTheDocument();
      expect(screen.getByText("68.5%")).toBeInTheDocument();
      expect(screen.getByText("423")).toBeInTheDocument();
    });

    it("shows metric labels", () => {
      const mockStats = {
        totalStudents: 150,
        activeStudents7d: 87,
        avgCompletionRate: 68.5,
        studySessions7d: 423,
      };

      vi.mocked(hooksModule.useStudentActivity).mockReturnValue({
        data: mockStats,
        isLoading: false,
        isError: false,
        error: null,
      } as ReturnType<typeof hooksModule.useStudentActivity>);

      render(<StudentActivityWidget />, { wrapper: createWrapper() });

      expect(screen.getByText(/total students/i)).toBeInTheDocument();
      expect(screen.getByText(/active 7d/i)).toBeInTheDocument();
      expect(screen.getByText(/avg completion/i)).toBeInTheDocument();
      expect(screen.getByText(/sessions 7d/i)).toBeInTheDocument();
    });

    it("shows zeros when no activity", () => {
      const mockStats = {
        totalStudents: 0,
        activeStudents7d: 0,
        avgCompletionRate: 0,
        studySessions7d: 0,
      };

      vi.mocked(hooksModule.useStudentActivity).mockReturnValue({
        data: mockStats,
        isLoading: false,
        isError: false,
        error: null,
      } as ReturnType<typeof hooksModule.useStudentActivity>);

      render(<StudentActivityWidget />, { wrapper: createWrapper() });

      // Should show zeros, not empty state
      const zeros = screen.getAllByText("0");
      expect(zeros.length).toBeGreaterThanOrEqual(3);
    });
  });
});
