/**
 * Type declarations for modules without TypeScript definitions
 */

declare module "@uiw/react-md-editor" {
  import { ComponentType } from "react";

  interface MDEditorProps {
    value?: string;
    onChange?: (value: string | undefined) => void;
    preview?: "live" | "edit" | "preview";
    height?: number | string;
    visibleDragbar?: boolean;
    hideToolbar?: boolean;
    enableScroll?: boolean;
    style?: React.CSSProperties;
    textareaProps?: React.TextareaHTMLAttributes<HTMLTextAreaElement>;
  }

  const MDEditor: ComponentType<MDEditorProps>;
  export default MDEditor;
}

declare module "react-markdown" {
  import { ComponentType, ReactNode } from "react";

  interface Components {
    [key: string]: ComponentType<any> | undefined;
  }

  interface ReactMarkdownProps {
    children?: string;
    className?: string;
    remarkPlugins?: Array<any>;
    rehypePlugins?: Array<any>;
    components?: Components;
    [key: string]: any;
  }

  const ReactMarkdown: ComponentType<ReactMarkdownProps>;
  export default ReactMarkdown;

  export type { Components };
}

declare module "remark-gfm" {
  interface RemarkGfmOptions {
    singleTilde?: boolean;
  }

  function remarkGfm(options?: RemarkGfmOptions): any;
  export default remarkGfm;
}

declare module "remark-math" {
  function remarkMath(): any;
  export default remarkMath;
}

declare module "remark-callout" {
  function remarkCallout(): any;
  export default remarkCallout;
}

declare module "rehype-katex" {
  interface RehypeKatexOptions {
    strict?: boolean | string;
    throwOnError?: boolean;
    output?: "html" | "mathml" | "htmlAndMathml";
    trust?: boolean | ((context: any) => boolean);
    maxMacroExpansions?: number;
    maxSize?: number;
    maxExpand?: number;
    displayMode?: boolean;
    fleqn?: boolean;
    leqno?: boolean;
  }

  function rehypeKatex(options?: RehypeKatexOptions): any;
  export default rehypeKatex;
}

declare module "rehype-highlight" {
  interface RehypeHighlightOptions {
    detect?: boolean;
    ignoreMissing?: boolean;
    subset?: string[] | false;
    prefix?: string;
    plainText?: string[];
  }

  function rehypeHighlight(options?: RehypeHighlightOptions): any;
  export default rehypeHighlight;
}

declare module "rehype-sanitize" {
  interface Schema {
    tagNames?: string[];
    attributes?: {
      [key: string]: Array<string | [string, { value: RegExp }]>;
    };
    protocols?: {
      [key: string]: string[];
    };
  }

  const defaultSchema: Schema;

  function rehypeSanitize(schema?: Schema): any;
  export default rehypeSanitize;
  export { defaultSchema };
}

declare module "katex" {
  interface KatexRenderOptions {
    displayMode?: boolean;
    output?: "html" | "mathml" | "htmlAndMathml";
    leqno?: boolean;
    fleqn?: boolean;
    throwOnError?: boolean;
    errorColor?: string;
    macros?: Record<string, string>;
    minRuleThickness?: number;
    colorIsTextColor?: boolean;
    maxSize?: number;
    maxExpand?: number;
    strict?: boolean | string | ((message: string, code: string) => boolean | void);
    trust?: boolean | ((context: any) => boolean);
    globalGroup?: boolean;
  }

  function render(
    latex: string,
    element: HTMLElement,
    options?: KatexRenderOptions
  ): void;

  function renderToString(
    latex: string,
    options?: KatexRenderOptions
  ): string;

  function renderMathInElement(
    element: HTMLElement,
    options?: KatexRenderOptions
  ): void;
}

declare module "react-dropzone" {
  import { ComponentType, DragEvent } from "react";

  interface DropzoneOptions {
    accept?: Record<string, string[]> | string[];
    multiple?: boolean;
    preventDropOnDocument?: boolean;
    noClick?: boolean;
    noKeyboard?: boolean;
    noDrag?: boolean;
    noDragEventsBubbling?: boolean;
    minSize?: number;
    maxSize?: number;
    maxFiles?: number;
    disabled?: boolean;
    onDrop?: <T extends File>(acceptedFiles: T[], fileRejections: FileRejection[], event: DropEvent) => void;
    onDropAccepted?: <T extends File>(files: T[], event: DropEvent) => void;
    onDropRejected?: (fileRejections: FileRejection[], event: DropEvent) => void;
    onFileDialogOpen?: () => void;
    onFileDialogCancel?: () => void;
    onDragEnter?: (event: DragEvent<HTMLElement>) => void;
    onDragOver?: (event: DragEvent<HTMLElement>) => void;
    onDragLeave?: (event: DragEvent<HTMLElement>) => void;
    getFilesFromEvent?: (event: DropEvent) => Promise<File[]>;
    validator?: <T extends File>(file: T) => FileError | FileError[] | null;
    useFsAccessApi?: boolean;
    autoFocus?: boolean;
  }

  interface DropzoneState {
    isDragActive: boolean;
    isDragAccept: boolean;
    isDragReject: boolean;
    isFocused: boolean;
    isFileDialogActive: boolean;
    draggedFiles: File[];
    acceptedFiles: File[];
    fileRejections: FileRejection[];
    getRootProps: (props?: Record<string, any>) => Record<string, any>;
    getInputProps: (props?: Record<string, any>) => Record<string, any>;
    open: () => void;
  }

  interface FileError {
    code: string;
    message: string;
  }

  interface FileRejection {
    file: File;
    errors: FileError[];
  }

  type DropEvent = DragEvent<HTMLElement> | Event;

  function useDropzone(options?: DropzoneOptions): DropzoneState;

  const Dropzone: ComponentType<DropzoneOptions & { children?: React.ReactNode }>;

  export { useDropzone, Dropzone, DropzoneOptions, DropzoneState, FileError, FileRejection };
}
