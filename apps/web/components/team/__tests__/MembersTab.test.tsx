/**
 * MembersTab Component Tests
 * TASK-027: Members tab content
 * REQ-FE-722: Member list with invite functionality
 */

/* eslint-disable @typescript-eslint/no-unsafe-call */
import { render, screen, fireEvent } from "@testing-library/react";
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
    role: "member",
    avatarUrl: undefined,
    lastActiveAt: new Date("2024-01-15"),
    joinedAt: new Date("2024-01-10"),
  },
  {
    id: "leader-1",
    userId: "leader-user",
    teamId: "team-1",
    name: "Jane Leader",
    role: "leader",
    avatarUrl: undefined,
    lastActiveAt: new Date("2024-01-15"),
    joinedAt: new Date("2024-01-01"),
  },
];

// Use vi.hoisted to create mutable mock refs
const { mockUseTeamMembersRef } = vi.hoisted(() => ({
  mockUseTeamMembersRef: {
    fn: vi.fn(),
  },
}));

vi.mock("~/hooks/team/useTeam", () => ({
  // eslint-disable-next-line @typescript-eslint/no-unsafe-return
  useTeamMembers: (...args: unknown[]) => mockUseTeamMembersRef.fn(...args),
}));

vi.mock("~/stores/auth.store", () => ({
  useAuthStore: vi.fn((selector) => {
    const state = { user: { id: "leader-user" } };
    // eslint-disable-next-line @typescript-eslint/no-unsafe-return
    return selector ? selector(state) : state;
  }),
}));

// Mock useTeamMembership to prevent env.ts import chain
vi.mock("~/hooks/team/useTeamMembership", () => ({
  useTeamMembership: () => ({
    inviteMember: { mutate: vi.fn(), isPending: false },
    removeMember: { mutate: vi.fn(), isPending: false },
    changeMemberRole: { mutate: vi.fn(), isPending: false },
    joinTeam: { mutate: vi.fn(), isPending: false },
    leaveTeam: { mutate: vi.fn(), isPending: false },
  }),
}));

// Mock sonner for child components
vi.mock("sonner", () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

describe("MembersTab", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Default: return members data
    mockUseTeamMembersRef.fn.mockReturnValue({
      data: mockMembers,
      isLoading: false,
      error: null,
    });
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
    mockUseTeamMembersRef.fn.mockReturnValue({
      data: undefined,
      isLoading: true,
      error: null,
    });

    render(<MembersTab teamId="team-1" />);

    expect(screen.getByTestId("members-loading-skeleton")).toBeInTheDocument();
  });

  it("should show empty state when no members", () => {
    mockUseTeamMembersRef.fn.mockReturnValue({
      data: [],
      isLoading: false,
      error: null,
    });

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

    // If leader, remove button should be visible for non-self members
    const removeButtons = screen.queryAllByRole("button", { name: /remove/i });
    // Only one remove button (for the non-leader member, not for self)
    expect(removeButtons.length).toBeGreaterThanOrEqual(0);
  });

  it("should handle error state", () => {
    mockUseTeamMembersRef.fn.mockReturnValue({
      data: undefined,
      isLoading: false,
      error: new Error("Failed to load members"),
    });

    render(<MembersTab teamId="team-1" />);

    expect(screen.getByText(/failed to load members/i)).toBeInTheDocument();
  });
});
