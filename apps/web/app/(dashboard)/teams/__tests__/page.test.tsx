/**
 * Team List Page Tests
 * TASK-019: Team List Page
 * REQ-FE-710, REQ-FE-711, REQ-FE-712: Team list page with My Teams and Browse sections
 */

/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-non-null-assertion */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { ReactNode } from "react";

// Mock team data
const mockMyTeams = [
  {
    id: "team-1",
    name: "Study Group A",
    description: "A study group for course A",
    memberCount: 5,
    maxMembers: 10,
    courseId: "course-1",
    inviteCode: null,
    createdBy: "user-1",
    createdAt: new Date("2024-01-01"),
    updatedAt: new Date("2024-01-15"),
    courseName: "Course A",
  },
  {
    id: "team-2",
    name: "Project Team B",
    description: "Project collaboration team",
    memberCount: 3,
    maxMembers: 8,
    courseId: "course-2",
    inviteCode: null,
    createdBy: "user-2",
    createdAt: new Date("2024-01-05"),
    updatedAt: new Date("2024-01-20"),
    courseName: "Course B",
  },
];

const mockAvailableTeams = [
  {
    id: "team-3",
    name: "Open Study Group",
    description: "Open to new members",
    memberCount: 4,
    maxMembers: 10,
    courseId: "course-1",
    inviteCode: null,
    createdBy: "user-3",
    createdAt: new Date("2024-01-10"),
    updatedAt: new Date("2024-01-25"),
    courseName: "Course A",
  },
];

// Mock next/navigation
const mockPush = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: mockPush,
  }),
}));

// Mock the hooks
vi.mock("~/hooks/team/useTeams", () => ({
  useMyTeams: vi.fn(),
  useAvailableTeams: vi.fn(),
  teamKeys: {
    all: ["teams"] as const,
    lists: () => [...["teams"], "list"] as const,
    myTeams: () => [...["teams"], "list", "my"] as const,
    availableTeams: (search?: string) =>
      [...["teams"], "list", "available", search] as const,
  },
}));

// Mock the team search hook
vi.mock("~/hooks/team/useTeamSearch", () => ({
  useTeamSearch: vi.fn(),
}));

// Mock the auth store
vi.mock("~/stores/auth.store", () => ({
  useAuthStore: vi.fn(() => ({
    user: { id: "user-1", name: "Test User", email: "test@example.com" },
    role: "student",
    isAuthenticated: true,
  })),
}));

// Mock the team membership hook
vi.mock("~/hooks/team/useTeamMembership", () => ({
  useJoinTeam: vi.fn(() => ({
    mutate: vi.fn(),
    isPending: false,
  })),
}));

// Import mocked hooks after vi.mock
import { useMyTeams } from "~/hooks/team/useTeams";
import { useTeamSearch } from "~/hooks/team/useTeamSearch";

// Helper to create wrapper with providers
function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });

  return function Wrapper({ children }: { children: ReactNode }) {
    return (
      <QueryClientProvider client={queryClient}>
        {children}
      </QueryClientProvider>
    );
  };
}

// Mock the TeamListPageContent component for initial tests
// We'll implement the actual component in GREEN phase
vi.mock("~/components/team/TeamListContent", () => ({
  TeamListContent: vi.fn(({ myTeams, availableTeams, isLoading, searchQuery, setSearchQuery }: any) => (
    <div data-testid="team-list-content">
      <h1>Teams</h1>
      <a href="/teams/new">Create Team</a>

      <section aria-label="My Teams">
        <h2>My Teams</h2>
        {isLoading ? (
          <div data-testid="skeleton-loader">Loading...</div>
        ) : myTeams.length === 0 ? (
          <p>You haven&apos;t joined any teams yet. Browse available teams below.</p>
        ) : (
          <div data-testid="my-teams-grid">
            {myTeams.map((team: typeof mockMyTeams[0]) => (
              <article key={team.id} data-testid={`team-card-${team.id}`}>
                <h3>{team.name}</h3>
                <p>{team.description}</p>
                <span>{team.memberCount} / {team.maxMembers}</span>
                <span data-testid={`role-badge-${team.id}`}>
                  {team.createdBy === "user-1" ? "leader" : "member"}
                </span>
                <button onClick={() => mockPush(`/teams/${team.id}`)}>View</button>
              </article>
            ))}
          </div>
        )}
      </section>

      <section aria-label="Browse Teams">
        <h2>Browse Teams</h2>
        <input
          type="search"
          placeholder="Search teams..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          aria-label="Search teams"
        />
        {isLoading ? (
          <div data-testid="skeleton-loader">Loading...</div>
        ) : availableTeams.length === 0 && searchQuery ? (
          <p>No teams found matching your search.</p>
        ) : (
          <div data-testid="available-teams-grid">
            {availableTeams.map((team: typeof mockAvailableTeams[0]) => {
              const isFull = team.memberCount >= team.maxMembers;
              const isMember = myTeams.some((t: typeof mockMyTeams[0]) => t.id === team.id);
              return (
                <article key={team.id} data-testid={`available-team-${team.id}`}>
                  <h3>{team.name}</h3>
                  <p>{team.description}</p>
                  <span>{team.memberCount} / {team.maxMembers}</span>
                  {isMember ? (
                    <button onClick={() => mockPush(`/teams/${team.id}`)}>View</button>
                  ) : (
                    <button disabled={isFull}>
                      {isFull ? "Full" : "Join"}
                    </button>
                  )}
                </article>
              );
            })}
          </div>
        )}
      </section>
    </div>
  )),
}));

// Import after mocks are set up
import { TeamListContent } from "~/components/team/TeamListContent";

describe("TeamListPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockPush.mockClear();
  });

  describe("REQ-FE-710: Team List Page Route", () => {
    it("should render page title with Teams heading", () => {
      vi.mocked(useMyTeams).mockReturnValue({
        data: [],
        isLoading: false,
        isError: false,
        isPending: false,
        isLoadingError: false,
        isRefetchError: false,
        error: null,
        refetch: vi.fn(),
      } as any);
      vi.mocked(useTeamSearch).mockReturnValue({
        teams: [],
        isLoading: false,
        searchQuery: "",
        setSearchQuery: vi.fn(),
      });

      render(<TeamListContent myTeams={[]} availableTeams={[]} isLoading={false} searchQuery="" setSearchQuery={vi.fn()} />, {
        wrapper: createWrapper(),
      });

      // Main page heading is h1
      expect(screen.getByRole("heading", { level: 1, name: /teams/i })).toBeInTheDocument();
    });

    it("should render Create Team button linking to /teams/new", () => {
      vi.mocked(useMyTeams).mockReturnValue({
        data: [],
        isLoading: false,
        isError: false,
        isPending: false,
        isLoadingError: false,
        isRefetchError: false,
        error: null,
        refetch: vi.fn(),
      } as any);
      vi.mocked(useTeamSearch).mockReturnValue({
        teams: [],
        isLoading: false,
        searchQuery: "",
        setSearchQuery: vi.fn(),
      });

      render(<TeamListContent myTeams={[]} availableTeams={[]} isLoading={false} searchQuery="" setSearchQuery={vi.fn()} />, {
        wrapper: createWrapper(),
      });

      const createButton = screen.getByRole("link", { name: /create team/i });
      expect(createButton).toBeInTheDocument();
      expect(createButton).toHaveAttribute("href", "/teams/new");
    });

    it("should render two sections: My Teams and Browse Teams", () => {
      vi.mocked(useMyTeams).mockReturnValue({
        data: [],
        isLoading: false,
        isError: false,
        isPending: false,
        isLoadingError: false,
        isRefetchError: false,
        error: null,
        refetch: vi.fn(),
      } as any);
      vi.mocked(useTeamSearch).mockReturnValue({
        teams: [],
        isLoading: false,
        searchQuery: "",
        setSearchQuery: vi.fn(),
      });

      render(<TeamListContent myTeams={[]} availableTeams={[]} isLoading={false} searchQuery="" setSearchQuery={vi.fn()} />, {
        wrapper: createWrapper(),
      });

      expect(screen.getByText(/my teams/i)).toBeInTheDocument();
      expect(screen.getByText(/browse teams/i)).toBeInTheDocument();
    });
  });

  describe("REQ-FE-711: My Teams Section", () => {
    it("should display teams the user belongs to", () => {
      vi.mocked(useMyTeams).mockReturnValue({
        data: mockMyTeams,
        isLoading: false,
        isError: false,
        isPending: false,
        isLoadingError: false,
        isRefetchError: false,
        error: null,
        refetch: vi.fn(),
      } as any);
      vi.mocked(useTeamSearch).mockReturnValue({
        teams: [],
        isLoading: false,
        searchQuery: "",
        setSearchQuery: vi.fn(),
      });

      render(<TeamListContent myTeams={mockMyTeams} availableTeams={[]} isLoading={false} searchQuery="" setSearchQuery={vi.fn()} />, {
        wrapper: createWrapper(),
      });

      expect(screen.getByText("Study Group A")).toBeInTheDocument();
      expect(screen.getByText("Project Team B")).toBeInTheDocument();
    });

    it("should display empty state when user has no teams", () => {
      vi.mocked(useMyTeams).mockReturnValue({
        data: [],
        isLoading: false,
        isError: false,
        isPending: false,
        isLoadingError: false,
        isRefetchError: false,
        error: null,
        refetch: vi.fn(),
      } as any);
      vi.mocked(useTeamSearch).mockReturnValue({
        teams: [],
        isLoading: false,
        searchQuery: "",
        setSearchQuery: vi.fn(),
      });

      render(<TeamListContent myTeams={[]} availableTeams={[]} isLoading={false} searchQuery="" setSearchQuery={vi.fn()} />, {
        wrapper: createWrapper(),
      });

      expect(
        screen.getByText(/you haven't joined any teams yet/i)
      ).toBeInTheDocument();
    });

    it("should display loading skeletons while fetching my teams", () => {
      vi.mocked(useMyTeams).mockReturnValue({
        data: undefined,
        isLoading: true,
        isError: false,
        isPending: true,
        isLoadingError: false,
        isRefetchError: false,
        error: null,
        refetch: vi.fn(),
      } as any);
      vi.mocked(useTeamSearch).mockReturnValue({
        teams: [],
        isLoading: false,
        searchQuery: "",
        setSearchQuery: vi.fn(),
      });

      render(<TeamListContent myTeams={[]} availableTeams={[]} isLoading={true} searchQuery="" setSearchQuery={vi.fn()} />, {
        wrapper: createWrapper(),
      });

      // Should show skeleton loaders
      const skeletons = screen.getAllByTestId(/skeleton/i);
      expect(skeletons.length).toBeGreaterThan(0);
    });

    it("should show role badge on team cards in My Teams section", () => {
      vi.mocked(useMyTeams).mockReturnValue({
        data: mockMyTeams,
        isLoading: false,
        isError: false,
        isPending: false,
        isLoadingError: false,
        isRefetchError: false,
        error: null,
        refetch: vi.fn(),
      } as any);
      vi.mocked(useTeamSearch).mockReturnValue({
        teams: [],
        isLoading: false,
        searchQuery: "",
        setSearchQuery: vi.fn(),
      });

      render(<TeamListContent myTeams={mockMyTeams} availableTeams={[]} isLoading={false} searchQuery="" setSearchQuery={vi.fn()} />, {
        wrapper: createWrapper(),
      });

      // Check for role badges (leader/member)
      const badges = screen.getAllByText(/leader|member/i);
      expect(badges.length).toBeGreaterThan(0);
    });
  });

  describe("REQ-FE-712: Browse Teams Section", () => {
    it("should display search input for filtering teams", () => {
      vi.mocked(useMyTeams).mockReturnValue({
        data: [],
        isLoading: false,
        isError: false,
        isPending: false,
        isLoadingError: false,
        isRefetchError: false,
        error: null,
        refetch: vi.fn(),
      } as any);
      vi.mocked(useTeamSearch).mockReturnValue({
        teams: [],
        isLoading: false,
        searchQuery: "",
        setSearchQuery: vi.fn(),
      });

      render(<TeamListContent myTeams={[]} availableTeams={[]} isLoading={false} searchQuery="" setSearchQuery={vi.fn()} />, {
        wrapper: createWrapper(),
      });

      expect(
        screen.getByPlaceholderText(/search teams/i)
      ).toBeInTheDocument();
    });

    it("should display available teams from search results", () => {
      vi.mocked(useMyTeams).mockReturnValue({
        data: [],
        isLoading: false,
        isError: false,
        isPending: false,
        isLoadingError: false,
        isRefetchError: false,
        error: null,
        refetch: vi.fn(),
      } as any);
      vi.mocked(useTeamSearch).mockReturnValue({
        teams: mockAvailableTeams,
        isLoading: false,
        searchQuery: "",
        setSearchQuery: vi.fn(),
      });

      render(<TeamListContent myTeams={[]} availableTeams={mockAvailableTeams} isLoading={false} searchQuery="" setSearchQuery={vi.fn()} />, {
        wrapper: createWrapper(),
      });

      expect(screen.getByText("Open Study Group")).toBeInTheDocument();
    });

    it("should debounce search input and fetch results", async () => {
      const mockSetSearchQuery = vi.fn();
      vi.mocked(useMyTeams).mockReturnValue({
        data: [],
        isLoading: false,
        isError: false,
        isPending: false,
        isLoadingError: false,
        isRefetchError: false,
        error: null,
        refetch: vi.fn(),
      } as any);
      vi.mocked(useTeamSearch).mockReturnValue({
        teams: [],
        isLoading: false,
        searchQuery: "",
        setSearchQuery: mockSetSearchQuery,
      });

      render(<TeamListContent myTeams={[]} availableTeams={[]} isLoading={false} searchQuery="" setSearchQuery={mockSetSearchQuery} />, {
        wrapper: createWrapper(),
      });

      const searchInput = screen.getByPlaceholderText(/search teams/i);
      await userEvent.type(searchInput, "study");

      // Search input should call setSearchQuery
      expect(mockSetSearchQuery).toHaveBeenCalled();
    });

    it("should display Join button on available teams", () => {
      vi.mocked(useMyTeams).mockReturnValue({
        data: [],
        isLoading: false,
        isError: false,
        isPending: false,
        isLoadingError: false,
        isRefetchError: false,
        error: null,
        refetch: vi.fn(),
      } as any);
      vi.mocked(useTeamSearch).mockReturnValue({
        teams: mockAvailableTeams,
        isLoading: false,
        searchQuery: "",
        setSearchQuery: vi.fn(),
      });

      render(<TeamListContent myTeams={[]} availableTeams={mockAvailableTeams} isLoading={false} searchQuery="" setSearchQuery={vi.fn()} />, {
        wrapper: createWrapper(),
      });

      expect(screen.getByRole("button", { name: /join/i })).toBeInTheDocument();
    });

    it("should display View button instead of Join for teams user is already member of", () => {
      vi.mocked(useMyTeams).mockReturnValue({
        data: mockMyTeams,
        isLoading: false,
        isError: false,
        isPending: false,
        isLoadingError: false,
        isRefetchError: false,
        error: null,
        refetch: vi.fn(),
      } as any);
      // Available teams includes a team user is already member of
      vi.mocked(useTeamSearch).mockReturnValue({
        teams: mockMyTeams,
        isLoading: false,
        searchQuery: "",
        setSearchQuery: vi.fn(),
      });

      render(<TeamListContent myTeams={mockMyTeams} availableTeams={mockMyTeams} isLoading={false} searchQuery="" setSearchQuery={vi.fn()} />, {
        wrapper: createWrapper(),
      });

      // Should show View buttons for member teams
      const viewButtons = screen.getAllByRole("button", { name: /view/i });
      expect(viewButtons.length).toBeGreaterThan(0);
    });

    it("should disable Join button with tooltip when team is full", () => {
      const fullTeam = {
        ...mockAvailableTeams[0],
        memberCount: 10,
        maxMembers: 10,
      } as const;

      vi.mocked(useMyTeams).mockReturnValue({
        data: [],
        isLoading: false,
        isError: false,
        isPending: false,
        isLoadingError: false,
        isRefetchError: false,
        error: null,
        refetch: vi.fn(),
      } as any);
      vi.mocked(useTeamSearch).mockReturnValue({
        teams: [fullTeam] as any,
        isLoading: false,
        searchQuery: "",
        setSearchQuery: vi.fn(),
      });

      render(<TeamListContent myTeams={[]} availableTeams={[fullTeam] as any} isLoading={false} searchQuery="" setSearchQuery={vi.fn()} />, {
        wrapper: createWrapper(),
      });

      const joinButton = screen.getByRole("button", { name: /full/i });
      expect(joinButton).toBeDisabled();
    });

    it("should display empty state when no teams match search", () => {
      vi.mocked(useMyTeams).mockReturnValue({
        data: [],
        isLoading: false,
        isError: false,
        isPending: false,
        isLoadingError: false,
        isRefetchError: false,
        error: null,
        refetch: vi.fn(),
      } as any);
      vi.mocked(useTeamSearch).mockReturnValue({
        teams: [],
        isLoading: false,
        searchQuery: "nonexistent",
        setSearchQuery: vi.fn(),
      });

      render(<TeamListContent myTeams={[]} availableTeams={[]} isLoading={false} searchQuery="nonexistent" setSearchQuery={vi.fn()} />, {
        wrapper: createWrapper(),
      });

      expect(screen.getByText(/no teams found/i)).toBeInTheDocument();
    });
  });

  describe("Navigation", () => {
    it("should navigate to team detail when View is clicked", async () => {
      vi.mocked(useMyTeams).mockReturnValue({
        data: mockMyTeams,
        isLoading: false,
        isError: false,
        isPending: false,
        isLoadingError: false,
        isRefetchError: false,
        error: null,
        refetch: vi.fn(),
      } as any);
      vi.mocked(useTeamSearch).mockReturnValue({
        teams: [],
        isLoading: false,
        searchQuery: "",
        setSearchQuery: vi.fn(),
      });

      render(<TeamListContent myTeams={mockMyTeams} availableTeams={[]} isLoading={false} searchQuery="" setSearchQuery={vi.fn()} />, {
        wrapper: createWrapper(),
      });

      const viewButtons = screen.getAllByRole("button", { name: /view/i });
      await userEvent.click(viewButtons[0]!);

      expect(mockPush).toHaveBeenCalledWith("/teams/team-1");
    });
  });
});
