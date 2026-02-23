"use client";

import { FileText, RefreshCw } from "lucide-react";
import { Button } from "~/components/ui/button";

/**
 * Materials List Error State
 * REQ-FE-325: Error state for material list page
 *
 * Features:
 * - Error icon and message
 * - Retry button to refetch data
 */
export default function MaterialsError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[400px] py-16 text-center">
      <div className="rounded-full bg-[var(--color-danger-100)] dark:bg-[var(--color-danger-900)] p-4 mb-4">
        <FileText className="h-8 w-8 text-[var(--color-danger-600)] dark:text-[var(--color-danger-400)]" />
      </div>

      <h2 className="text-xl font-semibold text-[var(--color-foreground)] mb-2">
        자료를 불러오지 못했습니다
      </h2>

      <p className="text-[var(--color-muted-foreground)] mb-6 max-w-md">
        {error.message ||
          "자료를 불러오는 중 예기치 않은 오류가 발생했습니다. 다시 시도해 주세요."}
      </p>

      <div className="flex gap-3">
        <Button variant="outline" onClick={() => (window.location.href = "/")}>
          홈으로
        </Button>
        <Button onClick={reset}>
          <RefreshCw className="mr-2 h-4 w-4" />
          다시 시도
        </Button>
      </div>
    </div>
  );
}
