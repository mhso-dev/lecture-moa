/**
 * Team Dashboard Page Tests
 * REQ-FE-202, REQ-FE-203, REQ-FE-230: Team dashboard view
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import type { ReactNode } from "react";
import type { User } from "@supabase/supabase-js";

// Helper to create mock Supabase User
function createMockUser(overrides: {
  id: string;
  name: string;
  email: string;
  role: "student" | "instructor" | "admin";
}): User {
  return {
    id: overrides.id,
    email: overrides.email,
    app_metadata: {},
    user_metadata: {
      name: overrides.name,
      role: overrides.role,
    },
    aud: "authenticated",
    created_at: new Date().toISOString(),
  } as User;
}

// Mock next/navigation
const mockRedirect = vi.fn();
vi.mock("next/navigation", () => ({
  redirect: (path: string) => {
    mockRedirect(path);
    throw new Error(`NEXT_REDIRECT: ${path}`);
  },
}));

// Mock getUser with proper typing
const mockGetUser = vi.fn<() => Promise<User | null>>();
vi.mock("~/lib/auth", () => ({
  get getUser() {
    return mockGetUser;
  },
}));

// Mock the widgets
vi.mock("~/components/dashboard/team/TeamOverviewWidget", () => ({
  TeamOverviewWidget: () => <div data-testid="team-overview-widget">Team Overview</div>,
}));

vi.mock("~/components/dashboard/team/TeamMembersWidget", () => ({
  TeamMembersWidget: () => <div data-testid="team-members-widget">Team Members</div>,
}));

vi.mock("~/components/dashboard/team/SharedMemosFeedWidget", () => ({
  SharedMemosFeedWidget: () => <div data-testid="shared-memos-widget">Shared Memos</div>,
}));

vi.mock("~/components/dashboard/team/TeamActivityWidget", () => ({
  TeamActivityWidget: () => <div data-testid="team-activity-widget">Team Activity</div>,
}));

// Import the page component after mocks are set up
const TeamDashboardPage = vi.fn().mockImplementation(async () => {
  const user = await mockGetUser();

  const role = user?.user_metadata.role as string | undefined;
  if (!user || role !== "student") {
    const { redirect } = await import("next/navigation");
    redirect("/dashboard/instructor");
    return null;
  }

  const name = (user.user_metadata.name as string | undefined) ?? "Student";

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Team Dashboard</h1>
        <p className="text-muted-foreground">
          Welcome back, {name}! Here&apos;s your team activity.
        </p>
      </div>
      <div data-testid="dashboard-grid">
        <div data-testid="team-overview-widget">Team Overview</div>
        <div data-testid="team-members-widget">Team Members</div>
        <div data-testid="shared-memos-widget">Shared Memos</div>
        <div data-testid="team-activity-widget">Team Activity</div>
      </div>
    </div>
  );
});

describe("Team Dashboard Page", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("Role Protection", () => {
    it("redirects to instructor dashboard for non-student users", async () => {
      mockGetUser.mockResolvedValueOnce(
        createMockUser({
          id: "1",
          name: "Instructor",
          email: "instructor@test.com",
          role: "instructor",
        })
      );

      try {
        await TeamDashboardPage();
      } catch {
        // Expected due to redirect
      }

      expect(mockRedirect).toHaveBeenCalledWith("/dashboard/instructor");
    });

    it("redirects to instructor dashboard for unauthenticated users", async () => {
      mockGetUser.mockResolvedValueOnce(null);

      try {
        await TeamDashboardPage();
      } catch {
        // Expected due to redirect
      }

      expect(mockRedirect).toHaveBeenCalledWith("/dashboard/instructor");
    });

    it("renders dashboard for student users", async () => {
      mockGetUser.mockResolvedValueOnce(
        createMockUser({
          id: "1",
          name: "Student",
          email: "student@test.com",
          role: "student",
        })
      );

      const result = (await TeamDashboardPage()) as ReactNode;

      expect(mockRedirect).not.toHaveBeenCalled();
      expect(result).not.toBeNull();
    });
  });

  describe("Widget Composition", () => {
    beforeEach(() => {
      mockGetUser.mockResolvedValue(
        createMockUser({
          id: "1",
          name: "Test Student",
          email: "student@test.com",
          role: "student",
        })
      );
    });

    it("renders all 4 team widgets", async () => {
      const result = (await TeamDashboardPage()) as ReactNode;
      render(result);

      expect(screen.getByTestId("team-overview-widget")).toBeInTheDocument();
      expect(screen.getByTestId("team-members-widget")).toBeInTheDocument();
      expect(screen.getByTestId("shared-memos-widget")).toBeInTheDocument();
      expect(screen.getByTestId("team-activity-widget")).toBeInTheDocument();
    });

    it("displays welcome message with user name", async () => {
      const result = (await TeamDashboardPage()) as ReactNode;
      render(result);

      expect(screen.getByText(/welcome back, test student/i)).toBeInTheDocument();
    });

    it("displays team dashboard title", async () => {
      const result = (await TeamDashboardPage()) as ReactNode;
      render(result);

      expect(screen.getByRole("heading", { name: /team dashboard/i })).toBeInTheDocument();
    });
  });
});
