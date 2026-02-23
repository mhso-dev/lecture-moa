"use client";

import { useEffect } from "react";
import { useParams } from "next/navigation";
import { Button } from "~/components/ui/button";
import { AlertCircle, RefreshCcw, ArrowLeft } from "lucide-react";

interface ErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

/**
 * Material Viewer Error State
 * REQ-FE-325: Error state for material viewer
 *
 * Features:
 * - Network error state with retry button
 * - Access denied state (student accessing draft)
 * - Link back to course materials
 */
export default function MaterialViewerError({ error, reset }: ErrorProps) {
  const params = useParams();
  const courseId = params.courseId as string;

  useEffect(() => {
    // Log error to error reporting service
    console.error("Material viewer error:", error);
  }, [error]);

  // Determine error type
  const isAccessDenied = error.message.toLowerCase().includes("access") ||
    error.message.toLowerCase().includes("forbidden") ||
    error.message.toLowerCase().includes("unauthorized");

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] px-4 text-center">
      <AlertCircle className="h-16 w-16 text-[var(--color-error-500)] mb-4" />

      <h1 className="text-2xl font-bold text-[var(--color-foreground)] mb-2">
        {isAccessDenied ? "접근 권한 없음" : "자료를 불러오지 못했습니다"}
      </h1>

      <p className="text-[var(--color-muted-foreground)] mb-6 max-w-md">
        {isAccessDenied
          ? "이 자료는 아직 게시되지 않았거나 열람 권한이 없습니다."
          : error.message || "자료를 불러오는 중 오류가 발생했습니다."}
      </p>

      <div className="flex gap-4">
        {!isAccessDenied && (
          <Button onClick={reset} variant="default" className="gap-2">
            <RefreshCcw className="h-4 w-4" />
            다시 시도
          </Button>
        )}

        <Button
          asChild
          variant="outline"
          className="gap-2"
        >
          <a href={`/courses/${courseId}/materials`}>
            <ArrowLeft className="h-4 w-4" />
            자료 목록으로
          </a>
        </Button>
      </div>
    </div>
  );
}
