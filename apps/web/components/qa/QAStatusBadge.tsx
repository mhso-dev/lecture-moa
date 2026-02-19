/**
 * QAStatusBadge Component
 * TASK-017: Status badge for Q&A questions
 *
 * Displays question status with color-coded styling.
 */

import { Badge } from "~/components/ui/badge";
import { cn } from "~/lib/utils";
import type { QAStatus } from "@shared";

interface QAStatusBadgeProps {
  status: QAStatus;
  className?: string;
}

const statusConfig: Record<QAStatus, { label: string; variant: "info" | "success" | "secondary" }> = {
  OPEN: { label: "진행 중", variant: "info" },
  RESOLVED: { label: "해결됨", variant: "success" },
  CLOSED: { label: "종료", variant: "secondary" },
};

/**
 * QAStatusBadge - Displays Q&A question status
 *
 * @param status - Question status (OPEN, RESOLVED, CLOSED)
 * @param className - Optional additional classes
 *
 * @example
 * ```tsx
 * <QAStatusBadge status="OPEN" />
 * <QAStatusBadge status="RESOLVED" />
 * <QAStatusBadge status="CLOSED" />
 * ```
 */
export function QAStatusBadge({ status, className }: QAStatusBadgeProps) {
  const config = statusConfig[status];

  return (
    <Badge
      variant={config.variant}
      className={cn(className)}
      aria-label={`상태: ${config.label}`}
    >
      {config.label}
    </Badge>
  );
}
