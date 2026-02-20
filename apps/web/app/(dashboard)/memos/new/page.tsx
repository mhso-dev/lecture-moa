/**
 * New Memo Page
 * REQ-FE-760: Create new personal memo at /memos/new
 *
 * Features:
 * - Uses MemoEditorWrapper component
 * - Auto-save via useAutoSaveDraft
 * - DraftRestoreBanner for draft recovery
 * - useBeforeUnload for unsaved changes guard
 * - Save/Publish via useCreateMemo mutation
 * - Ctrl+S keyboard shortcut wired to save action
 * - Success: redirect to /memos/{memoId}
 */

import { Metadata } from "next";
import { NewMemoEditor } from "./_components/NewMemoEditor";

export const metadata: Metadata = {
  title: "New Memo | Lecture MoA",
  description: "Create a new personal study memo",
};

/**
 * New Memo Page
 * REQ-FE-760: Route at /memos/new
 *
 * Server Component wrapper for memo editor
 */
export default function NewMemoPage() {
  return <NewMemoEditor />;
}
