/**
 * Team Types Tests
 * REQ-FE-700: Test suite for team type definitions
 */

import { describe, expect, it } from "vitest";

// Import types for compile-time validation
import type {
  Team,
  TeamMemberDetail,
  TeamInvitation,
  TeamActivity,
  TeamDetailResponse,
  TeamListResponse,
  TeamMemberUpdateRequest,
  TeamInviteRequest,
  TeamMemberRole,
} from "./team.types";

describe("Team Types", () => {
  describe("TeamMemberRole", () => {
    it("should have 'leader' role", () => {
      const role: TeamMemberRole = "leader";
      expect(role).toBe("leader");
    });

    it("should have 'member' role", () => {
      const role: TeamMemberRole = "member";
      expect(role).toBe("member");
    });
  });

  describe("Team", () => {
    it("should extend TeamOverview with additional fields", () => {
      const team: Team = {
        // From TeamOverview
        id: "team-123",
        name: "Study Group Alpha",
        courseName: "Introduction to Programming",
        memberCount: 5,
        description: "A study group for beginners",
        createdAt: new Date("2024-01-15"),
        // Additional Team fields
        maxMembers: 10,
        courseIds: ["course-1", "course-2"],
        createdBy: "user-123",
        updatedAt: new Date("2024-01-20"),
      };
      expect(team.id).toBe("team-123");
      expect(team.maxMembers).toBe(10);
      expect(team.courseIds).toHaveLength(2);
      expect(team.createdBy).toBe("user-123");
    });

    it("should have optional description", () => {
      const team: Team = {
        id: "team-456",
        name: "Quick Study",
        courseName: "Math 101",
        memberCount: 3,
        createdAt: new Date("2024-01-15"),
        maxMembers: 5,
        courseIds: [],
        createdBy: "user-456",
        updatedAt: new Date("2024-01-15"),
      };
      expect(team.description).toBeUndefined();
    });
  });

  describe("TeamMemberDetail", () => {
    it("should extend TeamMember with additional fields", () => {
      const memberDetail: TeamMemberDetail = {
        // From TeamMember
        id: "member-123",
        name: "John Doe",
        avatarUrl: "https://example.com/avatar.jpg",
        role: "member",
        lastActiveAt: new Date("2024-01-20"),
        // Additional TeamMemberDetail fields
        userId: "user-123",
        teamId: "team-123",
        joinedAt: new Date("2024-01-15"),
        email: "john.doe@example.com",
      };
      expect(memberDetail.userId).toBe("user-123");
      expect(memberDetail.teamId).toBe("team-123");
      expect(memberDetail.joinedAt).toBeInstanceOf(Date);
      expect(memberDetail.email).toBe("john.doe@example.com");
    });
  });

  describe("TeamInvitation", () => {
    it("should define invitation structure", () => {
      const invitation: TeamInvitation = {
        id: "invite-123",
        teamId: "team-123",
        email: "invited@example.com",
        status: "pending",
        invitedBy: "user-123",
        createdAt: new Date("2024-01-20"),
      };
      expect(invitation.id).toBe("invite-123");
      expect(invitation.status).toBe("pending");
    });
  });

  describe("TeamActivity", () => {
    it("should extend TeamActivityItem with additional fields", () => {
      const activity: TeamActivity = {
        // From TeamActivityItem
        id: "activity-123",
        type: "memo_created",
        actorName: "Jane Doe",
        description: "Created a new shared memo",
        createdAt: new Date("2024-01-20"),
        // Additional TeamActivity fields
        teamId: "team-123",
        actorId: "user-456",
        payload: { memoId: "memo-789" },
      };
      expect(activity.teamId).toBe("team-123");
      expect(activity.actorId).toBe("user-456");
      expect(activity.payload).toEqual({ memoId: "memo-789" });
    });
  });

  describe("TeamDetailResponse", () => {
    it("should define API response structure", () => {
      const response: TeamDetailResponse = {
        team: {
          id: "team-123",
          name: "Study Group",
          courseName: "Course",
          memberCount: 5,
          createdAt: new Date(),
          maxMembers: 10,
          courseIds: ["course-1"],
          createdBy: "user-1",
          updatedAt: new Date(),
        },
        members: [
          {
            id: "member-1",
            name: "John",
            role: "leader",
            lastActiveAt: new Date(),
            userId: "user-1",
            teamId: "team-123",
            joinedAt: new Date(),
            email: "john@example.com",
          },
        ],
      };
      expect(response.team).toBeDefined();
      expect(response.members).toHaveLength(1);
    });
  });

  describe("TeamListResponse", () => {
    it("should define paginated list response", () => {
      const response: TeamListResponse = {
        teams: [
          {
            id: "team-1",
            name: "Team A",
            courseName: "Course",
            memberCount: 5,
            createdAt: new Date(),
            maxMembers: 10,
            courseIds: ["course-1"],
            createdBy: "user-1",
            updatedAt: new Date(),
          },
        ],
        pagination: {
          page: 1,
          limit: 10,
          total: 25,
          totalPages: 3,
        },
      };
      expect(response.teams).toHaveLength(1);
      expect(response.pagination.total).toBe(25);
    });
  });

  describe("TeamMemberUpdateRequest", () => {
    it("should define member update request structure", () => {
      const request: TeamMemberUpdateRequest = {
        role: "leader",
      };
      expect(request.role).toBe("leader");
    });
  });

  describe("TeamInviteRequest", () => {
    it("should define invite request structure", () => {
      const request: TeamInviteRequest = {
        email: "invited@example.com",
      };
      expect(request.email).toBe("invited@example.com");
    });
  });
});
