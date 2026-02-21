/**
 * Team Types Tests
 * REQ-FE-700: Test suite for team type definitions
 */

import { describe, expect, it } from "vitest";

// Import types for compile-time validation
import type {
  Team,
  TeamMemberDetail,
  TeamActivity,
  TeamDetailResponse,
  TeamListResponse,
  TeamMemberUpdateRequest,
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
        courseId: "course-1",
        inviteCode: "abc123",
        createdBy: "user-123",
        updatedAt: new Date("2024-01-20"),
      };
      expect(team.id).toBe("team-123");
      expect(team.maxMembers).toBe(10);
      expect(team.courseId).toBe("course-1");
      expect(team.inviteCode).toBe("abc123");
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
        courseId: "course-456",
        inviteCode: null,
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
      };
      expect(memberDetail.userId).toBe("user-123");
      expect(memberDetail.teamId).toBe("team-123");
      expect(memberDetail.joinedAt).toBeInstanceOf(Date);
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
          courseId: "course-1",
          inviteCode: "xyz789",
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
            courseId: "course-1",
            inviteCode: null,
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

});
