/**
 * QANotificationsWidget Component
 * REQ-FE-216: Q&A Notifications Widget
 */

import type { Route } from "next";
import Link from "next/link";
import { Bell, ChevronRight, CheckCheck } from "lucide-react";
import { DashboardWidget } from "../DashboardWidget";
import { EmptyState } from "../EmptyState";
import { useQANotifications } from "~/hooks/dashboard/useStudentDashboard";
import { useDashboardStore } from "~/stores/dashboard.store";
import { Button } from "~/components/ui/button";
import { cn } from "~/lib/utils";
import { formatDistanceToNow } from "~/lib/date-utils";

/**
 * Maximum number of notifications to display
 */
const MAX_DISPLAYED_NOTIFICATIONS = 5;

/**
 * QANotificationsWidget displays notifications about new answers
 * to the student's questions
 *
 * Features:
 * - Notification message
 * - Question excerpt
 * - Course name
 * - Time ago
 * - Unread notifications highlighted with blue left border
 * - "Mark all as read" button
 * - Maximum 5 notifications
 * - "View all" link
 * - Empty state
 *
 * @example
 * ```tsx
 * <QANotificationsWidget />
 * ```
 */
export function QANotificationsWidget() {
  const { data: notifications, isLoading, error, refetch } = useQANotifications();
  const markAllNotificationsRead = useDashboardStore(
    (state) => state.markAllNotificationsRead
  );

  const displayedNotifications = notifications?.slice(0, MAX_DISPLAYED_NOTIFICATIONS);
  const hasMore = (notifications?.length ?? 0) > MAX_DISPLAYED_NOTIFICATIONS;
  const hasUnread = notifications?.some((n) => !n.isRead) ?? false;

  const handleMarkAllRead = () => {
    // Update local store
    markAllNotificationsRead();
    // TODO: Also call API to mark all as read on the server
  };

  return (
    <DashboardWidget
      title="Notifications"
      subtitle="Q&A updates"
      headerAction={
        notifications && notifications.length > 0 ? (
          <div className="flex items-center gap-2">
            {hasUnread && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleMarkAllRead}
                className="h-7 text-xs"
              >
                <CheckCheck className="h-3 w-3 mr-1" />
                Mark all read
              </Button>
            )}
            <Link
              href={"/qa" as Route}
              className="text-sm text-primary hover:underline flex items-center gap-1"
            >
              View all
              <ChevronRight className="h-4 w-4" />
            </Link>
          </div>
        ) : undefined
      }
      isLoading={isLoading}
      error={error?.message ?? null}
      onRetry={() => void refetch()}
      testId="qa-notifications-widget"
    >
      {displayedNotifications && displayedNotifications.length > 0 ? (
        <div className="space-y-3">
          {displayedNotifications.map((notification) => (
            <Link
              key={notification.id}
              href={`/qa/${notification.id}` as Route}
              className={cn(
                "block group p-2 -mx-2 rounded-lg hover:bg-muted/50 transition-colors",
                !notification.isRead && "border-l-2 border-blue-500 pl-3 bg-blue-50/50 dark:bg-blue-950/20"
              )}
            >
              <div className="flex items-start gap-2">
                {!notification.isRead && (
                  <div className="h-2 w-2 rounded-full bg-blue-500 mt-2 flex-shrink-0" />
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-sm group-hover:text-primary transition-colors">
                    {notification.message}
                  </p>
                  <p className="text-xs text-muted-foreground truncate mt-0.5">
                    &quot;{notification.questionExcerpt}&quot;
                  </p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-xs text-muted-foreground">
                      {notification.courseName}
                    </span>
                    <span className="text-xs text-muted-foreground">-</span>
                    <span className="text-xs text-muted-foreground">
                      {formatDistanceToNow(new Date(notification.createdAt))}
                    </span>
                  </div>
                </div>
              </div>
            </Link>
          ))}

          {hasMore && notifications && (
            <Link
              href={"/qa" as Route}
              className="block text-sm text-center text-primary hover:underline pt-2"
            >
              View {notifications.length - MAX_DISPLAYED_NOTIFICATIONS} more
            </Link>
          )}
        </div>
      ) : (
        <EmptyState
          icon={Bell}
          title="No notifications"
          description="No new notifications."
        />
      )}
    </DashboardWidget>
  );
}
