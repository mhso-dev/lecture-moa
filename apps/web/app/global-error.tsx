"use client";

import { useEffect } from "react";
import { AlertTriangle, RefreshCw } from "lucide-react";
import { Button } from "~/components/ui/button";

interface GlobalErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

/**
 * Global Error Boundary Component
 *
 * Catches errors in the root layout and displays a full-page error UI.
 * This is the outermost error boundary that catches errors that bubble up
 * from the entire application.
 *
 * Note: This component must define its own html and body tags because
 * it replaces the root layout when an error occurs.
 */
export default function GlobalError({ error, reset }: GlobalErrorProps) {
  useEffect(() => {
    // Log error to error reporting service
    console.error("Global error:", error);
  }, [error]);

  return (
    <html lang="ko">
      <body className="min-h-screen bg-background font-sans antialiased">
        <div className="flex min-h-screen flex-col items-center justify-center px-4 text-center">
          <div className="mb-8 rounded-full bg-destructive/10 p-6">
            <AlertTriangle className="h-16 w-16 text-destructive" />
          </div>

          <h1 className="mb-3 text-3xl font-bold tracking-tight">
            Critical Error
          </h1>

          <p className="mb-2 max-w-md text-lg text-muted-foreground">
            A critical error occurred. Please refresh the page or try again later.
          </p>

          {error.message && (
            <p className="mb-4 text-sm text-muted-foreground/70">
              {error.message}
            </p>
          )}

          {error.digest && (
            <p className="mb-6 text-xs text-muted-foreground/50">
              Error ID: {error.digest}
            </p>
          )}

          <Button onClick={reset} size="lg" className="gap-2">
            <RefreshCw className="h-5 w-5" />
            Refresh Page
          </Button>
        </div>
      </body>
    </html>
  );
}
