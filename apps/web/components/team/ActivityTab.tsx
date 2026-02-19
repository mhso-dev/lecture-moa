/**
 * ActivityTab Component
 * TASK-030: Activity tab content
 * REQ-FE-725: Team activity feed with pagination
 */

"use client";

import { useState } from "react";
import { Button } from "~/components/ui/button";
import { Skeleton } from "~/components/ui/skeleton";
import { useTeamActivity } from "~/hooks/team/useTeam";
import { ActivityFeedItem } from "./ActivityFeedItem";
import { Activity, Loader2 } from "lucide-react";
import type { TeamActivity } from "@shared";

interface ActivityTabProps {
  teamId: string;
}

/**
 * ActivityTab displays a chronological feed of team activities
 * with pagination (20 items per page).
 */
export function ActivityTab({ teamId }: ActivityTabProps) {
  const [page, setPage] = useState(1);
  const { data, isLoading, isFetching, error } = useTeamActivity(teamId, page);
  const [allActivities, setAllActivities] = useState<TeamActivity[]>([]);

  // Accumulate activities across pages
  if (data?.data && page === 1 && allActivities.length === 0) {
    setAllActivities(data.data);
  }

  const activities = data?.data ?? allActivities;
  const pagination = data?.pagination;
  const hasMore = pagination ? page < pagination.totalPages : false;

  const handleLoadMore = () => {
    if (data?.data) {
      setAllActivities((prev) => [...prev, ...data.data]);
    }
    setPage((p) => p + 1);
  };

  if (isLoading) {
    return (
      <div data-testid="activity-loading-skeleton" className="space-y-4 p-4">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="flex items-start gap-3">
            <Skeleton className="h-8 w-8 rounded-full" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-48" />
              <Skeleton className="h-3 w-24" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center p-8 text-center">
        <Activity className="h-12 w-12 text-muted-foreground mb-4" />
        <h3 className="font-semibold text-lg">Failed to load activities</h3>
        <p className="text-muted-foreground">
          Please try refreshing the page.
        </p>
      </div>
    );
  }

  if (!activities || activities.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-8 text-center">
        <Activity className="h-12 w-12 text-muted-foreground mb-4" />
        <h3 className="font-semibold text-lg">No activity yet</h3>
        <p className="text-muted-foreground">
          Team activities will appear here as they happen.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header with activity count */}
      <div className="flex items-center justify-between p-4 border-b">
        <div className="flex items-center gap-2">
          <Activity className="h-5 w-5 text-muted-foreground" />
          <span className="font-medium">
            {pagination?.total ?? activities.length} activit
            {(pagination?.total ?? activities.length) !== 1 ? "ies" : "y"}
          </span>
        </div>
      </div>

      {/* Activity list */}
      <ul className="divide-y" role="list">
        {activities.map((activity) => (
          <ActivityFeedItem key={activity.id} activity={activity} />
        ))}
      </ul>

      {/* Load more button */}
      {hasMore && (
        <div className="flex justify-center p-4">
          <Button
            variant="outline"
            onClick={handleLoadMore}
            disabled={isFetching}
          >
            {isFetching ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Loading...
              </>
            ) : (
              "Load More"
            )}
          </Button>
        </div>
      )}
    </div>
  );
}
