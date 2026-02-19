/**
 * QuickActionsWidget Component
 * REQ-FE-226: Quick Actions Widget
 */

import type { Route } from "next";
import Link from "next/link";
import {
  Upload,
  FileQuestion,
  MessageCircle,
  BookOpen,
} from "lucide-react";
import { DashboardWidget } from "../DashboardWidget";

/**
 * Quick actions configuration
 */
const QUICK_ACTIONS = [
  {
    label: "Upload Material",
    href: "/materials/upload",
    icon: Upload,
    description: "Add new learning materials",
  },
  {
    label: "Create Quiz",
    href: "/quizzes/create",
    icon: FileQuestion,
    description: "Create a new quiz",
  },
  {
    label: "View All Q&A",
    href: "/qa",
    icon: MessageCircle,
    description: "Manage questions",
  },
  {
    label: "Manage Courses",
    href: "/courses",
    icon: BookOpen,
    description: "Edit your courses",
  },
] as const;

/**
 * QuickActionsWidget provides quick access to common instructor tasks.
 *
 * Features:
 * - Upload Material -> /materials/upload
 * - Create Quiz -> /quizzes/create
 * - View All Q&A -> /qa
 * - Manage Courses -> /courses
 * - Each action includes an icon and label
 * - No empty state (always rendered)
 *
 * @example
 * ```tsx
 * <QuickActionsWidget />
 * ```
 */
export function QuickActionsWidget() {
  return (
    <DashboardWidget
      title="Quick Actions"
      subtitle="Common tasks"
      testId="quick-actions-widget"
    >
      <div className="grid grid-cols-2 gap-3">
        {QUICK_ACTIONS.map((action) => {
          const Icon = action.icon;

          return (
            <Link
              key={action.href}
              href={action.href as Route}
              className="flex flex-col items-center justify-center p-4 rounded-lg border border-border hover:border-primary hover:bg-accent transition-colors group"
            >
              <Icon className="h-6 w-6 text-muted-foreground group-hover:text-primary transition-colors mb-2" />
              <span className="text-sm font-medium text-center">
                {action.label}
              </span>
            </Link>
          );
        })}
      </div>
    </DashboardWidget>
  );
}
