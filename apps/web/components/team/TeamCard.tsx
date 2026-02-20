/**
 * TeamCard Component
 * TASK-017: Team card display component
 * REQ-FE-713: Displays team information with member actions
 */

/* eslint-disable @typescript-eslint/restrict-template-expressions */
"use client";

import { Avatar, AvatarFallback } from "~/components/ui/avatar";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "~/components/ui/tooltip";
import type { Team } from "@shared";

interface TeamCardProps {
  team: Team;
  currentUserId: string;
  isMember?: boolean; // Whether current user is a member
  onJoin?: () => void;
  onView?: () => void;
}

/**
 * TeamCard displays team information in a card format
 * with member count, avatars, course badges, and action buttons.
 */
export function TeamCard({
  team,
  currentUserId,
  isMember = false,
  onJoin,
  onView,
}: TeamCardProps) {
  const isCreator = team.createdBy === currentUserId;
  const isTeamMember = isMember || isCreator;
  const isFull = team.memberCount >= team.maxMembers;

  // Determine role badge - only show if user is a member
  const getRoleBadge = () => {
    if (!isTeamMember) {
      return null;
    }
    if (isCreator) {
      return <Badge variant="default">leader</Badge>;
    }
    return <Badge variant="secondary">member</Badge>;
  };

  // Generate avatar fallback letters
  const getAvatarFallback = (index: number) => {
    return `U${index + 1}`;
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-start justify-between">
          <CardTitle className="text-lg font-semibold">
            {team.name}
          </CardTitle>
          {getRoleBadge()}
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Description */}
        {team.description && (
          <p className="text-sm text-muted-foreground line-clamp-2">
            {team.description}
          </p>
        )}

        {/* Member count */}
        <div className="flex items-center gap-2 text-sm">
          <span className="font-medium">Members:</span>
          <span>
            {team.memberCount} / {team.maxMembers}
          </span>
        </div>

        {/* Avatar group for first 3 members */}
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium">Members:</span>
          <div
            role="group"
            aria-label="Team members"
            className="flex -space-x-2"
          >
            {[0, 1, 2].slice(0, Math.min(3, team.memberCount)).map((index) => (
              <Avatar key={index} className="h-8 w-8 border-2 border-background">
                <AvatarFallback>{getAvatarFallback(index)}</AvatarFallback>
              </Avatar>
            ))}
          </div>
        </div>

        {/* Course badges */}
        {team.courseIds.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {team.courseIds.slice(0, 3).map((courseId) => (
              <Badge
                key={courseId}
                role="badge"
                variant="outline"
                className="text-xs"
              >
                Course
              </Badge>
            ))}
          </div>
        )}

        {/* Action buttons */}
        <div className="flex gap-2 pt-2">
          {isTeamMember ? (
            <Button onClick={onView} className="flex-1">
              View
            </Button>
          ) : (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    onClick={onJoin}
                    disabled={isFull}
                    className="flex-1"
                  >
                    Join
                  </Button>
                </TooltipTrigger>
                {isFull && (
                  <TooltipContent>
                    <p>Team is full</p>
                  </TooltipContent>
                )}
              </Tooltip>
            </TooltipProvider>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
