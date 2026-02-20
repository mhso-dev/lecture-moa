import { create } from "zustand";
import { devtools } from "zustand/middleware";

/**
 * Team detail tab types
 * REQ-FE-780: Tab navigation for team detail page
 */
export type TeamDetailTab = "members" | "materials" | "memos" | "activity";

interface TeamState {
  currentTeamId: string | null;
  activeTab: TeamDetailTab;
}

interface TeamActions {
  setCurrentTeam: (teamId: string | null) => void;
  setActiveTab: (tab: TeamDetailTab) => void;
}

type TeamStore = TeamState & TeamActions;

const initialState: TeamState = {
  currentTeamId: null,
  activeTab: "members",
};

/**
 * Team Store - Manages team-related client state
 * REQ-FE-780: Team Zustand Store
 *
 * State:
 * - currentTeamId: Currently selected team ID for detail view
 * - activeTab: Active tab in team detail page
 *
 * Actions:
 * - setCurrentTeam: Set or clear current team ID
 * - setActiveTab: Change active tab in team detail view
 *
 * Tab Values:
 * - 'members': Team member list and management
 * - 'materials': Shared materials within team
 * - 'memos': Team memo board
 * - 'activity': Team activity feed
 */
export const useTeamStore = create<TeamStore>()(
  devtools(
    (set) => ({
      ...initialState,

      setCurrentTeam: (teamId) =>
        set({ currentTeamId: teamId }, false, "team/setCurrentTeam"),

      setActiveTab: (tab) =>
        set({ activeTab: tab }, false, "team/setActiveTab"),
    }),
    {
      name: "TeamStore",
      enabled: process.env.NODE_ENV === "development",
    }
  )
);

// Selector hooks for common patterns
export const useCurrentTeamId = () => useTeamStore((state) => state.currentTeamId);
export const useTeamActiveTab = () => useTeamStore((state) => state.activeTab);
