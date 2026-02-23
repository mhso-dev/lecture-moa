/**
 * Personal Memo List Page
 * REQ-FE-750, REQ-FE-752, REQ-FE-753: Personal memo list with filters and sorting
 *
 * Features:
 * - Server Component wrapper with metadata
 * - Client Component for interactive list
 * - Two-column layout on Desktop (filter sidebar + memo list)
 * - One-column on Mobile (filter bar collapses to sheet)
 * - Filter controls (search, course, material, tags, visibility)
 * - Sort controls (Newest, Oldest, Last modified, Title A-Z)
 * - Empty states with contextual messages
 */

import { Metadata } from "next";
import { PersonalMemoList } from "./_components/PersonalMemoList";

export const metadata: Metadata = {
  title: "내 메모 | Lecture MoA",
  description: "개인 학습 메모와 노트를 관리하세요",
};

/**
 * Personal Memo List Page
 * REQ-FE-750: Route at /memos
 *
 * Server Component wrapper that provides metadata
 * and renders the interactive client component
 */
export default function MemosPage() {
  return <PersonalMemoList />;
}
