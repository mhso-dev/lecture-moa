import { create } from "zustand";
import { devtools } from "zustand/middleware";

/**
 * Memo editor mode types
 * REQ-FE-781: Editor mode for memo editor (mirrors EditorWithPreview modes)
 */
export type MemoEditorMode = "write" | "preview" | "split";

interface MemoEditorState {
  editorMode: MemoEditorMode;
  isDirty: boolean;
  lastSavedAt: Date | null;
}

interface MemoEditorActions {
  setEditorMode: (mode: MemoEditorMode) => void;
  setDirty: (dirty: boolean) => void;
  setLastSaved: (date: Date | null) => void;
}

type MemoEditorStore = MemoEditorState & MemoEditorActions;

const initialState: MemoEditorState = {
  editorMode: "write",
  isDirty: false,
  lastSavedAt: null,
};

/**
 * Memo Editor Store - Manages memo editor state
 * REQ-FE-781: Memo Editor Zustand Store
 *
 * State:
 * - editorMode: Current editor view mode (write/preview/split)
 * - isDirty: Whether memo has unsaved changes
 * - lastSavedAt: Timestamp of last successful save
 *
 * Actions:
 * - setEditorMode: Switch between write, preview, or split mode
 * - setDirty: Mark memo as having unsaved changes
 * - setLastSaved: Update last saved timestamp (set to null on error)
 *
 * Editor Modes:
 * - 'write': Show markdown editor only
 * - 'preview': Show rendered preview only
 * - 'split': Show editor and preview side by side
 *
 * Usage:
 * - isDirty should be set to true on any content change
 * - isDirty should be set to false after successful save
 * - lastSavedAt is used for "Draft saved" indicator
 */
export const useMemoEditorStore = create<MemoEditorStore>()(
  devtools(
    (set) => ({
      ...initialState,

      setEditorMode: (mode) =>
        set({ editorMode: mode }, false, "memoEditor/setEditorMode"),

      setDirty: (dirty) =>
        set({ isDirty: dirty }, false, "memoEditor/setDirty"),

      setLastSaved: (date) =>
        set({ lastSavedAt: date }, false, "memoEditor/setLastSaved"),
    }),
    {
      name: "MemoEditorStore",
      enabled: process.env.NODE_ENV === "development",
    }
  )
);

// Selector hooks for common patterns
export const useMemoEditorMode = () => useMemoEditorStore((state) => state.editorMode);
export const useMemoIsDirty = () => useMemoEditorStore((state) => state.isDirty);
export const useMemoLastSavedAt = () => useMemoEditorStore((state) => state.lastSavedAt);
