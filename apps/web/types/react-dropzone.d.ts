/**
 * Type declarations for react-dropzone
 */

declare module "react-dropzone" {
  import { DragEvent, HTMLAttributes } from "react";

  interface FileError {
    code: string;
    message: string;
  }

  interface FileRejection {
    file: File;
    errors: FileError[];
  }

  interface DropzoneOptions {
    accept?: Record<string, string[]>;
    multiple?: boolean;
    disabled?: boolean;
    maxFiles?: number;
    maxSize?: number;
    minSize?: number;
    noClick?: boolean;
    noDrag?: boolean;
    noKeyboard?: boolean;
    useFsAccessApi?: boolean;
    onDrop?: (acceptedFiles: File[], fileRejections: FileRejection[]) => void;
    onDropAccepted?: (files: File[]) => void;
    onDropRejected?: (fileRejections: FileRejection[]) => void;
    onDragEnter?: (event: DragEvent<HTMLElement>) => void;
    onDragOver?: (event: DragEvent<HTMLElement>) => void;
    onDragLeave?: (event: DragEvent<HTMLElement>) => void;
    onFileDialogCancel?: () => void;
    onFileDialogOpen?: () => void;
    validator?: (file: File) => FileError | null;
  }

  interface DropzoneState {
    isDragAccept: boolean;
    isDragActive: boolean;
    isDragReject: boolean;
    isFocused: boolean;
    isFileDialogActive: boolean;
    draggedFiles: File[];
    acceptedFiles: File[];
    fileRejections: FileRejection[];
    getRootProps: <T extends HTMLElement>(props?: HTMLAttributes<T>) => HTMLAttributes<T> & { ref: (node: T | null) => void };
    getInputProps: <T extends HTMLElement>(props?: HTMLAttributes<T>) => HTMLAttributes<T>;
    open: () => void;
  }

  function useDropzone(options?: DropzoneOptions): DropzoneState;

  export { useDropzone, type FileRejection, type FileError, type DropzoneOptions, type DropzoneState };
}
