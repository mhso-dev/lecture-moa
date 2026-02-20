"use client";

import { useCallback, useState } from "react";
import { useDropzone } from "react-dropzone";
import type { FileRejection, FileError } from "react-dropzone";
import { Upload, X, AlertCircle, FileText } from "lucide-react";
import { cn } from "~/lib/utils";

export interface DropZoneProps {
  /** Callback when a file is accepted and read */
  onFileAccepted: (content: string, filename: string) => void;
  /** Accepted MIME types (default: markdown and text) */
  accept?: Record<string, string[]>;
  /** Maximum file size in bytes (default: 10MB) */
  maxSize?: number;
  /** Additional CSS class */
  className?: string;
  /** Whether the dropzone is disabled */
  disabled?: boolean;
}

const DEFAULT_ACCEPT: Record<string, string[]> = {
  "text/markdown": [".md", ".markdown"],
  "text/plain": [".md", ".markdown", ".txt"],
};

const DEFAULT_MAX_SIZE = 10 * 1024 * 1024; // 10MB

/**
 * DropZone Component
 * REQ-FE-341, 346: Drag-and-drop file upload for Markdown materials
 *
 * Features:
 * - Drag-and-drop using react-dropzone
 * - Accepted MIME types: text/markdown, text/plain with .md extension
 * - Maximum file size: 10 MB (validated client-side)
 * - On file drop/selection: read file as UTF-8 text, call onFileAccepted
 * - Keyboard accessible (Tab focusable, Enter/Space opens file picker)
 * - role="button" and aria-label
 * - Visual focus indicator
 * - Error display for rejected files
 */
export function DropZone({
  onFileAccepted,
  accept = DEFAULT_ACCEPT,
  maxSize = DEFAULT_MAX_SIZE,
  className,
  disabled = false,
}: DropZoneProps) {
  const [rejections, setRejections] = useState<FileRejection[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const handleDrop = useCallback(
    async (acceptedFiles: File[], fileRejections: FileRejection[]) => {
      // Clear previous errors
      setRejections(fileRejections);

      if (acceptedFiles.length === 0) return;

      const file = acceptedFiles[0];
      if (!file) return;

      setIsLoading(true);

      try {
        // Read file as UTF-8 text
        const content = await readFileAsText(file);
        onFileAccepted(content, file.name);
      } catch (error) {
        setRejections([
          {
            file,
            errors: [
              {
                code: "read-error",
                message:
                  error instanceof Error
                    ? error.message
                    : "Failed to read file",
              },
            ],
          },
        ]);
      } finally {
        setIsLoading(false);
      }
    },
    [onFileAccepted]
  );

  const {
    getRootProps,
    getInputProps,
    isDragActive,
    isDragReject,
    isFocused,
  } = useDropzone({
    onDrop: handleDrop,
    accept,
    maxSize,
    maxFiles: 1,
    disabled,
    useFsAccessApi: false, // Use traditional input for better compatibility
  });

  const clearErrors = (): void => {
    setRejections([]);
  };

  // Format file size for display
  const formatSize = (bytes: number): string => {
    if (bytes < 1024) return `${String(bytes)} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div className={cn("space-y-3", className)}>
      {/* Drop zone area */}
      <div
        {...getRootProps()}
        role="button"
        tabIndex={disabled ? -1 : 0}
        aria-label="Upload markdown file"
        aria-disabled={disabled}
        className={cn(
          "relative flex flex-col items-center justify-center rounded-lg border-2 border-dashed p-8 transition-colors",
          "focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-ring)] focus-visible:ring-offset-2",
          disabled && "opacity-50 cursor-not-allowed",
          !disabled &&
            !isDragActive &&
            "border-[var(--color-neutral-300)] dark:border-[var(--color-neutral-700)] hover:border-[var(--color-primary-400)] hover:bg-[var(--color-neutral-50)] dark:hover:bg-[var(--color-neutral-900)]",
          isDragActive &&
            !isDragReject &&
            "border-[var(--color-primary-500)] bg-[var(--color-primary-50)] dark:bg-[var(--color-primary-950)]",
          isDragReject &&
            "border-[var(--color-danger-500)] bg-[var(--color-danger-50)] dark:bg-[var(--color-danger-950)]",
          isFocused && "ring-2 ring-[var(--color-ring)] ring-offset-2"
        )}
      >
        <input {...getInputProps()} />

        {isLoading ? (
          <>
            <div className="h-12 w-12 animate-spin rounded-full border-4 border-[var(--color-primary-200)] border-t-[var(--color-primary-600)] mb-4" />
            <p className="text-sm text-[var(--color-muted-foreground)]">
              Reading file...
            </p>
          </>
        ) : isDragActive ? (
          isDragReject ? (
            <>
              <AlertCircle className="h-12 w-12 text-[var(--color-danger-500)] mb-4" />
              <p className="text-sm font-medium text-[var(--color-danger-600)]">
                Invalid file type
              </p>
              <p className="text-xs text-[var(--color-muted-foreground)] mt-1">
                Please upload a Markdown file (.md, .markdown)
              </p>
            </>
          ) : (
            <>
              <FileText className="h-12 w-12 text-[var(--color-primary-500)] mb-4" />
              <p className="text-sm font-medium text-[var(--color-primary-600)]">
                Drop to upload
              </p>
            </>
          )
        ) : (
          <>
            <Upload className="h-12 w-12 text-[var(--color-muted-foreground)] mb-4" />
            <p className="text-sm font-medium text-[var(--color-foreground)] mb-1">
              Drag and drop a Markdown file here
            </p>
            <p className="text-xs text-[var(--color-muted-foreground)]">
              or click to browse
            </p>
            <p className="text-xs text-[var(--color-muted-foreground)] mt-2">
              Supported: .md, .markdown (max {formatSize(maxSize)})
            </p>
          </>
        )}
      </div>

      {/* Error messages */}
      {rejections.length > 0 && (
        <div
          className="rounded-md bg-[var(--color-danger-50)] dark:bg-[var(--color-danger-950)] p-4"
          role="alert"
        >
          <div className="flex items-start justify-between">
            <div className="flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-[var(--color-danger-500)] flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-[var(--color-danger-700)] dark:text-[var(--color-danger-400)]">
                  File upload failed
                </p>
                <ul className="mt-1 text-sm text-[var(--color-danger-600)] dark:text-[var(--color-danger-500)] list-disc list-inside">
                  {rejections.map(({ file, errors }) => (
                    <li key={file.name}>
                      <span className="font-medium">{file.name}</span>
                      <ul className="ml-4 list-disc list-inside">
                        {errors.map((error: FileError) => (
                          <li key={error.code}>
                            {error.code === "file-too-large"
                              ? `File is too large (max ${formatSize(maxSize)})`
                              : error.code === "file-invalid-type"
                                ? "Invalid file type. Please upload a Markdown file."
                                : error.message}
                          </li>
                        ))}
                      </ul>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
            <button
              type="button"
              onClick={clearErrors}
              className="text-[var(--color-danger-500)] hover:text-[var(--color-danger-700)] dark:hover:text-[var(--color-danger-300)]"
              aria-label="Dismiss error"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * Read file contents as UTF-8 text
 */
function readFileAsText(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") {
        resolve(reader.result);
      } else {
        reject(new Error("Failed to read file as text"));
      }
    };
    reader.onerror = () => {
      reject(new Error(reader.error?.message ?? "Failed to read file"));
    };
    reader.readAsText(file, "UTF-8");
  });
}
