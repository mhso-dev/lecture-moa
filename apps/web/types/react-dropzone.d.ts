/**
 * Type declarations for react-dropzone
 * @see https://github.com/react-dropzone/react-dropzone
 */

declare module "react-dropzone" {
  import { DetailedHTMLProps, InputHTMLAttributes, HTMLAttributes, Ref, RefCallback, DragEvent } from "react";

  export interface FileError {
    code: string;
    message: string;
  }

  export interface FileRejection {
    file: File;
    errors: FileError[];
  }

  export interface DropzoneOptions {
    accept?: Record<string, string[]>;
    disabled?: boolean;
    getFilesFromEvent?: (event: Event | unknown) => Promise<File[] | File[]>;
    maxSize?: number;
    minSize?: number;
    multiple?: boolean;
    maxFiles?: number;
    onDrop?: <T extends File>(acceptedFiles: T[], fileRejections: FileRejection[]) => void;
    onDropAccepted?: <T extends File>(files: T[]) => void;
    onDropRejected?: (fileRejections: FileRejection[]) => void;
    onFileDialogOpen?: () => void;
    onFileDialogCancel?: () => void;
    onDragEnter?: (event: DragEvent<HTMLElement>) => void;
    onDragLeave?: (event: DragEvent<HTMLElement>) => void;
    onDragOver?: (event: DragEvent<HTMLElement>) => void;
    preventDropOnDocument?: boolean;
    noClick?: boolean;
    noKeyboard?: boolean;
    noDrag?: boolean;
    noDragEventsBubbling?: boolean;
    validator?: <T extends File>(file: T) => FileError | FileError[] | null;
    useFsAccessApi?: boolean;
    autoFocus?: boolean;
  }

  export interface DropzoneRootProps
    extends DetailedHTMLProps<HTMLAttributes<HTMLDivElement>, HTMLDivElement> {
    ref?: Ref<HTMLDivElement>;
  }

  export interface DropzoneInputProps
    extends DetailedHTMLProps<InputHTMLAttributes<HTMLInputElement>, HTMLInputElement> {
    ref?: RefCallback<HTMLInputElement>;
  }

  export interface DropzoneState {
    isDragActive: boolean;
    isDragAccept: boolean;
    isDragReject: boolean;
    isFocused: boolean;
    isFileDialogActive: boolean;
    draggedFiles: File[];
    acceptedFiles: File[];
    fileRejections: FileRejection[];
    getRootProps: (props?: DropzoneRootProps) => DropzoneRootProps;
    getInputProps: (props?: DropzoneInputProps) => DropzoneInputProps;
    rootRef: RefCallback<HTMLDivElement>;
    inputRef: RefCallback<HTMLInputElement>;
    open: () => void;
  }

  export function useDropzone(options?: DropzoneOptions): DropzoneState;
}
