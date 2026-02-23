"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  BookOpen,
  StickyNote,
  User,
  MoreHorizontal,
} from "lucide-react";
import { cn } from "@shared/utils";

/**
 * Navigation item for bottom tab
 */
interface TabItem {
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  href: string;
  badge?: number | string;
}

/**
 * Bottom tab navigation items (5 items max for mobile)
 * REQ-FE-024: Mobile bottom tab with 5 core items
 */
const TAB_ITEMS: TabItem[] = [
  { label: "대시보드", icon: LayoutDashboard, href: "/" },
  { label: "강의", icon: BookOpen, href: "/courses" },
  { label: "메모", icon: StickyNote, href: "/memos" },
  {
    label: "더보기",
    icon: MoreHorizontal,
    href: "/more",
    // Note: "More" would typically open a sheet/menu with Q&A, Quizzes, Teams
  },
  { label: "프로필", icon: User, href: "/profile" },
];

/**
 * BottomTab Component
 * REQ-FE-024: Mobile bottom navigation
 *
 * Behavior:
 * - Mobile (<768px): Fixed bottom 64px height
 * - 5 tabs: Dashboard, Courses, Memos, More, Profile
 * - Badge support for notifications
 * - Active tab highlighting
 *
 * @example
 * ```tsx
 * <BottomTab />
 * ```
 */
export function BottomTab() {
  const pathname = usePathname();

  // Check if tab is active
  const isActive = (href: string) => {
    if (href === "/") {
      return pathname === "/";
    }
    if (href === "/more") {
      // More tab is active for secondary routes
      return ["/qa", "/quizzes", "/teams"].some((route) =>
        pathname.startsWith(route)
      );
    }
    return pathname.startsWith(href);
  };

  return (
    <nav
      className={cn(
        "fixed bottom-0 left-0 right-0 z-fixed",
        "h-bottom-tab safe-area-inset-bottom",
        "bg-background border-t border-border",
        "md:hidden" // Hidden on tablet and desktop
      )}
      aria-label="모바일 내비게이션"
    >
      <ul className="flex h-full items-center justify-around">
        {TAB_ITEMS.map((item) => {
          const active = isActive(item.href);
          const Icon = item.icon;

          return (
            <li key={item.href} className="flex-1">
              <Link
                href={item.href as never}
                className={cn(
                  "relative flex h-full flex-col items-center justify-center gap-1",
                  "transition-colors duration-fast",
                  active
                    ? "text-primary"
                    : "text-neutral-500 dark:text-neutral-400",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
                )}
                aria-current={active ? "page" : undefined}
              >
                {/* Icon with badge */}
                <div className="relative">
                  <Icon className="h-5 w-5" />

                  {/* Badge indicator */}
                  {item.badge && (
                    <span
                      className={cn(
                        "absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center",
                        "rounded-full bg-error px-1 text-[10px] font-bold text-white"
                      )}
                    >
                      {typeof item.badge === "number" && item.badge > 99
                        ? "99+"
                        : item.badge}
                    </span>
                  )}
                </div>

                {/* Label */}
                <span className="text-xs font-medium">{item.label}</span>

                {/* Active indicator dot */}
                {active && (
                  <span
                    className="absolute bottom-1 h-1 w-4 rounded-full bg-primary"
                    aria-hidden="true"
                  />
                )}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

/**
 * Props for individual tab item component
 */
interface TabItemProps {
  item: TabItem;
  isActive: boolean;
}

/**
 * Individual Tab Item (for customization if needed)
 */
export function TabItem({ item, isActive }: TabItemProps) {
  const Icon = item.icon;

  return (
    <Link
      href={item.href as never}
      className={cn(
        "relative flex h-full flex-col items-center justify-center gap-1",
        "transition-colors duration-fast",
        isActive ? "text-primary" : "text-neutral-500 dark:text-neutral-400"
      )}
      aria-current={isActive ? "page" : undefined}
    >
      <Icon className="h-5 w-5" />
      <span className="text-xs font-medium">{item.label}</span>
    </Link>
  );
}
