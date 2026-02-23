/**
 * Team Detail Content (Client Component)
 * Client-side wrapper for TeamDetailTabs with tab content
 */

"use client";

import { useTeamStore } from "~/stores/team.store";
import { TeamDetailTabs } from "~/components/team/TeamDetailTabs";
import { MembersTab } from "~/components/team/MembersTab";
import { SharedMaterialsTab } from "~/components/team/SharedMaterialsTab";
import { ActivityTab } from "~/components/team/ActivityTab";
import { useAuthStore } from "~/stores/auth.store";
import { useTeamMembers } from "~/hooks/team/useTeam";

interface TeamDetailContentProps {
  teamId: string;
}

/**
 * TeamDetailContent renders the tabbed interface for team details.
 * Uses Zustand store for active tab state.
 */
export function TeamDetailContent({ teamId }: TeamDetailContentProps) {
  const activeTab = useTeamStore((state) => state.activeTab);
  const user = useAuthStore((state) => state.user);
  const { data: members } = useTeamMembers(teamId);

  // Determine if current user is a leader (for future use)
  const _isCurrentUserLeader = members?.some(
    (m) => m.userId === user?.id && m.role === "leader"
  );
  void _isCurrentUserLeader; // Suppress unused variable warning

  return (
    <div className="space-y-6">
      {/* Tab navigation */}
      <TeamDetailTabs teamId={teamId} />

      {/* Tab content */}
      <div className="mt-6">
        {activeTab === "members" && (
          <MembersTab
            teamId={teamId}
            currentUserId={user?.id}
          />
        )}

        {activeTab === "materials" && (
          <SharedMaterialsTab
            teamId={teamId}
            currentUserId={user?.id}
          />
        )}

        {activeTab === "memos" && (
          <div className="p-4 border rounded-lg">
            <p className="text-muted-foreground">
              팀 메모 탭 콘텐츠 - 추후 구현 예정입니다.
            </p>
          </div>
        )}

        {activeTab === "activity" && (
          <ActivityTab teamId={teamId} />
        )}
      </div>
    </div>
  );
}
