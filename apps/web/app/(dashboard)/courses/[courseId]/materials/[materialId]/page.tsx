"use client";

import { useEffect, useCallback, useMemo } from "react";
import { useParams } from "next/navigation";
import { cn } from "~/lib/utils";
import { useScrollSpy, useReadingProgress, useMaterial } from "~/hooks/materials";
import { useMaterialStore, useFontSize, useIsFullscreen } from "~/stores/material.store";
import { useQAStore } from "~/stores/qa.store";
import { useCourse } from "~/hooks/useCourse";
import { MarkdownRenderer } from "~/components/markdown/MarkdownRenderer";
import { MaterialToolbar } from "~/components/materials/MaterialToolbar";
import { TableOfContents } from "~/components/materials/TableOfContents";
import { ReadingProgressBar } from "~/components/materials/ReadingProgressBar";
import { MaterialMetadata } from "~/components/materials/MaterialMetadata";
import { MaterialNavigation } from "~/components/materials/MaterialNavigation";
import { QaSelectionTrigger } from "~/components/materials/QaSelectionTrigger";
import { MaterialViewerSkeleton } from "~/components/materials/MaterialViewerSkeleton";
import { QAInlinePopup, QAInlinePopupMobile } from "~/components/qa";
import { extractHeadings } from "~/lib/markdown";

/**
 * Minimum text length required to open Q&A popup
 * Prevents accidental triggers on very short selections
 */
const MIN_SELECTION_LENGTH = 5;

/**
 * Material Viewer Page
 * REQ-FE-315: Full-screen reading experience for a single lecture material
 *
 * Features:
 * - Server Component for metadata fetch (wrapped in Client for interactivity)
 * - TanStack Query integration
 * - Font size adjustment via CSS custom property
 * - Keyboard shortcuts: [ / ] (prev/next section), t (toggle ToC), f (fullscreen)
 * - Q&A inline popup integration (REQ-FE-321)
 * - WCAG 2.1 AA compliance
 */
export default function MaterialViewerPage() {
  const params = useParams();
  const courseId = params.courseId as string;
  const materialId = params.materialId as string;

  const fontSize = useFontSize();
  const isFullscreen = useIsFullscreen();
  const { toggleToc, toggleFullscreen } = useMaterialStore();
  const { openInlinePopup } = useQAStore();

  // Fetch material and course data
  const { data: material, isLoading, error } = useMaterial(courseId, materialId);
  const { data: course } = useCourse(courseId);

  // Extract headings for ToC
  const headings = useMemo(
    () => (material ? extractHeadings(material.content) : []),
    [material]
  );

  // Get heading IDs for scroll spy
  const headingIds = useMemo(() => {
    const ids: string[] = [];
    const collectIds = (items: typeof headings) => {
      items.forEach((item) => {
        ids.push(item.id);
        if (item.children.length > 0) {
          collectIds(item.children);
        }
      });
    };
    collectIds(headings);
    return ids;
  }, [headings]);

  // Scroll spy for active heading
  const activeHeadingId = useScrollSpy(headingIds, {
    rootMargin: "-10% 0px -80% 0px",
  });

  // Reading progress
  const readingProgress = useReadingProgress();

  // Q&A popup handler (TASK-034)
  const handleOpenQaPopup = useCallback(
    (
      selectedText: string,
      anchorRect: DOMRect,
      materialId: string,
      headingId: string | null
    ) => {
      // Validate minimum length
      if (selectedText.length < MIN_SELECTION_LENGTH) {
        return;
      }

      // Open the inline popup with context
      openInlinePopup(anchorRect, {
        courseId,
        materialId,
        headingId,
        selectedText,
      });
    },
    [courseId, openInlinePopup]
  );

  // Navigate to previous/next heading
  const navigateSection = useCallback(
    (direction: number) => {
      if (headingIds.length === 0) {
        return;
      }

      const currentIndex = activeHeadingId
        ? headingIds.indexOf(activeHeadingId)
        : -1;
      const newIndex = currentIndex + direction;

      if (newIndex >= 0 && newIndex < headingIds.length) {
        const headingId = headingIds[newIndex];
        if (headingId) {
          const element = document.getElementById(headingId);
          element?.scrollIntoView({ behavior: "smooth", block: "start" });
        }
      }
    },
    [headingIds, activeHeadingId]
  );

  // Keyboard shortcuts
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      // Ignore if focus is in input/textarea
      const target = e.target as HTMLElement;
      if (
        target.tagName === "INPUT" ||
        target.tagName === "TEXTAREA" ||
        target.isContentEditable
      ) {
        return;
      }

      switch (e.key.toLowerCase()) {
        case "t":
          e.preventDefault();
          toggleToc();
          break;
        case "f":
          e.preventDefault();
          toggleFullscreen();
          break;
        case "[":
          e.preventDefault();
          navigateSection(-1);
          break;
        case "]":
          e.preventDefault();
          navigateSection(1);
          break;
      }
    },
    [toggleToc, toggleFullscreen, navigateSection]
  );

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [handleKeyDown]);

  // Apply fullscreen class to body
  useEffect(() => {
    if (isFullscreen) {
      document.body.classList.add("material-fullscreen");
    } else {
      document.body.classList.remove("material-fullscreen");
    }
    return () => {
      document.body.classList.remove("material-fullscreen");
    };
  }, [isFullscreen]);

  // Font size CSS variable
  const fontSizeMap = {
    sm: "15px",
    md: "16px",
    lg: "18px",
  };

  // Loading state
  if (isLoading) {
    return <MaterialViewerSkeleton />;
  }

  // Error state
  if (error || !material) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] px-4">
        <h1 className="text-2xl font-bold text-[var(--color-foreground)] mb-2">
          자료를 찾을 수 없습니다
        </h1>
        <p className="text-[var(--color-muted-foreground)] mb-4">
          {error?.message ?? "요청한 자료를 불러올 수 없습니다."}
        </p>
        <a
          href={`/courses/${courseId}/materials`}
          className="text-[var(--color-primary-500)] hover:underline"
        >
          자료 목록으로
        </a>
      </div>
    );
  }

  return (
    <div
      className={cn(
        "min-h-screen bg-[var(--color-background)]",
        isFullscreen && "fixed inset-0 z-50 overflow-auto"
      )}
      style={
        {
          "--material-font-size": fontSizeMap[fontSize],
        } as React.CSSProperties
      }
    >
      {/* Reading progress bar */}
      <ReadingProgressBar progress={readingProgress} />

      {/* Toolbar */}
      <MaterialToolbar
        courseId={courseId}
        courseName={course?.title ?? "강의"}
        materialTitle={material.title}
        readTimeMinutes={material.readTimeMinutes}
        materialId={materialId}
      />

      {/* Main content area */}
      <div className="flex">
        {/* Content */}
        <main
          id="material-content"
          className="flex-1 max-w-3xl mx-auto px-4 py-8"
          style={{ fontSize: "var(--material-font-size)" }}
        >
          {/* Metadata */}
          <MaterialMetadata
            title={material.title}
            author={material.author}
            createdAt={material.createdAt}
            updatedAt={material.updatedAt}
            readTimeMinutes={material.readTimeMinutes}
            tags={material.tags}
            status={material.status}
            className="mb-8"
          />

          {/* Markdown content */}
          <article className="prose prose-neutral dark:prose-invert max-w-none">
            <MarkdownRenderer content={material.content} />
          </article>

          {/* Navigation */}
          <MaterialNavigation
            courseId={courseId}
            previous={null} // TODO: Get from material list context
            next={null}
            className="mt-12"
          />
        </main>

        {/* Table of Contents (desktop panel) */}
        <TableOfContents
          items={headings}
          activeId={activeHeadingId}
          className="hidden xl:block"
        />
      </div>

      {/* Q&A Selection Trigger */}
      <QaSelectionTrigger
        materialId={materialId}
        activeHeadingId={activeHeadingId}
        onOpenQaPopup={handleOpenQaPopup}
      />

      {/* Q&A Inline Popups (Desktop & Mobile) */}
      <QAInlinePopup />
      <QAInlinePopupMobile />
    </div>
  );
}
