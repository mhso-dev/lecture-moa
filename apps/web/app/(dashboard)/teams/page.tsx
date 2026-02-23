/**
 * Teams List Page
 * TASK-019: Team list page route
 * REQ-FE-710: Server Component wrapper with metadata
 */

import { Metadata } from "next";
import { TeamsPageClient } from "./TeamsPageClient";

export const metadata: Metadata = {
  title: "팀 | Lecture MoA",
  description: "스터디 팀을 관리하고 새로운 협업 그룹을 찾아보세요",
};

/**
 * Teams List Page
 * Server Component that provides metadata and initial data structure
 */
export default function TeamsPage() {
  return <TeamsPageClient />;
}
