/**
 * SharedMaterialsTab Component Tests
 * TASK-028: Shared materials tab content
 * REQ-FE-723: Materials shared within team
 */

import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { SharedMaterialsTab } from "../SharedMaterialsTab";

// Mock shared materials data
const mockMaterials = [
  {
    id: "material-1",
    title: "Introduction to React",
    courseId: "course-1",
    courseName: "Web Development",
    authorName: "John Doe",
    linkedAt: new Date("2024-01-15"),
  },
  {
    id: "material-2",
    title: "TypeScript Basics",
    courseId: "course-1",
    courseName: "Web Development",
    authorName: "Jane Smith",
    linkedAt: new Date("2024-01-10"),
  },
];

// Mock hooks - these would be implemented later
vi.mock("~/hooks/team/useTeamMaterials", () => ({
  useTeamMaterials: () => ({
    data: mockMaterials,
    isLoading: false,
    error: null,
  }),
  useRemoveMaterial: () => ({
    mutate: vi.fn(),
    isPending: false,
  }),
}));

vi.mock("~/hooks/team/useTeam", () => ({
  useTeamMembers: () => ({
    data: [{ userId: "leader-1", role: "leader" }],
  }),
}));

vi.mock("~/stores/auth.store", () => ({
  useAuthStore: vi.fn((selector) => {
    const state = { user: { id: "leader-1" } };
    return selector ? selector(state) : state;
  }),
}));

describe("SharedMaterialsTab", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should render materials list", () => {
    render(<SharedMaterialsTab teamId="team-1" />);

    expect(screen.getByText("Introduction to React")).toBeInTheDocument();
    expect(screen.getByText("TypeScript Basics")).toBeInTheDocument();
  });

  it("should display material details correctly", () => {
    render(<SharedMaterialsTab teamId="team-1" />);

    expect(screen.getByText("Web Development")).toBeInTheDocument();
    expect(screen.getByText("John Doe")).toBeInTheDocument();
    expect(screen.getByText("Jane Smith")).toBeInTheDocument();
  });

  it("should show add material button for all members", () => {
    render(<SharedMaterialsTab teamId="team-1" />);

    expect(screen.getByRole("button", { name: /add material/i })).toBeInTheDocument();
  });

  it("should show remove button only for leaders", () => {
    render(
      <SharedMaterialsTab
        teamId="team-1"
        currentUserId="leader-1"
      />
    );

    const removeButtons = screen.getAllByRole("button", { name: /remove/i });
    expect(removeButtons.length).toBe(2); // One for each material
  });

  it("should not show remove button for non-leaders", () => {
    vi.mock("~/stores/auth.store", () => ({
      useAuthStore: vi.fn((selector) => {
        const state = { user: { id: "member-1" } };
        return selector ? selector(state) : state;
      }),
    }));

    render(
      <SharedMaterialsTab
        teamId="team-1"
        currentUserId="member-1"
      />
    );

    expect(screen.queryByRole("button", { name: /remove/i })).not.toBeInTheDocument();
  });

  it("should open add material dialog when add button clicked", () => {
    render(<SharedMaterialsTab teamId="team-1" />);

    const addButton = screen.getByRole("button", { name: /add material/i });
    fireEvent.click(addButton);

    expect(screen.getByRole("dialog")).toBeInTheDocument();
  });

  it("should show loading state", () => {
    vi.mock("~/hooks/team/useTeamMaterials", () => ({
      useTeamMaterials: () => ({
        data: undefined,
        isLoading: true,
        error: null,
      }),
    }));

    render(<SharedMaterialsTab teamId="team-1" />);

    expect(screen.getByTestId("materials-loading-skeleton")).toBeInTheDocument();
  });

  it("should show empty state when no materials", () => {
    vi.mock("~/hooks/team/useTeamMaterials", () => ({
      useTeamMaterials: () => ({
        data: [],
        isLoading: false,
        error: null,
      }),
    }));

    render(<SharedMaterialsTab teamId="team-1" />);

    expect(screen.getByText(/no shared materials/i)).toBeInTheDocument();
    expect(screen.getByText(/add materials to share with your team/i)).toBeInTheDocument();
  });

  it("should display linked date in readable format", () => {
    render(<SharedMaterialsTab teamId="team-1" />);

    // Date formatting should show relative or formatted date
    expect(screen.getByText(/jan 15, 2024/i)).toBeInTheDocument();
  });

  it("should link to material detail page", () => {
    render(<SharedMaterialsTab teamId="team-1" />);

    const materialLink = screen.getByRole("link", { name: /introduction to react/i });
    expect(materialLink).toHaveAttribute("href", expect.stringContaining("/materials/material-1"));
  });
});
