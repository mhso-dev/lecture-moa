import type { ReactNode } from "react";
import { ThemeToggle } from "~/components/theme-toggle";

// Force dynamic rendering to avoid static generation issues with client components
export const dynamic = "force-dynamic";

/**
 * Auth Layout
 * REQ-FE-023: Authentication pages layout
 *
 * Features:
 * - Centered layout without sidebar/bottom-tab
 * - For login, register, password reset, etc.
 * - Theme toggle in top corner
 */
interface AuthLayoutProps {
  children: ReactNode;
}

export default function AuthLayout({ children }: AuthLayoutProps) {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      {/* Theme Toggle */}
      <div className="fixed right-4 top-4 z-50">
        <ThemeToggle />
      </div>

      {/* Centered Content */}
      <main className="flex flex-1 items-center justify-center p-4">
        <div className="w-full max-w-md">
          {/* Logo */}
          <div className="mb-8 text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-primary text-2xl font-bold text-white">
              M
            </div>
            <h1 className="text-h2 font-semibold text-foreground">
              Lecture MoA
            </h1>
          </div>

          {/* Auth Form Content */}
          {children}
        </div>
      </main>

      {/* Footer */}
      <footer className="py-4 text-center text-body-sm text-neutral-500">
        <p>2026 Lecture MoA. All rights reserved.</p>
      </footer>
    </div>
  );
}
