/**
 * MemberListItem Component Tests
 * TASK-025: Member list item display component
 * REQ-FE-722: Member display with role and actions
 */

/* eslint-disable @typescript-eslint/no-unsafe-call */
import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { MemberListItem } from "../MemberListItem";
import type { TeamMemberDetail } from "@shared";

// Mock dependencies
vi.mock("~/hooks/team/useTeamMembership", () => ({
  useTeamMembership: () => ({
    removeMember: { mutate: vi.fn(), isPending: false },
    changeMemberRole: { mutate: vi.fn(), isPending: false },
  }),
}));

vi.mock("~/stores/auth.store", () => ({
  useAuthStore: vi.fn((selector) => {
    const state = { user: { id: "current-user" } };
    // eslint-disable-next-line @typescript-eslint/no-unsafe-return
    return selector ? selector(state) : state;
  }),
}));

// Mock sonner toast
vi.mock("sonner", () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

// Mock format date
vi.mock("~/lib/utils", () => ({
  cn: (..._classes: string[]) => _classes.filter(Boolean).join(" "),
  formatDate: (_date: Date) => "Jan 15, 2024",
}));

const mockMember: TeamMemberDetail = {
  id: "member-1",
  userId: "user-1",
  teamId: "team-1",
  name: "John Doe",
  role: "member",
  avatarUrl: undefined,
  lastActiveAt: new Date("2024-01-15"),
  joinedAt: new Date("2024-01-10"),
};

const mockLeaderMember: TeamMemberDetail = {
  ...mockMember,
  id: "leader-1",
  userId: "leader-user",
  role: "leader",
  name: "Jane Leader",
};

describe("MemberListItem", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should render member information correctly", () => {
    render(
      <MemberListItem
        member={mockMember}
        teamId="team-1"
        isCurrentUserLeader={false}
      />
    );

    expect(screen.getByText("John Doe")).toBeInTheDocument();
    expect(screen.getByText("member")).toBeInTheDocument();
    expect(screen.getByText(/joined/i)).toBeInTheDocument();
  });

  it("should display avatar with fallback initials", () => {
    render(
      <MemberListItem
        member={mockMember}
        teamId="team-1"
        isCurrentUserLeader={false}
      />
    );

    // Avatar fallback shows first letter of name
    expect(screen.getByText("JD")).toBeInTheDocument();
  });

  it("should show leader role badge for leaders", () => {
    render(
      <MemberListItem
        member={mockLeaderMember}
        teamId="team-1"
        isCurrentUserLeader={false}
      />
    );

    expect(screen.getByText("leader")).toBeInTheDocument();
  });

  it("should not show actions for non-leaders viewing members", () => {
    render(
      <MemberListItem
        member={mockMember}
        teamId="team-1"
        isCurrentUserLeader={false}
      />
    );

    // No action buttons should be visible
    expect(screen.queryByRole("button", { name: /remove/i })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /change role/i })).not.toBeInTheDocument();
  });

  it("should show actions when viewer is leader", () => {
    render(
      <MemberListItem
        member={mockMember}
        teamId="team-1"
        isCurrentUserLeader={true}
      />
    );

    expect(screen.getByRole("button", { name: /remove/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /change role/i })).toBeInTheDocument();
  });

  it("should not allow leaders to remove themselves", () => {
    render(
      <MemberListItem
        member={mockLeaderMember}
        teamId="team-1"
        isCurrentUserLeader={true}
        currentUserId="leader-user"
      />
    );

    // When viewing self (isSelf=true), canManage is false so no action buttons render
    expect(screen.queryByRole("button", { name: /remove/i })).not.toBeInTheDocument();
  });

  it("should open confirmation dialog when remove is clicked", () => {
    render(
      <MemberListItem
        member={mockMember}
        teamId="team-1"
        isCurrentUserLeader={true}
      />
    );

    const removeButton = screen.getByRole("button", { name: /remove/i });
    fireEvent.click(removeButton);

    expect(screen.getByRole("alertdialog")).toBeInTheDocument();
    expect(screen.getByText(/are you sure/i)).toBeInTheDocument();
  });

  it("should show role change dropdown trigger for manageable members", () => {
    render(
      <MemberListItem
        member={mockMember}
        teamId="team-1"
        isCurrentUserLeader={true}
      />
    );

    // Verify the change role dropdown trigger is rendered
    const roleButton = screen.getByRole("button", { name: /change role/i });
    expect(roleButton).toBeInTheDocument();
  });

  it("should display joined date correctly", () => {
    render(
      <MemberListItem
        member={mockMember}
        teamId="team-1"
        isCurrentUserLeader={false}
      />
    );

    expect(screen.getByText(/joined jan 10, 2024/i)).toBeInTheDocument();
  });

});
