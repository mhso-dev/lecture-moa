/**
 * Edit Memo Page
 * REQ-FE-760: Edit existing memo at /memos/{id}/edit
 *
 * Features:
 * - Same as New Memo page but with initial values
 * - Draft restoration for existing memo
 * - Update via useUpdateMemo mutation
 * - Success: stay on editor with toast
 */

import { Metadata } from "next";
import { EditMemoEditor } from "./_components/EditMemoEditor";

export const metadata: Metadata = {
  title: "메모 편집 | Lecture MoA",
  description: "개인 학습 메모를 편집하세요",
};

/**
 * Edit Memo Page
 * REQ-FE-760: Route at /memos/{id}/edit
 *
 * Server Component wrapper for memo editor
 */
export default function EditMemoPage() {
  return <EditMemoEditor />;
}
