import type { ReactNode } from "react";
import { AppLayout } from "~/components/layout";

// Force dynamic rendering to avoid static generation issues with client-side hooks
export const dynamic = "force-dynamic";

/**
 * Dashboard Layout
 * REQ-FE-020 to REQ-FE-024: Authenticated dashboard routes
 *
 * Wraps all dashboard pages with:
 * - Sidebar navigation (desktop/tablet)
 * - Bottom tab navigation (mobile)
 * - Responsive content area
 */
interface DashboardLayoutProps {
  children: ReactNode;
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  return <AppLayout>{children}</AppLayout>;
}
