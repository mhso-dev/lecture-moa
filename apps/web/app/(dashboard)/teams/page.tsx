/**
 * Teams List Page
 * TASK-019: Team list page route
 * REQ-FE-710: Server Component wrapper with metadata
 */

import { Metadata } from "next";
import { TeamsPageClient } from "./TeamsPageClient";

export const metadata: Metadata = {
  title: "Teams | Lecture MoA",
  description: "Manage your study teams and discover new collaboration groups",
};

/**
 * Teams List Page
 * Server Component that provides metadata and initial data structure
 */
export default function TeamsPage() {
  return <TeamsPageClient />;
}
