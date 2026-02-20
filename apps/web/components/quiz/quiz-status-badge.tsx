/**
 * QuizStatusBadge Component
 * REQ-FE-604: Status badge (Published, Draft, Closed) for instructors
 * REQ-FE-662: Color contrast for status badges
 */

import { Badge } from "~/components/ui/badge";
import { cn } from "~/lib/utils";
import type { QuizStatus } from "@shared";

interface QuizStatusBadgeProps {
  status: QuizStatus;
  className?: string;
  testId?: string;
}

/**
 * Status label mapping
 */
const STATUS_LABELS: Record<QuizStatus, string> = {
  draft: "Draft",
  published: "Published",
  closed: "Closed",
};

/**
 * Get badge variant based on status
 */
const getStatusVariant = (
  status: QuizStatus
): "secondary" | "success" | "destructive" => {
  switch (status) {
    case "draft":
      return "secondary";
    case "published":
      return "success";
    case "closed":
      return "destructive";
  }
};

/**
 * QuizStatusBadge - Displays quiz status with appropriate styling
 */
export function QuizStatusBadge({
  status,
  className,
  testId,
}: QuizStatusBadgeProps) {
  return (
    <Badge
      variant={getStatusVariant(status)}
      className={cn(className)}
      data-testid={testId}
      role="status"
    >
      {STATUS_LABELS[status]}
    </Badge>
  );
}
