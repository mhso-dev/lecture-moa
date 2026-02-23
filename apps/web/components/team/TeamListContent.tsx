/**
 * TeamListContent Component
 * TASK-019: Client component for team list page
 * REQ-FE-710, REQ-FE-711, REQ-FE-712: Team list with My Teams and Browse sections
 */

"use client";

import { Skeleton } from "~/components/ui/skeleton";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Card, CardContent, CardHeader } from "~/components/ui/card";
import { TeamCard } from "./TeamCard";
import { useJoinTeam } from "~/hooks/team/useTeamMembership";
import { useAuthStore } from "~/stores/auth.store";
import { useRouter } from "next/navigation";
import type { Team } from "@shared";

interface TeamListContentProps {
  myTeams: Team[];
  availableTeams: Team[];
  isLoading: boolean;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
}

/**
 * TeamListContent displays the team list page with two sections:
 * - My Teams: Teams the user belongs to
 * - Browse Teams: Available teams to join with search
 */
export function TeamListContent({
  myTeams,
  availableTeams,
  isLoading,
  searchQuery,
  setSearchQuery,
}: TeamListContentProps) {
  const router = useRouter();
  const { mutate: joinTeam } = useJoinTeam();

  // Get current user ID from auth store
  const currentUserId = useAuthStore((state) => state.user?.id) ?? "";

  const handleJoinTeam = (teamId: string) => {
    joinTeam(teamId);
  };

  const handleViewTeam = (teamId: string) => {
    router.push(`/teams/${teamId}`);
  };

  // Create a set of user's team IDs for quick lookup
  const myTeamIds = new Set(myTeams.map((team) => team.id));

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">팀</h1>
          <p className="text-muted-foreground">
            팀을 관리하고 새로운 스터디 그룹을 찾아보세요
          </p>
        </div>
        <Button asChild>
          <a href="/teams/new">팀 만들기</a>
        </Button>
      </div>

      {/* My Teams Section */}
      <section aria-label="내 팀">
        <h2 className="text-xl font-semibold mb-4">내 팀</h2>
        {isLoading ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3].map((i) => (
              <div key={i} data-testid="skeleton-loader">
                <Card>
                  <CardHeader>
                    <Skeleton className="h-6 w-3/4" />
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-2/3" />
                    <Skeleton className="h-10 w-full" />
                  </CardContent>
                </Card>
              </div>
            ))}
          </div>
        ) : myTeams.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12 text-center">
              <p className="text-muted-foreground mb-4">
                아직 가입한 팀이 없습니다. 아래에서 참여 가능한 팀을 찾아보세요.
              </p>
              <Button variant="outline" asChild>
                <a href="#browse">팀 찾아보기</a>
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {myTeams.map((team) => (
              <TeamCard
                key={team.id}
                team={team}
                currentUserId={currentUserId}
                isMember={true}
                onView={() => { handleViewTeam(team.id); }}
              />
            ))}
          </div>
        )}
      </section>

      {/* Browse Teams Section */}
      <section id="browse" aria-label="팀 찾아보기">
        <h2 className="text-xl font-semibold mb-4">팀 찾아보기</h2>

        {/* Search Input */}
        <div className="mb-4">
          <Input
            type="search"
            placeholder="팀 검색..."
            value={searchQuery}
            onChange={(e) => { setSearchQuery(e.target.value); }}
            aria-label="팀 검색"
            className="max-w-md"
          />
        </div>

        {isLoading ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3].map((i) => (
              <div key={i} data-testid="skeleton-loader">
                <Card>
                  <CardHeader>
                    <Skeleton className="h-6 w-3/4" />
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-2/3" />
                    <Skeleton className="h-10 w-full" />
                  </CardContent>
                </Card>
              </div>
            ))}
          </div>
        ) : availableTeams.length === 0 && searchQuery ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12 text-center">
              <p className="text-muted-foreground mb-4">
                검색 결과에 맞는 팀이 없습니다.
              </p>
              <Button variant="outline" onClick={() => { setSearchQuery(""); }}>
                검색 초기화
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {availableTeams.map((team) => {
              const isMember = myTeamIds.has(team.id);

              return (
                <TeamCard
                  key={team.id}
                  team={team}
                  currentUserId={currentUserId}
                  isMember={isMember}
                  onJoin={() => { handleJoinTeam(team.id); }}
                  onView={() => { handleViewTeam(team.id); }}
                />
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
