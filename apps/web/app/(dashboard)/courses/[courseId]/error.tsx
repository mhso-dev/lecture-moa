/**
 * Course Detail Error Boundary
 * TASK-030: Error Boundary
 *
 * REQ-FE-441: Error boundary for unexpected rendering errors
 */

"use client";

import { useEffect } from "react";
import { AlertCircle, RefreshCw } from "lucide-react";
import { Button } from "~/components/ui/button";

interface ErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

/**
 * Error component for course detail page
 * Displayed when an unexpected error occurs during rendering
 */
export default function CourseDetailError({ error, reset }: ErrorProps) {
  useEffect(() => {
    // Log error to error reporting service
    console.error("Course detail page error:", error);
  }, [error]);

  return (
    <div className="flex min-h-96 flex-col items-center justify-center px-4">
      {/* Error Icon */}
      <div className="mb-6 rounded-full bg-red-100 dark:bg-red-900/20 p-6">
        <AlertCircle className="h-12 w-12 text-red-600 dark:text-red-400" />
      </div>

      {/* Error Message */}
      <h1 className="mb-2 text-h2 font-semibold text-foreground">
        문제가 발생했습니다
      </h1>
      <p className="mb-6 text-center text-body text-neutral-500 max-w-md">
        강의를 불러오는 중 예기치 않은 오류가 발생했습니다.
        다시 시도하거나, 문제가 지속되면 관리자에게 문의해 주세요.
      </p>

      {/* Error Details (Development only) */}
      {process.env.NODE_ENV === "development" && (
        <div className="mb-6 rounded-lg bg-red-50 dark:bg-red-900/10 p-4 max-w-md">
          <p className="text-body-sm font-mono text-red-800 dark:text-red-200">
            {error.message}
          </p>
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-3">
        <Button variant="outline" onClick={() => (window.location.href = "/courses")}>
          강의 목록으로
        </Button>
        <Button onClick={reset}>
          <RefreshCw className="mr-2 h-4 w-4" />
          다시 시도
        </Button>
      </div>
    </div>
  );
}
