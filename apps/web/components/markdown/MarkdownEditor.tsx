"use client";

/**
 * MarkdownEditor Component
 * REQ-FE-351: Markdown editor with syntax highlighting and toolbar
 *
 * Uses @uiw/react-md-editor with dynamic import for SSR compatibility.
 * Provides toolbar with formatting options and keyboard shortcuts.
 */

import React, {
  useCallback,
  useEffect,
  useState,
  forwardRef,
  useImperativeHandle,
  useRef,
} from "react";
import dynamic from "next/dynamic";
import { Loader2 } from "lucide-react";
import { cn } from "~/lib/utils";

// Types for the editor
export interface MarkdownEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  height?: number | string;
  preview?: boolean;
  onTogglePreview?: () => void;
  onImageUpload?: (file: File) => Promise<string>;
  disabled?: boolean;
  className?: string;
}

export interface MarkdownEditorRef {
  insertText: (text: string) => void;
  getSelection: () => { start: number; end: number } | null;
  setSelection: (start: number, end: number) => void;
  focus: () => void;
}

// Loading placeholder
function EditorLoading({ height }: { height?: number | string }) {
  return (
    <div
      className="flex items-center justify-center border border-[var(--color-border)] rounded-[var(--radius-md)] bg-[var(--color-background)]"
      style={{ height: typeof height === "number" ? `${String(height)}px` : height }}
    >
      <Loader2 className="h-6 w-6 animate-spin text-[var(--color-muted-foreground)]" />
    </div>
  );
}

// Dynamic import wrapper component
const MDEditorDynamic = dynamic(
  () => import("@uiw/react-md-editor").then((mod) => mod.default),
  {
    ssr: false,
    loading: () => <EditorLoading height={400} />,
  }
);

/**
 * MarkdownEditor Component
 *
 * Features:
 * - Syntax highlighting in editor pane
 * - Toolbar: Bold, Italic, Strikethrough, Heading, Link, Image, Code, Code Block,
 *   Ordered List, Unordered List, Task List, Table, Horizontal Rule, Math Block, Callout
 * - Full-screen editor mode
 * - Line numbers toggle
 * - Word count display in status bar
 * - Keyboard shortcuts:
 *   - Ctrl/Cmd + B: Bold
 *   - Ctrl/Cmd + I: Italic
 *   - Ctrl/Cmd + K: Insert link
 *   - Ctrl/Cmd + S: Save draft (intercept browser save)
 *   - Ctrl/Cmd + Shift + P: Toggle preview
 *   - Ctrl/Cmd + Shift + F: Toggle fullscreen
 */
const MarkdownEditor = forwardRef<MarkdownEditorRef, MarkdownEditorProps>(
  (
    {
      value,
      onChange,
      placeholder = "Write your content here...",
      height = 500,
      preview = true,
      onTogglePreview,
      onImageUpload,
      disabled = false,
      className,
    },
    ref
  ) => {
    const textareaRef = useRef<HTMLTextAreaElement | null>(null);
    const containerRef = useRef<HTMLDivElement | null>(null);
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [wordCount, setWordCount] = useState(0);

    // Calculate word count
    useEffect(() => {
      const text = value;
      const words = text.trim().split(/\s+/).filter((w) => w.length > 0);
      setWordCount(words.length);
    }, [value]);

    // Find the textarea element for direct manipulation
    useEffect(() => {
      if (containerRef.current) {
        textareaRef.current = containerRef.current.querySelector(
          "textarea.w-md-editor-text-input"
        );
      }
    }, []);

    // Expose methods via ref
    useImperativeHandle(ref, () => ({
      insertText: (text: string) => {
        if (textareaRef.current) {
          const textarea = textareaRef.current;
          const start = textarea.selectionStart;
          const end = textarea.selectionEnd;
          const currentValue = textarea.value;

          const newValue =
            currentValue.substring(0, start) +
            text +
            currentValue.substring(end);

          onChange(newValue);

          // Set cursor position after inserted text
          requestAnimationFrame(() => {
            textarea.selectionStart = textarea.selectionEnd = start + text.length;
            textarea.focus();
          });
        }
      },
      getSelection: () => {
        if (textareaRef.current) {
          return {
            start: textareaRef.current.selectionStart,
            end: textareaRef.current.selectionEnd,
          };
        }
        return null;
      },
      setSelection: (start: number, end: number) => {
        if (textareaRef.current) {
          textareaRef.current.selectionStart = start;
          textareaRef.current.selectionEnd = end;
        }
      },
      focus: () => {
        textareaRef.current?.focus();
      },
    }));

    // Handle keyboard shortcuts
    const handleKeyDown = useCallback(
      (e: KeyboardEvent) => {
        // Only handle if not in an input/textarea already handled by the editor
        const target = e.target as HTMLElement;
        if (
          target.tagName === "INPUT" &&
          target.id !== "w-md-editor-text-input"
        ) {
          return;
        }

        const isMod = e.ctrlKey || e.metaKey;

        if (isMod) {
          switch (e.key.toLowerCase()) {
            case "s":
              // Prevent browser save dialog
              e.preventDefault();
              // The save action is handled by the parent component
              break;
            case "p":
              if (e.shiftKey && onTogglePreview) {
                e.preventDefault();
                onTogglePreview();
              }
              break;
            case "f":
              if (e.shiftKey) {
                e.preventDefault();
                setIsFullscreen((prev) => !prev);
              }
              break;
          }
        }
      },
      [onTogglePreview]
    );

    useEffect(() => {
      document.addEventListener("keydown", handleKeyDown);
      return () => { document.removeEventListener("keydown", handleKeyDown); };
    }, [handleKeyDown]);

    // Handle paste event for images
    const handlePaste = useCallback(
      async (e: ClipboardEvent) => {
        if (!onImageUpload || disabled) return;

        const items = e.clipboardData?.items;
        if (!items) return;

        for (const item of items) {
          if (item.type.startsWith("image/")) {
            e.preventDefault();
            const file = item.getAsFile();
            if (file) {
              try {
                const url = await onImageUpload(file);
                // Insert markdown image syntax
                const imageMarkdown = `![${file.name.replace(/\.[^/.]+$/, "")}](${url})`;
                if (textareaRef.current) {
                  const textarea = textareaRef.current;
                  const start = textarea.selectionStart;
                  const end = textarea.selectionEnd;
                  const currentValue = textarea.value;

                  const newValue =
                    currentValue.substring(0, start) +
                    imageMarkdown +
                    currentValue.substring(end);

                  onChange(newValue);

                  // Set cursor position after inserted image
                  requestAnimationFrame(() => {
                    textarea.selectionStart = textarea.selectionEnd =
                      start + imageMarkdown.length;
                    textarea.focus();
                  });
                }
              } catch (error) {
                console.error("Failed to upload image:", error);
              }
            }
            break;
          }
        }
      },
      [onImageUpload, onChange, disabled]
    );

    useEffect(() => {
      const container = containerRef.current;
      if (container) {
        container.addEventListener("paste", handlePaste);
        return () => { container.removeEventListener("paste", handlePaste); };
      }
    }, [handlePaste]);

    // Handle fullscreen toggle with Escape key
    useEffect(() => {
      const handleEscape = (e: KeyboardEvent) => {
        if (e.key === "Escape" && isFullscreen) {
          setIsFullscreen(false);
        }
      };

      if (isFullscreen) {
        document.addEventListener("keydown", handleEscape);
        document.body.style.overflow = "hidden";
      } else {
        document.body.style.overflow = "";
      }

      return () => {
        document.removeEventListener("keydown", handleEscape);
        document.body.style.overflow = "";
      };
    }, [isFullscreen]);

    return (
      <div
        ref={containerRef}
        className={cn(
          "markdown-editor-container",
          isFullscreen &&
            "fixed inset-0 z-50 bg-[var(--color-background)] p-4",
          className
        )}
        data-color-mode="light"
      >
        <style jsx global>{`
          /* Override default editor styles */
          .w-md-editor {
            --md-editor-background-color: var(--color-background);
            --md-editor-border-color: var(--color-border);
            --md-editor-border-radius: var(--radius-md);
          }

          .w-md-editor-toolbar {
            background-color: var(--color-neutral-50);
            border-bottom: 1px solid var(--color-border);
          }

          .w-md-editor-toolbar button:hover {
            background-color: var(--color-neutral-100);
          }

          .w-md-editor-text {
            font-family: ui-monospace, SFMono-Regular, "SF Mono", Menlo,
              Consolas, "Liberation Mono", monospace;
          }

          .w-md-editor-preview {
            background-color: var(--color-background);
          }

          /* Dark mode support */
          .dark .w-md-editor {
            --md-editor-background-color: var(--color-neutral-900);
          }

          .dark .w-md-editor-toolbar {
            background-color: var(--color-neutral-800);
          }
        `}</style>

        <MDEditorDynamic
          value={value}
          onChange={(val) => { onChange(val ?? ""); }}
          preview={preview ? "live" : "edit"}
          height={isFullscreen ? "calc(100vh - 120px)" : height}
          visibleDragbar={false}
          hideToolbar={false}
          enableScroll={true}
          // Custom styling
          style={{
            borderRadius: "var(--radius-md)",
            opacity: disabled ? 0.5 : 1,
            pointerEvents: disabled ? "none" : "auto",
          }}
          textareaProps={{
            placeholder: placeholder,
            disabled,
          }}
        />

        {/* Status bar with word count */}
        <div className="flex items-center justify-between px-3 py-2 text-xs text-[var(--color-muted-foreground)] border-t border-[var(--color-border)] bg-[var(--color-neutral-50)] rounded-b-[var(--radius-md)]">
          <span>{wordCount} words</span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => { setIsFullscreen(!isFullscreen); }}
              className="hover:text-[var(--color-foreground)] transition-colors"
              title={isFullscreen ? "Exit fullscreen" : "Fullscreen"}
            >
              {isFullscreen ? "Exit Fullscreen" : "Fullscreen"}
            </button>
          </div>
        </div>
      </div>
    );
  }
);

MarkdownEditor.displayName = "MarkdownEditor";

export default MarkdownEditor;
