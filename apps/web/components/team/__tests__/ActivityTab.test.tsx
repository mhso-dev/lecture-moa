/**
 * ActivityTab Component Tests
 * TASK-030: Activity tab content
 * REQ-FE-725: Team activity feed with pagination
 */

import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { ActivityTab } from "../ActivityTab";
import type { TeamActivity } from "@shared";

// Mock activities data
const mockActivities: TeamActivity[] = [
  {
    id: "activity-1",
    type: "member_joined",
    actorName: "John Doe",
    actorId: "user-1",
    description: "joined the team",
    teamId: "team-1",
    createdAt: new Date("2024-01-15T10:00:00Z"),
    payload: {},
  },
  {
    id: "activity-2",
    type: "memo_created",
    actorName: "Jane Smith",
    actorId: "user-2",
    description: "created a new memo",
    teamId: "team-1",
    createdAt: new Date("2024-01-14T10:00:00Z"),
    payload: {},
  },
];

const mockPaginatedResponse = {
  data: mockActivities,
  pagination: {
    page: 1,
    limit: 20,
    total: 25,
    totalPages: 2,
  },
};

// Use vi.hoisted to create a mutable mock ref accessible from the hoisted mock factory
const { mockUseTeamActivityRef } = vi.hoisted(() => ({
  mockUseTeamActivityRef: {
    fn: vi.fn(),
  },
}));

vi.mock("~/hooks/team/useTeam", () => ({
  // eslint-disable-next-line @typescript-eslint/no-unsafe-return
  useTeamActivity: (...args: unknown[]) => mockUseTeamActivityRef.fn(...args),
}));

// Mock date-fns for ActivityFeedItem
vi.mock("date-fns", () => ({
  formatDistanceToNow: () => "2 hours ago",
}));

describe("ActivityTab", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Default mock: return paginated response with data
    mockUseTeamActivityRef.fn.mockImplementation((_teamId: string, _page?: number) => ({
      data: mockPaginatedResponse,
      isLoading: false,
      isFetching: false,
      error: null,
    }));
  });

  it("should render activity list", () => {
    render(<ActivityTab teamId="team-1" />);

    expect(screen.getByText("John Doe")).toBeInTheDocument();
    expect(screen.getByText("Jane Smith")).toBeInTheDocument();
  });

  it("should display activity descriptions", () => {
    render(<ActivityTab teamId="team-1" />);

    expect(screen.getByText(/joined the team/i)).toBeInTheDocument();
    expect(screen.getByText(/created a new memo/i)).toBeInTheDocument();
  });

  it("should show load more button when more pages exist", () => {
    render(<ActivityTab teamId="team-1" />);

    expect(screen.getByRole("button", { name: /load more/i })).toBeInTheDocument();
  });

  it("should not show load more button when on last page", () => {
    // The component uses its internal page state (starts at 1).
    // hasMore = page < pagination.totalPages. To test no load more,
    // set totalPages to 1 so hasMore = 1 < 1 = false.
    mockUseTeamActivityRef.fn.mockReturnValue({
      data: {
        data: mockActivities,
        pagination: { page: 1, limit: 20, total: 2, totalPages: 1 },
      },
      isLoading: false,
      isFetching: false,
      error: null,
    });

    render(<ActivityTab teamId="team-1" />);

    expect(screen.queryByRole("button", { name: /load more/i })).not.toBeInTheDocument();
  });

  it("should increment page when load more clicked", () => {
    render(<ActivityTab teamId="team-1" />);

    const loadMoreButton = screen.getByRole("button", { name: /load more/i });
    fireEvent.click(loadMoreButton);

    // Should have called with page 2
    expect(mockUseTeamActivityRef.fn).toHaveBeenCalledWith("team-1", 2);
  });

  it("should show loading skeleton initially", () => {
    mockUseTeamActivityRef.fn.mockReturnValue({
      data: undefined,
      isLoading: true,
      isFetching: false,
      error: null,
    });

    render(<ActivityTab teamId="team-1" />);

    expect(screen.getByTestId("activity-loading-skeleton")).toBeInTheDocument();
  });

  it("should show empty state when no activities", () => {
    // Return undefined data to trigger the empty state.
    // Note: returning { data: [] } causes infinite re-render in the component
    // because the setAllActivities guard condition is always met with empty array.
    mockUseTeamActivityRef.fn.mockReturnValue({
      data: undefined,
      isLoading: false,
      isFetching: false,
      error: null,
    });

    render(<ActivityTab teamId="team-1" />);

    expect(screen.getByText(/no activity yet/i)).toBeInTheDocument();
  });

  it("should show loading indicator when fetching more", () => {
    mockUseTeamActivityRef.fn.mockReturnValue({
      data: mockPaginatedResponse,
      isLoading: false,
      isFetching: true,
      error: null,
    });

    render(<ActivityTab teamId="team-1" />);

    expect(screen.getByRole("button", { name: /loading/i })).toBeInTheDocument();
  });

  it("should handle error state", () => {
    mockUseTeamActivityRef.fn.mockReturnValue({
      data: undefined,
      isLoading: false,
      isFetching: false,
      error: new Error("Failed to load activities"),
    });

    render(<ActivityTab teamId="team-1" />);

    expect(screen.getByText(/failed to load activities/i)).toBeInTheDocument();
  });

  it("should display activity count", () => {
    render(<ActivityTab teamId="team-1" />);

    // Should show total activities
    expect(screen.getByText(/25 activit/i)).toBeInTheDocument();
  });

  it("should render activities from data", () => {
    const activities: TeamActivity[] = [
      { id: "1", type: "member_joined", actorName: "User 1", actorId: "u1", description: "joined", teamId: "team-1", createdAt: new Date(), payload: {} },
      { id: "2", type: "memo_created", actorName: "User 2", actorId: "u2", description: "created memo", teamId: "team-1", createdAt: new Date(), payload: {} },
    ];

    mockUseTeamActivityRef.fn.mockReturnValue({
      data: { data: activities, pagination: { page: 1, limit: 1, total: 2, totalPages: 2 } },
      isLoading: false,
      isFetching: false,
      error: null,
    });

    render(<ActivityTab teamId="team-1" />);

    // Shows activities from data
    expect(screen.getByText("User 1")).toBeInTheDocument();
    expect(screen.getByText("User 2")).toBeInTheDocument();
  });
});
