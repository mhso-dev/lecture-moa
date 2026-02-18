"use client";

import { useEffect } from "react";
import { AlertCircle, RefreshCw, Home } from "lucide-react";
import { Button } from "~/components/ui/button";

interface ErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

/**
 * Error Boundary Component
 *
 * Catches errors in route segments and displays a user-friendly error UI.
 * Provides retry functionality and navigation back to home.
 */
export default function Error({ error, reset }: ErrorProps) {
  useEffect(() => {
    // Log error to error reporting service
    console.error("Route error:", error);
  }, [error]);

  return (
    <div className="flex min-h-[400px] flex-col items-center justify-center px-4 text-center">
      <div className="mb-6 rounded-full bg-destructive/10 p-4">
        <AlertCircle className="h-12 w-12 text-destructive" />
      </div>

      <h1 className="mb-2 text-2xl font-semibold tracking-tight">
        Something went wrong
      </h1>

      <p className="mb-6 max-w-md text-muted-foreground">
        {error.message || "An unexpected error occurred. Please try again."}
      </p>

      {error.digest && (
        <p className="mb-4 text-xs text-muted-foreground">
          Error ID: {error.digest}
        </p>
      )}

      <div className="flex flex-wrap items-center justify-center gap-4">
        <Button onClick={reset} variant="default" className="gap-2">
          <RefreshCw className="h-4 w-4" />
          Try Again
        </Button>

        <Button asChild variant="outline" className="gap-2">
          <a href="/">
            <Home className="h-4 w-4" />
            Go Home
          </a>
        </Button>
      </div>
    </div>
  );
}
