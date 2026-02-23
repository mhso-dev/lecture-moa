/**
 * Team Creation Page
 * TASK-020, TASK-021: Team creation page with form and submission
 * REQ-FE-715, REQ-FE-716, REQ-FE-717, REQ-FE-718: Team creation with auth guard
 */

import { Metadata } from "next";
import { TeamCreationPageClient } from "./TeamCreationPageClient";

export const metadata: Metadata = {
  title: "팀 만들기 | Lecture MoA",
  description: "협업을 위한 새로운 스터디 팀을 만드세요",
};

/**
 * Team Creation Page
 * Server Component that provides metadata
 */
export default function NewTeamPage() {
  return <TeamCreationPageClient />;
}
