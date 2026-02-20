/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * Team Detail Layout
 * TASK-022: Team detail layout with header
 * REQ-FE-720, REQ-FE-721: Team header with actions
 */

"use client";

import { useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { Avatar, AvatarFallback } from "~/components/ui/avatar";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import { Card, CardContent, CardHeader } from "~/components/ui/card";
import { Skeleton } from "~/components/ui/skeleton";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "~/components/ui/alert-dialog";
import { useTeamDetail } from "~/hooks/team/useTeam";
import { useTeamMembership } from "~/hooks/team/useTeamMembership";
import { useTeamStore } from "~/stores/team.store";
import { useAuthStore } from "~/stores/auth.store";
import { toast } from "sonner";
import {
  Settings,
  LogOut,
  UserPlus,
  Users,
  BookOpen,
} from "lucide-react";

/**
 * TeamDetailLayout wraps the team detail page with
 * a header displaying team info and membership actions.
 */
export default function TeamDetailLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const params = useParams();
  const router = useRouter();
  const teamId = params.teamId as string;

  const { data: teamDetail, isLoading, error } = useTeamDetail(teamId);
  const { leaveTeam } = useTeamMembership(teamId);
  const { setCurrentTeam } = useTeamStore();
  const user = useAuthStore((state) => state.user);

  // Set current team in store
  useEffect(() => {
    setCurrentTeam(teamId);
    return () => { setCurrentTeam(null); };
  }, [teamId, setCurrentTeam]);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  if (error || !teamDetail) {
    return (
      <div className="flex flex-col items-center justify-center p-8 text-center">
        <h2 className="text-xl font-semibold">Team not found</h2>
        <p className="text-muted-foreground mt-2">
          This team may have been deleted or you don&apos;t have access.
        </p>
        <Button
          variant="outline"
          className="mt-4"
          onClick={() => { router.push("/teams"); }}
        >
          Back to Teams
        </Button>
      </div>
    );
  }

  const { team, members } = teamDetail;
  const currentMember = members.find((m) => m.userId === user?.id);
  const isMember = !!currentMember;
  const isLeader = currentMember?.role === "leader";
  const isFull = team.memberCount >= team.maxMembers;

  const handleLeaveTeam = () => {
    leaveTeam.mutate(undefined, {
      onSuccess: () => {
        toast.success("You have left the team");
        router.push("/teams");
      },
      onError: () => {
        toast.error("Failed to leave team");
      },
    });
  };

  // Generate avatar fallback letters
  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <div className="space-y-6">
      {/* Team Header Card */}
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-4">
              {/* Team avatar */}
              <Avatar className="h-16 w-16">
                <AvatarFallback className="text-xl">
                  {getInitials(team.name)}
                </AvatarFallback>
              </Avatar>

              {/* Team info */}
              <div>
                <h1 className="text-2xl font-bold">{team.name}</h1>
                {team.description && (
                  <p className="text-muted-foreground mt-1">
                    {team.description}
                  </p>
                )}
                <div className="flex items-center gap-2 mt-2">
                  {/* Member count chip */}
                  <Badge variant="secondary" className="flex items-center gap-1">
                    <Users className="h-3 w-3" />
                    {team.memberCount} / {team.maxMembers} members
                  </Badge>
                </div>
              </div>
            </div>

            {/* Action buttons */}
            <div className="flex items-center gap-2">
              {isLeader && (
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => { router.push(`/teams/${teamId}/settings` as any); }}
                  aria-label="Team settings"
                >
                  <Settings className="h-4 w-4" />
                </Button>
              )}

              {isMember && !isLeader && (
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="outline">
                      <LogOut className="h-4 w-4 mr-2" />
                      Leave Team
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Leave Team?</AlertDialogTitle>
                      <AlertDialogDescription>
                        Are you sure you want to leave {team.name}? You will
                        need to be invited again to rejoin.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={handleLeaveTeam}
                        disabled={leaveTeam.isPending}
                      >
                        {leaveTeam.isPending ? "Leaving..." : "Leave"}
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              )}

              {!isMember && (
                <Button disabled={isFull}>
                  {isFull ? (
                    "Team Full"
                  ) : (
                    <>
                      <UserPlus className="h-4 w-4 mr-2" />
                      Join Team
                    </>
                  )}
                </Button>
              )}
            </div>
          </div>
        </CardHeader>

        {/* Course associations */}
        {team.courseIds.length > 0 && (
          <CardContent className="border-t pt-4">
            <div className="flex items-center gap-2 flex-wrap">
              <BookOpen className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Associated with:</span>
              {team.courseIds.map((courseId) => (
                <Badge key={courseId} variant="outline">
                  Course
                </Badge>
              ))}
            </div>
          </CardContent>
        )}
      </Card>

      {/* Page content */}
      {children}
    </div>
  );
}
