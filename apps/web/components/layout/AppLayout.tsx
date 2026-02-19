"use client";

import type { ReactNode } from "react";
import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { useNavigationStore } from "~/stores/navigation.store";
import { useMediaQuery } from "~/hooks/useMediaQuery";
import { Sidebar } from "./Sidebar";
import { BottomTab } from "./BottomTab";
import { ContentLayout } from "./ContentLayout";
import { QANotificationProvider } from "~/components/qa/QANotificationProvider";

/**
 * AppLayout Props
 */
interface AppLayoutProps {
  /** Page content */
  children: ReactNode;
  /** Optional page title */
  title?: string;
  /** Optional page description */
  description?: string;
  /** Optional header actions */
  actions?: ReactNode;
  /** Whether to use full width */
  fullWidth?: boolean;
  /** Whether to remove default padding */
  noPadding?: boolean;
}

/**
 * AppLayout Component (Orchestrator)
 * REQ-FE-020 to REQ-FE-024: Responsive layout orchestration
 *
 * Responsive Behavior:
 * - Mobile (<768px): BottomTab visible, Sidebar hidden
 * - Tablet (768-1279px): Sidebar collapsed (64px) by default
 * - Desktop (>=1280px): Sidebar expanded (256px) or collapsed (64px)
 *
 * Features:
 * - Automatic sidebar state based on viewport
 * - Route change tracking for navigation state
 * - Proper content margins for all breakpoints
 *
 * @example
 * ```tsx
 * // In app/(dashboard)/layout.tsx
 * export default function DashboardLayout({ children }) {
 *   return (
 *     <AppLayout>
 *       {children}
 *     </AppLayout>
 *   );
 * }
 * ```
 */
export function AppLayout({
  children,
  title,
  description,
  actions,
  fullWidth,
  noPadding,
}: AppLayoutProps) {
  const pathname = usePathname();
  const { isMobile, isTablet, isDesktop } = useMediaQuery();
  const { setSidebarCollapsed, setActiveRoute, setMobileMenuOpen } =
    useNavigationStore();

  // Set initial sidebar state based on viewport
  useEffect(() => {
    if (isTablet) {
      // Tablet: sidebar collapsed by default
      setSidebarCollapsed(true);
    } else if (isDesktop) {
      // Desktop: sidebar expanded by default (or use persisted state)
      // setSidebarCollapsed(false);
    }
  }, [isTablet, isDesktop, setSidebarCollapsed]);

  // Track route changes
  useEffect(() => {
    setActiveRoute(pathname);
    // Close mobile menu on route change
    setMobileMenuOpen(false);
  }, [pathname, setActiveRoute, setMobileMenuOpen]);

  return (
    <div className="min-h-screen bg-background">
      {/* Q&A Notification Provider - Handles WebSocket notifications */}
      <QANotificationProvider>
        {/* Sidebar - Hidden on mobile */}
        {!isMobile && <Sidebar />}

        {/* Bottom Tab - Visible on mobile only */}
        {isMobile && <BottomTab />}

        {/* Main Content */}
        <ContentLayout
          title={title}
          description={description}
          actions={actions}
          fullWidth={fullWidth}
          noPadding={noPadding}
        >
          {children}
        </ContentLayout>
      </QANotificationProvider>
    </div>
  );
}

/**
 * Hook to access layout state
 * Useful for components that need to react to layout changes
 */
export function useLayoutState() {
  const { isMobile, isTablet, isDesktop } = useMediaQuery();
  const { isSidebarCollapsed, isMobileMenuOpen } = useNavigationStore();

  return {
    isMobile,
    isTablet,
    isDesktop,
    isSidebarCollapsed,
    isMobileMenuOpen,
    // Computed states
    showBottomTab: isMobile,
    showSidebar: !isMobile,
    sidebarWidth: isMobile
      ? 0
      : isSidebarCollapsed
        ? 64
        : 256,
  };
}
