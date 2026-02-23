"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  BookOpen,
  MessageCircleQuestion,
  ClipboardCheck,
  Users,
  StickyNote,
  User,
  ChevronLeft,
  ChevronRight,
  LogOut,
} from "lucide-react";
import { cn } from "@shared/utils";
import { useNavigationStore, useSidebarCollapsed } from "~/stores/navigation.store";
import { useAuth } from "~/hooks/useAuth";
import { ThemeToggle } from "~/components/theme-toggle";

/**
 * Navigation item configuration
 */
interface NavItem {
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  href: string;
  badge?: number | string;
}

/**
 * Navigation items matching the design spec
 */
const NAV_ITEMS: NavItem[] = [
  { label: "대시보드", icon: LayoutDashboard, href: "/" },
  { label: "강의", icon: BookOpen, href: "/courses" },
  { label: "Q&A", icon: MessageCircleQuestion, href: "/qa" },
  { label: "퀴즈", icon: ClipboardCheck, href: "/quizzes" },
  { label: "팀", icon: Users, href: "/teams" },
  { label: "메모", icon: StickyNote, href: "/memos" },
  { label: "프로필", icon: User, href: "/profile" },
];

/**
 * Sidebar Component
 * REQ-FE-020, REQ-FE-021: Desktop/Tablet sidebar navigation
 *
 * Behavior:
 * - Desktop (>=1280px): Fixed 256px width, collapsible to 64px
 * - Tablet (768-1279px): Default collapsed (64px), overlay on expand
 * - Mobile (<768px): Hidden (use BottomTab instead)
 *
 * @example
 * ```tsx
 * <Sidebar />
 * ```
 */
export function Sidebar() {
  const pathname = usePathname();
  const isCollapsed = useSidebarCollapsed();
  const { toggleSidebar } = useNavigationStore();
  const { signOut } = useAuth();

  // Check if nav item is active
  const isActive = (href: string) => {
    if (href === "/") {
      return pathname === "/";
    }
    return pathname.startsWith(href);
  };

  return (
    <aside
      className={cn(
        "fixed left-0 top-0 z-sticky h-screen flex flex-col",
        "bg-sidebar-background border-r border-sidebar-border",
        "transition-all duration-normal ease-out",
        // Width based on collapsed state
        isCollapsed ? "w-sidebar-collapsed" : "w-sidebar"
      )}
      aria-label="메인 내비게이션"
    >
      {/* Header with Logo and Theme Toggle */}
      <div className="flex h-header shrink-0 items-center justify-between border-b border-sidebar-border px-4">
        {/* Logo */}
        <Link
          href="/"
          className={cn(
            "flex items-center gap-2 font-semibold text-foreground",
            "transition-opacity duration-fast",
            isCollapsed && "opacity-0"
          )}
        >
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-white">
            M
          </div>
          <span className="text-lg font-semibold">Lecture MoA</span>
        </Link>

        {/* Theme Toggle - always visible */}
        <div className={cn("shrink-0", !isCollapsed && "ml-auto mr-2")}>
          <ThemeToggle />
        </div>
      </div>

      {/* Navigation Items */}
      <nav className="flex-1 overflow-y-auto overflow-x-hidden py-4 scrollbar-hide">
        <ul className="flex flex-col gap-1 px-2">
          {NAV_ITEMS.map((item) => {
            const active = isActive(item.href);
            const Icon = item.icon;

            return (
              <li key={item.href}>
                <Link
                  href={item.href as never}
                  className={cn(
                    "flex items-center gap-3 rounded-lg px-3 py-2.5",
                    "text-sidebar-foreground transition-all duration-fast",
                    "hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary",
                    // Active state
                    active && [
                      "bg-sidebar-accent text-sidebar-accent-foreground font-medium",
                    ],
                    // Collapsed state - center icons
                    isCollapsed && "justify-center px-0"
                  )}
                  title={isCollapsed ? item.label : undefined}
                >
                  <Icon className="h-5 w-5 shrink-0" />

                  {/* Label - hidden when collapsed */}
                  <span
                    className={cn(
                      "transition-opacity duration-fast",
                      isCollapsed ? "opacity-0 w-0 overflow-hidden" : "opacity-100"
                    )}
                  >
                    {item.label}
                  </span>

                  {/* Badge - hidden when collapsed */}
                  {item.badge && !isCollapsed && (
                    <span
                      className={cn(
                        "ml-auto flex h-5 min-w-5 items-center justify-center",
                        "rounded-full bg-primary px-1.5 text-xs font-medium text-white"
                      )}
                    >
                      {item.badge}
                    </span>
                  )}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Logout Button */}
      <div className="shrink-0 px-2">
        <button
          onClick={() => { void signOut(); }}
          className={cn(
            "flex w-full items-center gap-2 rounded-lg px-3 py-2",
            "text-sidebar-foreground transition-colors duration-fast",
            "hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary",
            isCollapsed && "justify-center px-0"
          )}
          aria-label="로그아웃"
          title={isCollapsed ? "로그아웃" : undefined}
        >
          <LogOut className="h-5 w-5 shrink-0" />
          <span
            className={cn(
              "text-sm transition-opacity duration-fast",
              isCollapsed ? "opacity-0 w-0 overflow-hidden" : "opacity-100"
            )}
          >
            로그아웃
          </span>
        </button>
      </div>

      {/* Collapse Toggle Button - Desktop only */}
      <div className="shrink-0 border-t border-sidebar-border p-2">
        <button
          onClick={() => {
            toggleSidebar();
          }}
          className={cn(
            "flex w-full items-center justify-center gap-2 rounded-lg px-3 py-2",
            "text-sidebar-foreground transition-colors duration-fast",
            "hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
          )}
          aria-label={isCollapsed ? "사이드바 펼치기" : "사이드바 접기"}
        >
          {isCollapsed ? (
            <ChevronRight className="h-5 w-5" />
          ) : (
            <>
              <ChevronLeft className="h-5 w-5" />
              <span className="text-sm">접기</span>
            </>
          )}
        </button>
      </div>
    </aside>
  );
}

/**
 * Mobile Sidebar Overlay
 * Used for tablet expanded state and potential mobile overlay
 */
export function SidebarOverlay() {
  const isCollapsed = useSidebarCollapsed();
  const { setSidebarCollapsed } = useNavigationStore();

  if (isCollapsed) return null;

  return (
    <div
      className="fixed inset-0 z-sticky bg-black/50 md:hidden"
      onClick={() => {
        setSidebarCollapsed(true);
      }}
      aria-hidden="true"
    />
  );
}
