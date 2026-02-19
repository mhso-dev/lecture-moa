"use client";

/**
 * TeamMembersWidget Component
 * REQ-FE-232: Team Members Widget
 */

import Link from "next/link";
import { ChevronRight, Crown } from "lucide-react";
import { DashboardWidget } from "../DashboardWidget";
import { useTeamMembers, useTeamOverview } from "~/hooks/dashboard/useTeamDashboard";
import { Avatar, AvatarFallback, AvatarImage } from "~/components/ui/avatar";
import { cn } from "~/lib/utils";

/**
 * Maximum number of members to display in the widget
 */
const MAX_DISPLAYED_MEMBERS = 10;

/**
 * Get member count display string
 */
function getMemberCountDisplay(count: number): string {
  return String(count) + " members";
}

/**
 * Time threshold for "active" status (24 hours in milliseconds)
 */
const ACTIVE_THRESHOLD_MS = 24 * 60 * 60 * 1000;

/**
 * Check if a member is active (active in last 24 hours)
 */
function isMemberActive(lastActiveAt: Date): boolean {
  const lastActive = new Date(lastActiveAt);
  const now = new Date();
  return now.getTime() - lastActive.getTime() < ACTIVE_THRESHOLD_MS;
}

/**
 * Get initials from name
 */
function getInitials(name: string): string {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

/**
 * TeamMembersWidget displays team member list with activity status.
 *
 * Features:
 * - Member list with avatars, names, role badges (leader)
 * - Active indicator (green dot) for last 24h activity
 * - Max 10 members displayed, "View all" link
 * - Empty state only when team has no members (edge case)
 *
 * @example
 * ```tsx
 * <TeamMembersWidget />
 * ```
 */
export function TeamMembersWidget() {
  const { data: overview } = useTeamOverview();
  const { data: members, isLoading, error, refetch } = useTeamMembers();

  // Don't render if no team
  if (!overview && !isLoading) {
    return null;
  }

  // Limit to MAX_DISPLAYED_MEMBERS
  const displayedMembers = members?.slice(0, MAX_DISPLAYED_MEMBERS);
  const hasMore = (members?.length ?? 0) > MAX_DISPLAYED_MEMBERS;

  return (
    <DashboardWidget
      title="Team Members"
      subtitle={overview ? getMemberCountDisplay(overview.memberCount) : undefined}
      headerAction={
        members && members.length > 0 ? (
          <Link
            href={`/teams/${overview?.id ?? ""}/members`}
            className="text-sm text-primary hover:underline flex items-center gap-1"
          >
            View all
            <ChevronRight className="h-4 w-4" />
          </Link>
        ) : undefined
      }
      isLoading={isLoading}
      error={error?.message ?? null}
      onRetry={() => void refetch()}
      testId="team-members-widget"
    >
      {displayedMembers && displayedMembers.length > 0 ? (
        <div className="space-y-3">
          {displayedMembers.map((member) => {
            const isActive = isMemberActive(member.lastActiveAt);

            return (
              <div
                key={member.id}
                className="flex items-center gap-3"
              >
                <div className="relative">
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={member.avatarUrl} alt={member.name} />
                    <AvatarFallback className="text-xs">
                      {getInitials(member.name)}
                    </AvatarFallback>
                  </Avatar>
                  {/* Active indicator */}
                  {isActive && (
                    <span
                      className={cn(
                        "absolute bottom-0 right-0 h-3 w-3 rounded-full",
                        "bg-green-500 ring-2 ring-background"
                      )}
                      aria-label="Active now"
                    />
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium truncate">
                      {member.name}
                    </span>
                    {member.role === "leader" && (
                      <span className="inline-flex items-center gap-1 text-xs text-amber-600 dark:text-amber-500">
                        <Crown className="h-3 w-3" />
                        Leader
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}

          {hasMore && members && (
            <Link
              href={`/teams/${overview?.id ?? ""}/members`}
              className="block text-sm text-center text-primary hover:underline pt-2"
            >
              View {members.length - MAX_DISPLAYED_MEMBERS} more members
            </Link>
          )}
        </div>
      ) : (
        <div className="text-center py-4 text-muted-foreground text-sm">
          No members in this team
        </div>
      )}
    </DashboardWidget>
  );
}
