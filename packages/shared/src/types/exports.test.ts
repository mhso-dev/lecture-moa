/**
 * Types Index Export Tests
 * REQ-FE-700, REQ-FE-701: Verify team and memo types are exported correctly
 */

import { describe, expect, it } from "vitest";

// Import from the index to verify exports
import type {
  // Team types (REQ-FE-700)
  Team,
  TeamMemberDetail,
  TeamActivity,
  TeamMemberRole,
  // Memo types (REQ-FE-701)
  Memo,
  MemoVisibility,
  MemoLinkTarget,
  CreateMemoRequest,
  UpdateMemoRequest,
} from "./index";

describe("Types Index Exports", () => {
  describe("Team Types (REQ-FE-700)", () => {
    it("should export Team type", () => {
      const team: Team = {
        id: "team-1",
        name: "Test Team",
        courseName: "Test Course",
        memberCount: 5,
        createdAt: new Date(),
        maxMembers: 10,
        courseId: "course-1",
        inviteCode: null,
        createdBy: "user-1",
        updatedAt: new Date(),
      };
      expect(team.name).toBe("Test Team");
    });

    it("should export TeamMemberDetail type", () => {
      const member: TeamMemberDetail = {
        id: "member-1",
        name: "Test Member",
        role: "member",
        lastActiveAt: new Date(),
        userId: "user-1",
        teamId: "team-1",
        joinedAt: new Date(),
      };
      expect(member.role).toBe("member");
    });

    it("should export TeamActivity type", () => {
      const activity: TeamActivity = {
        id: "activity-1",
        type: "memo_created",
        actorName: "User",
        description: "Created memo",
        createdAt: new Date(),
        teamId: "team-1",
        actorId: "user-1",
        payload: {},
      };
      expect(activity.type).toBe("memo_created");
    });

    it("should export TeamMemberRole type", () => {
      const role: TeamMemberRole = "leader";
      expect(role).toBe("leader");
    });
  });

  describe("Memo Types (REQ-FE-701)", () => {
    it("should export Memo type", () => {
      const memo: Memo = {
        id: "memo-1",
        title: "Test Memo",
        content: "Test content",
        authorId: "user-1",
        authorName: "Test Author",
        teamId: null,
        materialId: null,
        anchorId: null,
        tags: [],
        visibility: "personal",
        isDraft: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      expect(memo.title).toBe("Test Memo");
    });

    it("should export MemoVisibility type", () => {
      const visibility: MemoVisibility = "team";
      expect(visibility).toBe("team");
    });

    it("should export MemoLinkTarget type", () => {
      const linkTarget: MemoLinkTarget = {
        materialId: "material-1",
        materialTitle: "Test Material",
        courseId: "course-1",
        anchorId: null,
        anchorText: null,
      };
      expect(linkTarget.materialId).toBe("material-1");
    });

    it("should export CreateMemoRequest type", () => {
      const request: CreateMemoRequest = {
        title: "New Memo",
        content: "Content",
        visibility: "personal",
      };
      expect(request.visibility).toBe("personal");
    });

    it("should export UpdateMemoRequest type", () => {
      const request: UpdateMemoRequest = {
        title: "Updated Title",
      };
      expect(request.title).toBe("Updated Title");
    });
  });
});
