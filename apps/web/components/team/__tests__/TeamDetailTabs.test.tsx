/**
 * TeamDetailTabs Component Tests
 * TASK-024: Tab navigation for team detail page
 * REQ-FE-726: URL hash synchronization and tab navigation
 */

import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { TeamDetailTabs } from "../TeamDetailTabs";

// Mock useTeamStore
vi.mock("~/stores/team.store", () => ({
  useTeamStore: vi.fn((selector) => {
    const state = { activeTab: "members" as const, setActiveTab: vi.fn() };
    return selector ? selector(state) : state;
  }),
  useTeamActiveTab: vi.fn(() => "members"),
}));

// Mock next/navigation
const mockPush = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockPush }),
  usePathname: () => "/teams/team-123",
  useSearchParams: () => new URLSearchParams(),
}));

describe("TeamDetailTabs", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Reset window.location.hash
    window.location.hash = "";
  });

  it("should render all four tabs", () => {
    render(<TeamDetailTabs teamId="team-123" />);

    expect(screen.getByRole("tab", { name: /members/i })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: /shared materials/i })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: /team memos/i })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: /activity/i })).toBeInTheDocument();
  });

  it("should have Members tab as default active", () => {
    render(<TeamDetailTabs teamId="team-123" />);

    const membersTab = screen.getByRole("tab", { name: /members/i });
    expect(membersTab).toHaveAttribute("data-state", "active");
  });

  it("should update URL hash when tab changes", async () => {
    render(<TeamDetailTabs teamId="team-123" />);

    const activityTab = screen.getByRole("tab", { name: /activity/i });
    fireEvent.click(activityTab);

    // URL hash should be updated
    expect(window.location.hash).toBe("#activity");
  });

  it("should sync active tab with URL hash on mount", () => {
    // Set hash before render
    window.location.hash = "#materials";

    render(<TeamDetailTabs teamId="team-123" />);

    // Materials tab should be active
    const materialsTab = screen.getByRole("tab", { name: /shared materials/i });
    expect(materialsTab).toHaveAttribute("data-state", "active");
  });

  it("should render tab content panels with correct accessibility", () => {
    render(<TeamDetailTabs teamId="team-123" />);

    // Check tab panels exist
    expect(screen.getByRole("tabpanel", { name: /members/i })).toBeInTheDocument();
    expect(screen.getByRole("tabpanel", { name: /shared materials/i })).toBeInTheDocument();
    expect(screen.getByRole("tabpanel", { name: /team memos/i })).toBeInTheDocument();
    expect(screen.getByRole("tabpanel", { name: /activity/i })).toBeInTheDocument();
  });

  it("should only show active panel content", () => {
    render(<TeamDetailTabs teamId="team-123" />);

    // Only members panel should be visible
    const membersPanel = screen.getByRole("tabpanel", { name: /members/i });
    expect(membersPanel).toHaveAttribute("data-state", "active");
  });

  it("should handle invalid hash gracefully", () => {
    window.location.hash = "#invalid";

    render(<TeamDetailTabs teamId="team-123" />);

    // Should default to members tab
    const membersTab = screen.getByRole("tab", { name: /members/i });
    expect(membersTab).toHaveAttribute("data-state", "active");
  });

  it("should have correct tab values for hash mapping", () => {
    render(<TeamDetailTabs teamId="team-123" />);

    const tabs = screen.getAllByRole("tab");
    const expectedValues = ["members", "materials", "memos", "activity"];

    tabs.forEach((tab, index) => {
      expect(tab).toHaveAttribute("data-value", expectedValues[index]);
    });
  });
});
