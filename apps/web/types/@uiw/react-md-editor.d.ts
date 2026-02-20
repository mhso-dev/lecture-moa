/**
 * Type declarations for @uiw/react-md-editor
 * @see https://github.com/uiwjs/react-md-editor
 */

declare module "@uiw/react-md-editor" {
  import { ComponentType, CSSProperties } from "react";

  export interface MDEditorProps {
    value?: string;
    onChange?: (value: string | undefined) => void;
    height?: number | string;
    preview?: "edit" | "live" | "preview";
    visibleDragbar?: boolean;
    hideToolbar?: boolean;
    enableScroll?: boolean;
    style?: CSSProperties;
    className?: string;
    textareaProps?: React.TextareaHTMLAttributes<HTMLTextAreaElement>;
    previewOptions?: Record<string, unknown>;
    commands?: unknown[];
    extraCommands?: unknown[];
  }

  const MDEditor: ComponentType<MDEditorProps>;
  export default MDEditor;
}
