/**
 * Memo View Page
 * REQ-FE-770, REQ-FE-771, REQ-FE-772: Read-only memo view
 *
 * Features:
 * - Renders memo title, author info, tags, linked material, full content
 * - Uses MarkdownRenderer from components/markdown/
 * - "Edit" button for author
 * - "Back" breadcrumb to /memos
 * - Copy link button
 * - Tag chips: clickable, navigates to /memos?tags={tag}
 */

import { Metadata } from "next";
import { MemoView } from "./_components/MemoView";

export const metadata: Metadata = {
  title: "메모 보기 | Lecture MoA",
  description: "메모 상세 보기",
};

/**
 * Memo View Page
 * REQ-FE-770: Route at /memos/{id}
 *
 * Server Component wrapper for memo view
 */
export default function MemoViewPage() {
  return <MemoView />;
}
