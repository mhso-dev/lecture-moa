/**
 * QANotificationBadge Component
 * TASK-020: Badge for Q&A navigation notifications
 *
 * Displays unread Q&A notification count in navigation.
 */

"use client";

import { Badge } from "~/components/ui/badge";
import { cn } from "~/lib/utils";
import { usePendingNotifications } from "~/stores/qa.store";

interface QANotificationBadgeProps {
  className?: string;
}

/**
 * QANotificationBadge - Shows unread Q&A notification count
 *
 * Reads notification count from qa.store.pendingNotifications.
 * Hidden when there are no notifications.
 *
 * @param className - Optional additional classes
 *
 * @example
 * ```tsx
 * // In navigation
 * <NavItem href="/qa">
 *   Q&A
 *   <QANotificationBadge />
 * </NavItem>
 * ```
 */
export function QANotificationBadge({ className }: QANotificationBadgeProps) {
  const notifications = usePendingNotifications();
  const count = notifications.length;

  if (count === 0) return null;

  return (
    <Badge
      variant="destructive"
      className={cn(
        "ml-1.5 h-5 min-w-5 px-1.5 text-xs font-medium",
        "flex items-center justify-center",
        className
      )}
      aria-label={`${count}개의 읽지 않은 알림`}
    >
      {count > 99 ? "99+" : count}
    </Badge>
  );
}
