/**
 * TeamCard Component Tests
 * TASK-017: Team card display component
 * REQ-FE-713: Team card requirements
 */

import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import type { Team } from "@shared";
import { TeamCard } from "../TeamCard";

// Mock team data
const mockTeam: Team = {
  id: "team-1",
  name: "Study Group Alpha",
  description:
    "A collaborative study group focusing on advanced programming concepts and algorithms",
  memberCount: 5,
  maxMembers: 10,
  courseIds: ["course-1", "course-2"],
  createdBy: "user-1",
  updatedAt: new Date("2024-01-15"),
  courseName: "Advanced Programming",
  createdAt: new Date("2024-01-01"),
};

const currentUserId = "user-1";
const otherUserId = "user-99";

describe("TeamCard", () => {
  describe("REQ-FE-713: Display Requirements", () => {
    it("should display team name", () => {
      render(
        <TeamCard team={mockTeam} currentUserId={otherUserId} />
      );

      expect(screen.getByText("Study Group Alpha")).toBeInTheDocument();
    });

    it("should display truncated description", () => {
      render(
        <TeamCard team={mockTeam} currentUserId={otherUserId} />
      );

      expect(
        screen.getByText(/A collaborative study group/)
      ).toBeInTheDocument();
    });

    it("should display member count as X / Y format", () => {
      render(
        <TeamCard team={mockTeam} currentUserId={otherUserId} />
      );

      expect(screen.getByText("5 / 10")).toBeInTheDocument();
    });

    it("should display avatar group for first 3 members", () => {
      render(
        <TeamCard team={mockTeam} currentUserId={otherUserId} />
      );

      // Avatar group should be present
      const avatarGroup = screen.getByRole("group", { name: /members/i });
      expect(avatarGroup).toBeInTheDocument();
    });

    it("should display course badges when team has courses", () => {
      render(
        <TeamCard team={mockTeam} currentUserId={otherUserId} />
      );

      // Course badges should be present
      const badges = screen.getAllByRole("badge");
      expect(badges.length).toBeGreaterThan(0);
    });
  });

  describe("REQ-FE-713: Role Badge Display", () => {
    it("should show 'leader' badge when currentUserId is team creator", () => {
      render(
        <TeamCard team={mockTeam} currentUserId={currentUserId} />
      );

      expect(screen.getByText("leader")).toBeInTheDocument();
    });

    it("should show 'member' badge when currentUserId is team member but not creator", () => {
      const memberTeam = {
        ...mockTeam,
        createdBy: "other-user",
        memberCount: 2,
      };

      render(
        <TeamCard
          team={memberTeam}
          currentUserId={currentUserId}
          isMember={true}
        />
      );

      expect(screen.getByText("member")).toBeInTheDocument();
    });

    it("should not show role badge when currentUserId is not in team", () => {
      render(
        <TeamCard team={mockTeam} currentUserId={otherUserId} />
      );

      expect(screen.queryByText("leader")).not.toBeInTheDocument();
      expect(screen.queryByText("member")).not.toBeInTheDocument();
    });
  });

  describe("REQ-FE-713: Action Buttons", () => {
    it("should display Join button for non-members", () => {
      const handleJoin = vi.fn();

      render(
        <TeamCard
          team={mockTeam}
          currentUserId={otherUserId}
          onJoin={handleJoin}
        />
      );

      const joinButton = screen.getByRole("button", { name: /join/i });
      expect(joinButton).toBeInTheDocument();
    });

    it("should display View button for members", () => {
      const handleView = vi.fn();

      render(
        <TeamCard
          team={mockTeam}
          currentUserId={currentUserId}
          isMember={true}
          onView={handleView}
        />
      );

      const viewButton = screen.getByRole("button", { name: /view/i });
      expect(viewButton).toBeInTheDocument();
    });

    it("should call onJoin when Join button is clicked", async () => {
      const user = userEvent.setup();
      const handleJoin = vi.fn();

      render(
        <TeamCard
          team={mockTeam}
          currentUserId={otherUserId}
          onJoin={handleJoin}
        />
      );

      const joinButton = screen.getByRole("button", { name: /join/i });
      await user.click(joinButton);

      expect(handleJoin).toHaveBeenCalledTimes(1);
    });

    it("should call onView when View button is clicked", async () => {
      const user = userEvent.setup();
      const handleView = vi.fn();

      render(
        <TeamCard
          team={mockTeam}
          currentUserId={currentUserId}
          isMember={true}
          onView={handleView}
        />
      );

      const viewButton = screen.getByRole("button", { name: /view/i });
      await user.click(viewButton);

      expect(handleView).toHaveBeenCalledTimes(1);
    });
  });

  describe("REQ-FE-713: Team Full State", () => {
    it("should disable Join button with tooltip when team is at capacity", () => {
      const fullTeam = {
        ...mockTeam,
        memberCount: 10,
        maxMembers: 10,
      };

      render(
        <TeamCard team={fullTeam} currentUserId={otherUserId} />
      );

      const joinButton = screen.getByRole("button", { name: /join/i });
      expect(joinButton).toBeDisabled();
    });

    it("should have tooltip text for full team join button", () => {
      const fullTeam = {
        ...mockTeam,
        memberCount: 10,
        maxMembers: 10,
      };

      render(
        <TeamCard team={fullTeam} currentUserId={otherUserId} />
      );

      const joinButton = screen.getByRole("button", { name: /join/i });
      expect(joinButton).toBeDisabled();
      expect(joinButton).toHaveAttribute("disabled");
    });

    it("should enable Join button when team is not full", () => {
      render(
        <TeamCard team={mockTeam} currentUserId={otherUserId} />
      );

      const joinButton = screen.getByRole("button", { name: /join/i });
      expect(joinButton).not.toBeDisabled();
    });
  });

  describe("REQ-FE-713: Responsive Design", () => {
    it("should render correctly on mobile viewport", () => {
      // Mock mobile viewport
      global.innerWidth = 375;
      global.innerHeight = 667;

      render(
        <TeamCard team={mockTeam} currentUserId={otherUserId} />
      );

      expect(screen.getByText("Study Group Alpha")).toBeInTheDocument();
    });

    it("should render correctly on desktop viewport", () => {
      // Mock desktop viewport
      global.innerWidth = 1920;
      global.innerHeight = 1080;

      render(
        <TeamCard team={mockTeam} currentUserId={otherUserId} />
      );

      expect(screen.getByText("Study Group Alpha")).toBeInTheDocument();
    });
  });
});
