/**
 * ActivityFeedItem Component
 * TASK-029: Activity feed item display
 * REQ-FE-725: Individual activity item in feed
 */

"use client";

import { Avatar, AvatarFallback, AvatarImage } from "~/components/ui/avatar";
import type { TeamActivity, TeamActivityItemType } from "@shared";
import {
  UserPlus,
  UserMinus,
  FileText,
  Edit,
  MessageCircle,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";

interface ActivityFeedItemProps {
  activity: TeamActivity;
}

// Activity type to icon mapping
const ACTIVITY_ICONS: Record<TeamActivityItemType, React.ElementType> = {
  member_joined: UserPlus,
  member_left: UserMinus,
  memo_created: FileText,
  memo_updated: Edit,
  qa_asked: MessageCircle,
};

// Activity type to color mapping
const ACTIVITY_COLORS: Record<TeamActivityItemType, string> = {
  member_joined: "text-green-600",
  member_left: "text-orange-600",
  memo_created: "text-blue-600",
  memo_updated: "text-purple-600",
  qa_asked: "text-cyan-600",
};

/**
 * ActivityFeedItem displays a single team activity
 * with actor info, action description, and timestamp.
 */
export function ActivityFeedItem({ activity }: ActivityFeedItemProps) {
  const Icon = ACTIVITY_ICONS[activity.type] || FileText;
  const iconColor = ACTIVITY_COLORS[activity.type] || "text-muted-foreground";

  // Generate avatar fallback initials
  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  // Get actor avatar URL from payload
  const actorAvatarUrl = activity.payload?.actorAvatarUrl as string | undefined;

  // Format relative time
  const relativeTime = formatDistanceToNow(new Date(activity.createdAt), {
    addSuffix: true,
  });

  return (
    <li
      role="listitem"
      className="flex items-start gap-3 p-4 border-b last:border-b-0 hover:bg-muted/50 transition-colors"
    >
      {/* Activity type icon */}
      <div className={`mt-1 ${iconColor}`}>
        <Icon className="h-4 w-4" aria-hidden="true" />
      </div>

      {/* Actor avatar */}
      <Avatar className="h-8 w-8">
        {actorAvatarUrl && (
          <AvatarImage src={actorAvatarUrl} alt={activity.actorName} />
        )}
        <AvatarFallback>{getInitials(activity.actorName)}</AvatarFallback>
      </Avatar>

      {/* Activity content */}
      <div className="flex-1 min-w-0">
        <p className="text-sm">
          <span className="font-medium">{activity.actorName}</span>{" "}
          <span className="text-muted-foreground">
            {activity.description}
          </span>
        </p>
        <p className="text-xs text-muted-foreground mt-1">{relativeTime}</p>
      </div>
    </li>
  );
}
