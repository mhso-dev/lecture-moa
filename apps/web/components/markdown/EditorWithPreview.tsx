"use client";

/**
 * EditorWithPreview Component
 * REQ-FE-352: Live preview pane with split-pane layout
 *
 * Features:
 * - Split-pane layout (50/50 by default)
 * - Preview uses MarkdownRenderer component
 * - Preview debounced 500ms after last keystroke
 * - Scroll sync between editor and preview (optional, best-effort)
 * - On mobile: toggle between editor and preview tabs
 * - Resizable drag handle (optional)
 */

import React, {
  useState,
  useEffect,
  useCallback,
  useRef,
  forwardRef,
  useImperativeHandle,
} from "react";
import { cn } from "~/lib/utils";
import { useDebounce } from "~/hooks/useDebounce";
import { MarkdownRenderer } from "./MarkdownRenderer";
import MarkdownEditor, {
  MarkdownEditorRef,
  MarkdownEditorProps,
} from "./MarkdownEditor";
import { Button } from "~/components/ui/button";
import { Edit3, Eye, Columns } from "lucide-react";

export interface EditorWithPreviewProps
  extends Omit<MarkdownEditorProps, "preview" | "onTogglePreview"> {
  showPreview?: boolean;
  className?: string;
  initialTab?: "editor" | "preview" | "split";
}

export interface EditorWithPreviewRef {
  insertText: (text: string) => void;
  getEditorSelection: () => { start: number; end: number } | null;
  setEditorSelection: (start: number, end: number) => void;
  focusEditor: () => void;
}

type ViewMode = "editor" | "preview" | "split";

/**
 * EditorWithPreview Component
 *
 * Provides a split-pane layout with markdown editor on the left
 * and live preview on the right. On mobile, allows toggling between
 * editor and preview tabs.
 */
const EditorWithPreview = forwardRef<EditorWithPreviewRef, EditorWithPreviewProps>(
  (
    {
      value,
      onChange,
      showPreview = true,
      className,
      initialTab = "split",
      height = 500,
      onImageUpload,
      disabled,
      placeholder,
      ...editorProps
    },
    ref
  ) => {
    const editorRef = useRef<MarkdownEditorRef>(null);
    const previewRef = useRef<HTMLDivElement>(null);
    const [viewMode, setViewMode] = useState<ViewMode>(initialTab);
    const [isMobile, setIsMobile] = useState(false);

    // Debounce preview content for performance
    const debouncedContent = useDebounce(value, 500);

    // Check if mobile viewport
    useEffect(() => {
      const checkMobile = () => {
        setIsMobile(window.innerWidth < 768);
        if (window.innerWidth < 768 && viewMode === "split") {
          setViewMode("editor");
        }
      };

      checkMobile();
      window.addEventListener("resize", checkMobile);
      return () => window.removeEventListener("resize", checkMobile);
    }, [viewMode]);

    // Expose methods via ref
    useImperativeHandle(ref, () => ({
      insertText: (text: string) => {
        editorRef.current?.insertText(text);
      },
      getEditorSelection: () => {
        return editorRef.current?.getSelection() ?? null;
      },
      setEditorSelection: (start: number, end: number) => {
        editorRef.current?.setSelection(start, end);
      },
      focusEditor: () => {
        editorRef.current?.focus();
      },
    }));

    // Toggle preview mode
    const handleTogglePreview = useCallback(() => {
      if (isMobile) {
        setViewMode((prev) => (prev === "editor" ? "preview" : "editor"));
      } else {
        setViewMode((prev) => {
          if (prev === "split") return "editor";
          return "split";
        });
      }
    }, [isMobile]);

    // Render tab buttons for mobile
    const renderMobileTabs = () => (
      <div className="flex border-b border-[var(--color-border)] bg-[var(--color-background)]">
        <button
          type="button"
          onClick={() => setViewMode("editor")}
          className={cn(
            "flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors",
            viewMode === "editor"
              ? "border-[var(--color-primary-500)] text-[var(--color-primary-600)]"
              : "border-transparent text-[var(--color-muted-foreground)] hover:text-[var(--color-foreground)]"
          )}
        >
          <Edit3 className="h-4 w-4" />
          Edit
        </button>
        <button
          type="button"
          onClick={() => setViewMode("preview")}
          className={cn(
            "flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors",
            viewMode === "preview"
              ? "border-[var(--color-primary-500)] text-[var(--color-primary-600)]"
              : "border-transparent text-[var(--color-muted-foreground)] hover:text-[var(--color-foreground)]"
          )}
        >
          <Eye className="h-4 w-4" />
          Preview
        </button>
      </div>
    );

    // Render desktop toolbar
    const renderDesktopToolbar = () => (
      <div className="flex items-center justify-between border-b border-[var(--color-border)] bg-[var(--color-background)] px-4 py-2">
        <span className="text-sm font-medium text-[var(--color-muted-foreground)]">
          {viewMode === "split" ? "Split View" : viewMode === "editor" ? "Editor" : "Preview"}
        </span>
        <div className="flex items-center gap-2">
          <Button
            variant={viewMode === "editor" ? "secondary" : "ghost"}
            size="sm"
            onClick={() => setViewMode("editor")}
            className="h-8"
          >
            <Edit3 className="h-4 w-4 mr-1" />
            Editor
          </Button>
          <Button
            variant={viewMode === "split" ? "secondary" : "ghost"}
            size="sm"
            onClick={() => setViewMode("split")}
            className="h-8"
          >
            <Columns className="h-4 w-4 mr-1" />
            Split
          </Button>
          <Button
            variant={viewMode === "preview" ? "secondary" : "ghost"}
            size="sm"
            onClick={() => setViewMode("preview")}
            className="h-8"
          >
            <Eye className="h-4 w-4 mr-1" />
            Preview
          </Button>
        </div>
      </div>
    );

    // Calculate height for panels
    const panelHeight = typeof height === "number" ? `${height}px` : height;

    return (
      <div className={cn("editor-with-preview rounded-[var(--radius-lg)] border border-[var(--color-border)] overflow-hidden", className)}>
        {/* Toolbar */}
        {isMobile ? renderMobileTabs() : renderDesktopToolbar()}

        {/* Content area */}
        <div className="flex flex-col md:flex-row">
          {/* Editor panel */}
          {(viewMode === "editor" || viewMode === "split") && (
            <div
              className={cn(
                "flex-1 overflow-hidden",
                viewMode === "split" && "border-r border-[var(--color-border)]"
              )}
              style={{
                width: viewMode === "split" && !isMobile ? "50%" : "100%",
              }}
            >
              <MarkdownEditor
                ref={editorRef}
                value={value}
                onChange={onChange}
                height={panelHeight}
                preview={false}
                onTogglePreview={handleTogglePreview}
                onImageUpload={onImageUpload}
                disabled={disabled}
                placeholder={placeholder}
                {...editorProps}
              />
            </div>
          )}

          {/* Preview panel */}
          {(viewMode === "preview" || viewMode === "split") && showPreview && (
            <div
              ref={previewRef}
              className={cn(
                "flex-1 overflow-auto bg-[var(--color-background)]",
                viewMode === "split" && "hidden md:block"
              )}
              style={{
                width: viewMode === "split" && !isMobile ? "50%" : "100%",
                height: isMobile
                  ? viewMode === "preview"
                    ? panelHeight
                    : 0
                  : panelHeight,
              }}
            >
              <div className="p-6 max-w-none prose prose-neutral dark:prose-invert">
                {debouncedContent ? (
                  <MarkdownRenderer content={debouncedContent} />
                ) : (
                  <div className="text-[var(--color-muted-foreground)] italic">
                    Preview will appear here...
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }
);

EditorWithPreview.displayName = "EditorWithPreview";

export default EditorWithPreview;
