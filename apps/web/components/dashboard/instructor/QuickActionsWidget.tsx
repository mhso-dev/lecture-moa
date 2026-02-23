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
    label: "자료 업로드",
    href: "/materials/upload",
    icon: Upload,
    description: "새 학습 자료 추가",
  },
  {
    label: "퀴즈 만들기",
    href: "/quizzes/create",
    icon: FileQuestion,
    description: "새 퀴즈 생성",
  },
  {
    label: "Q&A 전체 보기",
    href: "/qa",
    icon: MessageCircle,
    description: "질문 관리",
  },
  {
    label: "강의 관리",
    href: "/courses",
    icon: BookOpen,
    description: "강의 편집",
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
      title="빠른 실행"
      subtitle="자주 사용하는 기능"
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
