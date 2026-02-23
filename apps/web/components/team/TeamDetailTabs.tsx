/**
 * TeamDetailTabs Component
 * TASK-024: Tab navigation for team detail page
 * REQ-FE-726: URL hash synchronization and tab navigation
 */

"use client";

import { useEffect, useCallback } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "~/components/ui/tabs";
import { useTeamStore, useTeamActiveTab, type TeamDetailTab } from "~/stores/team.store";

// Hash to tab mapping
const HASH_TO_TAB: Record<string, TeamDetailTab> = {
  "#members": "members",
  "#materials": "materials",
  "#memos": "memos",
  "#activity": "activity",
};

const TAB_TO_HASH: Record<TeamDetailTab, string> = {
  members: "#members",
  materials: "#materials",
  memos: "#memos",
  activity: "#activity",
};

interface TeamDetailTabsProps {
  teamId: string;
}

/**
 * TeamDetailTabs provides tab navigation for team detail page
 * with URL hash synchronization and Zustand state management.
 *
 * Tabs: Members | Shared Materials | Team Memos | Activity
 * Default: Members
 */
export function TeamDetailTabs({ teamId: _teamId }: TeamDetailTabsProps) {
  const activeTab = useTeamActiveTab();
  const setActiveTab = useTeamStore((state) => state.setActiveTab);

  // Sync with URL hash on mount
  useEffect(() => {
    const hash = window.location.hash;
    const tabFromHash = HASH_TO_TAB[hash];
    if (tabFromHash) {
      setActiveTab(tabFromHash);
    }
  }, [setActiveTab]);

  // Handle hash change events
  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash;
      const tabFromHash = HASH_TO_TAB[hash];
      if (tabFromHash) {
        setActiveTab(tabFromHash);
      }
    };

    window.addEventListener("hashchange", handleHashChange);
    return () => { window.removeEventListener("hashchange", handleHashChange); };
  }, [setActiveTab]);

  const handleTabChange = useCallback(
    (value: string) => {
      const tab = value as TeamDetailTab;
      setActiveTab(tab);
      window.location.hash = TAB_TO_HASH[tab];
    },
    [setActiveTab]
  );

  return (
    <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
      <TabsList className="grid w-full grid-cols-4">
        <TabsTrigger
          value="members"
          data-value="members"
          aria-label="멤버"
        >
          멤버
        </TabsTrigger>
        <TabsTrigger
          value="materials"
          data-value="materials"
          aria-label="공유 자료"
        >
          공유 자료
        </TabsTrigger>
        <TabsTrigger
          value="memos"
          data-value="memos"
          aria-label="팀 메모"
        >
          팀 메모
        </TabsTrigger>
        <TabsTrigger
          value="activity"
          data-value="activity"
          aria-label="활동"
        >
          활동
        </TabsTrigger>
      </TabsList>

      <TabsContent value="members" aria-label="멤버">
        <div className="p-4">멤버 콘텐츠 영역</div>
      </TabsContent>

      <TabsContent value="materials" aria-label="공유 자료">
        <div className="p-4">공유 자료 콘텐츠 영역</div>
      </TabsContent>

      <TabsContent value="memos" aria-label="팀 메모">
        <div className="p-4">팀 메모 콘텐츠 영역</div>
      </TabsContent>

      <TabsContent value="activity" aria-label="활동">
        <div className="p-4">활동 콘텐츠 영역</div>
      </TabsContent>
    </Tabs>
  );
}
