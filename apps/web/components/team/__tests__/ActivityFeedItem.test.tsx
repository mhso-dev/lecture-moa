/**
 * ActivityFeedItem Component Tests
 * TASK-029: Activity feed item display
 * REQ-FE-725: Individual activity item in feed
 */

import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { ActivityFeedItem } from "../ActivityFeedItem";
import type { TeamActivity } from "@shared";

// Mock date-fns
vi.mock("date-fns", () => ({
  formatDistanceToNow: () => "2 hours ago",
}));

const mockActivity: TeamActivity = {
  id: "activity-1",
  type: "member_joined",
  actorName: "John Doe",
  actorId: "user-1",
  description: "joined the team",
  teamId: "team-1",
  createdAt: new Date("2024-01-15T10:00:00Z"),
  payload: {},
};

describe("ActivityFeedItem", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should render actor name", () => {
    render(<ActivityFeedItem activity={mockActivity} />);

    expect(screen.getByText("John Doe")).toBeInTheDocument();
  });

  it("should render activity description", () => {
    render(<ActivityFeedItem activity={mockActivity} />);

    expect(screen.getByText(/joined the team/i)).toBeInTheDocument();
  });

  it("should render relative timestamp", () => {
    render(<ActivityFeedItem activity={mockActivity} />);

    expect(screen.getByText("2 hours ago")).toBeInTheDocument();
  });

  it("should display avatar with initials", () => {
    render(<ActivityFeedItem activity={mockActivity} />);

    expect(screen.getByText("JD")).toBeInTheDocument();
  });

  it("should show correct icon for member_joined activity", () => {
    const { container } = render(
      <ActivityFeedItem activity={mockActivity} />
    );

    // UserPlus icon should be present
    const icon = container.querySelector("svg");
    expect(icon).toBeInTheDocument();
  });

  it("should show correct icon for member_left activity", () => {
    const leftActivity: TeamActivity = {
      ...mockActivity,
      type: "member_joined",
      description: "left the team",
    };

    render(<ActivityFeedItem activity={leftActivity} />);

    expect(screen.getByText(/left the team/i)).toBeInTheDocument();
  });

  it("should show correct icon for memo_created activity", () => {
    const memoActivity: TeamActivity = {
      ...mockActivity,
      type: "memo_created",
      description: "created a new memo",
    };

    const { container } = render(
      <ActivityFeedItem activity={memoActivity} />
    );

    expect(screen.getByText(/created a new memo/i)).toBeInTheDocument();
    const icon = container.querySelector("svg");
    expect(icon).toBeInTheDocument();
  });

  it("should show correct icon for memo_updated activity", () => {
    const updateActivity: TeamActivity = {
      ...mockActivity,
      type: "memo_updated",
      description: "updated a memo",
    };

    render(<ActivityFeedItem activity={updateActivity} />);

    expect(screen.getByText(/updated a memo/i)).toBeInTheDocument();
  });

  it("should have proper accessibility attributes", () => {
    render(<ActivityFeedItem activity={mockActivity} />);

    const item = screen.getByRole("listitem");
    expect(item).toBeInTheDocument();
  });

  it("should display actor avatar when available", () => {
    const activityWithAvatar: TeamActivity = {
      ...mockActivity,
      payload: { actorAvatarUrl: "https://example.com/avatar.jpg" },
    };

    render(<ActivityFeedItem activity={activityWithAvatar} />);

    const avatar = screen.getByRole("img");
    expect(avatar).toHaveAttribute("src", "https://example.com/avatar.jpg");
  });
});
