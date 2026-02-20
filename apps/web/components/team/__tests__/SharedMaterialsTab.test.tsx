/**
 * SharedMaterialsTab Component Tests
 * TASK-028: Shared materials tab content
 * REQ-FE-723: Materials shared within team
 */

/* eslint-disable @typescript-eslint/no-unsafe-call */
import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { SharedMaterialsTab } from "../SharedMaterialsTab";

vi.mock("~/hooks/team/useTeam", () => ({
  useTeamMembers: () => ({
    data: [{ userId: "leader-1", role: "leader" }],
  }),
}));

vi.mock("~/stores/auth.store", () => ({
  useAuthStore: vi.fn((selector) => {
    const state = { user: { id: "leader-1" } };
    // eslint-disable-next-line @typescript-eslint/no-unsafe-return
    return selector ? selector(state) : state;
  }),
}));

describe("SharedMaterialsTab", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should show empty state when no materials", () => {
    // The component uses a local useTeamMaterials placeholder that returns empty data
    render(<SharedMaterialsTab teamId="team-1" />);

    expect(screen.getByText(/no shared materials/i)).toBeInTheDocument();
    expect(screen.getByText(/add materials to share with your team/i)).toBeInTheDocument();
  });

  it("should show add material button in empty state", () => {
    render(<SharedMaterialsTab teamId="team-1" />);

    expect(screen.getByRole("button", { name: /add material/i })).toBeInTheDocument();
  });

  it("should not show remove button when no materials", () => {
    render(
      <SharedMaterialsTab
        teamId="team-1"
        currentUserId="leader-1"
      />
    );

    // No materials = no remove buttons
    expect(screen.queryByRole("button", { name: /remove/i })).not.toBeInTheDocument();
  });

  it("should open add material dialog when add button clicked", () => {
    render(<SharedMaterialsTab teamId="team-1" />);

    const addButton = screen.getByRole("button", { name: /add material/i });
    fireEvent.click(addButton);

    expect(screen.getByRole("dialog")).toBeInTheDocument();
  });

  it("should display folder icon in empty state", () => {
    const { container } = render(<SharedMaterialsTab teamId="team-1" />);

    // FolderOpen icon should be present
    const icon = container.querySelector("svg");
    expect(icon).toBeInTheDocument();
  });

  it("should render empty state heading", () => {
    render(<SharedMaterialsTab teamId="team-1" />);

    expect(screen.getByText("No shared materials")).toBeInTheDocument();
  });

  it("should render empty state description", () => {
    render(<SharedMaterialsTab teamId="team-1" />);

    expect(screen.getByText("Add materials to share with your team.")).toBeInTheDocument();
  });

  it("should show dialog title when add button clicked", () => {
    render(<SharedMaterialsTab teamId="team-1" />);

    const addButton = screen.getByRole("button", { name: /add material/i });
    fireEvent.click(addButton);

    // Dialog title is rendered as a heading
    expect(screen.getByRole("heading", { name: /add material/i })).toBeInTheDocument();
  });

  it("should show dialog description when add button clicked", () => {
    render(<SharedMaterialsTab teamId="team-1" />);

    const addButton = screen.getByRole("button", { name: /add material/i });
    fireEvent.click(addButton);

    expect(screen.getByText(/select a material to share/i)).toBeInTheDocument();
  });

  it("should accept teamId and currentUserId props", () => {
    // Verify component renders without error with all props
    const { container } = render(
      <SharedMaterialsTab
        teamId="team-1"
        currentUserId="member-1"
      />
    );

    expect(container).toBeInTheDocument();
  });
});
