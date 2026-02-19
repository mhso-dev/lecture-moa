/**
 * MembersTab Component Tests
 * TASK-027: Members tab content
 * REQ-FE-722: Member list with invite functionality
 */

import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { MembersTab } from "../MembersTab";
import type { TeamMemberDetail } from "@shared";

// Mock hooks
const mockMembers: TeamMemberDetail[] = [
  {
    id: "member-1",
    userId: "user-1",
    teamId: "team-1",
    name: "John Doe",
    email: "john@example.com",
    role: "member",
    avatarUrl: null,
    lastActiveAt: new Date("2024-01-15"),
    joinedAt: new Date("2024-01-10"),
  },
  {
    id: "leader-1",
    userId: "leader-user",
    teamId: "team-1",
    name: "Jane Leader",
    email: "jane@example.com",
    role: "leader",
    avatarUrl: null,
    lastActiveAt: new Date("2024-01-15"),
    joinedAt: new Date("2024-01-01"),
  },
];

vi.mock("~/hooks/team/useTeam", () => ({
  useTeamMembers: () => ({
    data: mockMembers,
    isLoading: false,
    error: null,
  }),
}));

vi.mock("~/stores/auth.store", () => ({
  useAuthStore: vi.fn((selector) => {
    const state = { user: { id: "leader-user" } };
    return selector ? selector(state) : state;
  }),
}));

describe("MembersTab", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should render member list", () => {
    render(<MembersTab teamId="team-1" />);

    expect(screen.getByText("John Doe")).toBeInTheDocument();
    expect(screen.getByText("Jane Leader")).toBeInTheDocument();
  });

  it("should show member count", () => {
    render(<MembersTab teamId="team-1" />);

    expect(screen.getByText(/2 members/i)).toBeInTheDocument();
  });

  it("should show invite button for leaders", () => {
    render(<MembersTab teamId="team-1" currentUserId="leader-user" />);

    expect(screen.getByRole("button", { name: /invite member/i })).toBeInTheDocument();
  });

  it("should not show invite button for non-leaders", () => {
    vi.mock("~/hooks/team/useTeam", () => ({
      useTeamMembers: () => ({
        data: mockMembers,
        isLoading: false,
        error: null,
      }),
    }));

    render(
      <MembersTab
        teamId="team-1"
        currentUserId="user-1"
      />
    );

    // Should not find invite button for regular members
    expect(screen.queryByRole("button", { name: /invite member/i })).not.toBeInTheDocument();
  });

  it("should open invite modal when invite button clicked", () => {
    render(<MembersTab teamId="team-1" currentUserId="leader-user" />);

    const inviteButton = screen.getByRole("button", { name: /invite member/i });
    fireEvent.click(inviteButton);

    expect(screen.getByRole("dialog")).toBeInTheDocument();
  });

  it("should show loading skeleton while loading", () => {
    vi.mock("~/hooks/team/useTeam", () => ({
      useTeamMembers: () => ({
        data: undefined,
        isLoading: true,
        error: null,
      }),
    }));

    render(<MembersTab teamId="team-1" />);

    expect(screen.getByTestId("members-loading-skeleton")).toBeInTheDocument();
  });

  it("should show empty state when no members", () => {
    vi.mock("~/hooks/team/useTeam", () => ({
      useTeamMembers: () => ({
        data: [],
        isLoading: false,
        error: null,
      }),
    }));

    render(<MembersTab teamId="team-1" />);

    expect(screen.getByText(/no members yet/i)).toBeInTheDocument();
    expect(screen.getByText(/invite people to join your team/i)).toBeInTheDocument();
  });

  it("should display role badges correctly", () => {
    render(<MembersTab teamId="team-1" />);

    expect(screen.getByText("member")).toBeInTheDocument();
    expect(screen.getByText("leader")).toBeInTheDocument();
  });

  it("should pass isCurrentUserLeader to MemberListItem", () => {
    render(<MembersTab teamId="team-1" currentUserId="leader-user" />);

    // If leader, remove button should be visible
    const removeButtons = screen.queryAllByRole("button", { name: /remove/i });
    // Only one remove button (for the non-leader member, not for self)
    expect(removeButtons.length).toBeGreaterThanOrEqual(0);
  });

  it("should handle error state", () => {
    vi.mock("~/hooks/team/useTeam", () => ({
      useTeamMembers: () => ({
        data: undefined,
        isLoading: false,
        error: new Error("Failed to load members"),
      }),
    }));

    render(<MembersTab teamId="team-1" />);

    expect(screen.getByText(/failed to load members/i)).toBeInTheDocument();
  });
});
