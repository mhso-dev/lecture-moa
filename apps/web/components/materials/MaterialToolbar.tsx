"use client";

import { useCallback } from "react";
import Link from "next/link";
import {
  ChevronLeft,
  Clock,
  FileText,
  Type,
  Edit,
  Maximize2,
} from "lucide-react";
import { cn } from "~/lib/utils";
import { Button } from "~/components/ui/button";
import { useAuthStore } from "~/stores/auth.store";
import { useMaterialStore, useFontSize } from "~/stores/material.store";

interface MaterialToolbarProps {
  /** Course ID */
  courseId: string;
  /** Course name for back link */
  courseName: string;
  /** Material title */
  materialTitle: string;
  /** Estimated read time in minutes */
  readTimeMinutes: number;
  /** Material ID for edit link */
  materialId: string;
  /** Additional CSS classes */
  className?: string;
}

const FONT_SIZES = {
  sm: { label: "Small", value: "sm", next: "md" as const },
  md: { label: "Medium", value: "md", next: "lg" as const },
  lg: { label: "Large", value: "lg", next: "sm" as const },
};

/**
 * MaterialToolbar Component
 * REQ-FE-319: Top toolbar with navigation and utility actions
 *
 * Features:
 * - Back navigation (chevron left + course name)
 * - Material title (truncated)
 * - Reading time estimate
 * - ToC toggle button (tablet/mobile)
 * - Font size toggle (sm/md/lg)
 * - Fullscreen toggle
 * - Edit button (instructor only)
 * - Sticky positioning
 *
 * @example
 * ```tsx
 * <MaterialToolbar
 *   courseId={courseId}
 *   courseName={course.title}
 *   materialTitle={material.title}
 *   readTimeMinutes={material.readTimeMinutes}
 *   materialId={material.id}
 * />
 * ```
 */
export function MaterialToolbar({
  courseId,
  courseName,
  materialTitle,
  readTimeMinutes,
  materialId,
  className,
}: MaterialToolbarProps) {
  const role = useAuthStore((state) => state.role);
  const isInstructor = role === "instructor";

  const fontSize = useFontSize();
  const { setFontSize, toggleFullscreen, toggleToc } = useMaterialStore();

  // Truncate title
  const truncateTitle = (title: string, maxLen = 30) => {
    if (title.length <= maxLen) return title;
    return `${title.slice(0, maxLen)}...`;
  };

  // Cycle through font sizes
  const handleFontSizeToggle = useCallback(() => {
    const nextSize = FONT_SIZES[fontSize].next;
    setFontSize(nextSize);
  }, [fontSize, setFontSize]);

  // Apply font size CSS variable
  const fontSizeCssVar = {
    sm: "15px",
    md: "16px",
    lg: "18px",
  };

  return (
    <header
      className={cn(
        "sticky top-0 z-40 flex items-center gap-2 border-b border-[var(--color-border)] bg-[var(--color-background)]/95 px-4 py-3 backdrop-blur-sm",
        className
      )}
      style={{ "--material-font-size": fontSizeCssVar[fontSize] } as React.CSSProperties}
    >
      {/* Back navigation */}
      <Link
        href={`/courses/${courseId}/materials`}
        className="flex items-center gap-1 text-sm text-[var(--color-muted-foreground)] hover:text-[var(--color-foreground)] transition-colors shrink-0"
      >
        <ChevronLeft className="h-4 w-4" />
        <span className="hidden sm:inline max-w-[120px] truncate">
          {courseName}
        </span>
      </Link>

      {/* Separator */}
      <span className="text-[var(--color-border)]">/</span>

      {/* Material title */}
      <h1 className="flex-1 min-w-0 font-medium truncate text-[var(--color-foreground)]">
        {truncateTitle(materialTitle)}
      </h1>

      {/* Reading time */}
      <div className="hidden sm:flex items-center gap-1 text-xs text-[var(--color-muted-foreground)] shrink-0">
        <Clock className="h-3.5 w-3.5" />
        <span>{readTimeMinutes} min</span>
      </div>

      {/* ToC toggle (tablet/mobile) */}
      <Button
        variant="ghost"
        size="icon"
        className="xl:hidden"
        onClick={toggleToc}
        aria-label="Toggle table of contents"
      >
        <FileText className="h-4 w-4" />
      </Button>

      {/* Font size toggle */}
      <Button
        variant="ghost"
        size="icon"
        onClick={handleFontSizeToggle}
        aria-label={`Font size: ${FONT_SIZES[fontSize].label}. Click to change.`}
      >
        <Type className="h-4 w-4" />
      </Button>

      {/* Fullscreen toggle */}
      <Button
        variant="ghost"
        size="icon"
        onClick={toggleFullscreen}
        aria-label="Toggle fullscreen mode"
      >
        <Maximize2 className="h-4 w-4" />
      </Button>

      {/* Edit button (instructor only) */}
      {isInstructor && (
        <Link href={`/courses/${courseId}/materials/${materialId}/edit`}>
          <Button
            variant="outline"
            size="sm"
            className="gap-2"
          >
            <Edit className="h-4 w-4" />
            <span className="hidden sm:inline">Edit</span>
          </Button>
        </Link>
      )}
    </header>
  );
}
