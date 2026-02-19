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
  title: "View Memo | Lecture MoA",
  description: "View memo details",
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
