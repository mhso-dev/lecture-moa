/**
 * Team Creation Page
 * TASK-020, TASK-021: Team creation page with form and submission
 * REQ-FE-715, REQ-FE-716, REQ-FE-717, REQ-FE-718: Team creation with auth guard
 */

import { Metadata } from "next";
import { TeamCreationPageClient } from "./TeamCreationPageClient";

export const metadata: Metadata = {
  title: "Create Team | Lecture MoA",
  description: "Create a new study team for collaboration",
};

/**
 * Team Creation Page
 * Server Component that provides metadata
 */
export default function NewTeamPage() {
  return <TeamCreationPageClient />;
}
