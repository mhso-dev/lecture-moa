/**
 * Memo Types Tests
 * REQ-FE-701: Test suite for memo type definitions
 */

import { describe, expect, it } from "vitest";

// Import types for compile-time validation
import type {
  MemoVisibility,
  Memo,
  MemoLinkTarget,
  MemoDetailResponse,
  MemoFilterParams,
  CreateMemoRequest,
  UpdateMemoRequest,
} from "./memo.types";

describe("Memo Types", () => {
  describe("MemoVisibility", () => {
    it("should have 'personal' visibility", () => {
      const visibility: MemoVisibility = "personal";
      expect(visibility).toBe("personal");
    });

    it("should have 'team' visibility", () => {
      const visibility: MemoVisibility = "team";
      expect(visibility).toBe("team");
    });
  });

  describe("Memo", () => {
    it("should define personal memo structure", () => {
      const memo: Memo = {
        id: "memo-123",
        title: "Study Notes",
        content: "Important concepts to remember",
        authorId: "user-123",
        authorName: "John Doe",
        authorAvatarUrl: "https://example.com/avatar.jpg",
        teamId: null,
        materialId: null,
        anchorId: null,
        tags: ["programming", "basics"],
        visibility: "personal",
        isDraft: false,
        createdAt: new Date("2024-01-15"),
        updatedAt: new Date("2024-01-20"),
      };
      expect(memo.id).toBe("memo-123");
      expect(memo.visibility).toBe("personal");
      expect(memo.teamId).toBeNull();
    });

    it("should define team memo structure", () => {
      const memo: Memo = {
        id: "memo-456",
        title: "Team Study Notes",
        content: "Shared notes for the team",
        authorId: "user-123",
        authorName: "Jane Doe",
        teamId: "team-123",
        materialId: "material-456",
        anchorId: "anchor-789",
        tags: ["team", "collaboration"],
        visibility: "team",
        isDraft: false,
        createdAt: new Date("2024-01-15"),
        updatedAt: new Date("2024-01-20"),
      };
      expect(memo.teamId).toBe("team-123");
      expect(memo.visibility).toBe("team");
    });

    it("should have optional authorAvatarUrl", () => {
      const memo: Memo = {
        id: "memo-789",
        title: "Quick Note",
        content: "A simple note",
        authorId: "user-123",
        authorName: "John",
        teamId: null,
        materialId: null,
        anchorId: null,
        tags: [],
        visibility: "personal",
        isDraft: true,
        createdAt: new Date("2024-01-15"),
        updatedAt: new Date("2024-01-15"),
      };
      expect(memo.authorAvatarUrl).toBeUndefined();
    });
  });

  describe("MemoLinkTarget", () => {
    it("should define link target structure", () => {
      const linkTarget: MemoLinkTarget = {
        materialId: "material-123",
        materialTitle: "Introduction to Programming",
        courseId: "course-123",
        anchorId: "anchor-456",
        anchorText: "Section 1",
      };
      expect(linkTarget.materialId).toBe("material-123");
      expect(linkTarget.materialTitle).toBe("Introduction to Programming");
      expect(linkTarget.anchorId).toBe("anchor-456");
    });
  });

  describe("MemoDetailResponse", () => {
    it("should define API response structure", () => {
      const response: MemoDetailResponse = {
        memo: {
          id: "memo-123",
          title: "Study Notes",
          content: "Content here",
          authorId: "user-123",
          authorName: "John",
          teamId: null,
          materialId: null,
          anchorId: null,
          tags: [],
          visibility: "personal",
          isDraft: false,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        linkTarget: {
          materialId: "material-123",
          materialTitle: "Material Title",
          courseId: "course-123",
          anchorId: null,
          anchorText: null,
        },
      };
      expect(response.memo).toBeDefined();
      expect(response.linkTarget?.materialId).toBe("material-123");
    });

    it("should have optional linkTarget", () => {
      const response: MemoDetailResponse = {
        memo: {
          id: "memo-123",
          title: "Standalone Note",
          content: "Content here",
          authorId: "user-123",
          authorName: "John",
          teamId: null,
          materialId: null,
          anchorId: null,
          tags: [],
          visibility: "personal",
          isDraft: false,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        linkTarget: null,
      };
      expect(response.linkTarget).toBeNull();
    });
  });

  describe("MemoFilterParams", () => {
    it("should define filter parameters", () => {
      const params: MemoFilterParams = {
        visibility: "team",
        teamId: "team-123",
        materialId: "material-456",
        tags: ["important"],
        isDraft: false,
        search: "study",
      };
      expect(params.visibility).toBe("team");
      expect(params.teamId).toBe("team-123");
    });

    it("should have all optional fields", () => {
      const params: MemoFilterParams = {};
      expect(params.visibility).toBeUndefined();
      expect(params.teamId).toBeUndefined();
    });
  });

  describe("CreateMemoRequest", () => {
    it("should define create request structure", () => {
      const request: CreateMemoRequest = {
        title: "New Memo",
        content: "Memo content",
        tags: ["tag1", "tag2"],
        materialId: "material-123",
        anchorId: "anchor-456",
        teamId: "team-123",
        visibility: "team",
      };
      expect(request.title).toBe("New Memo");
      expect(request.visibility).toBe("team");
    });

    it("should have optional fields", () => {
      const request: CreateMemoRequest = {
        title: "Simple Note",
        content: "Just content",
        visibility: "personal",
      };
      expect(request.tags).toBeUndefined();
      expect(request.teamId).toBeUndefined();
    });
  });

  describe("UpdateMemoRequest", () => {
    it("should define update request structure", () => {
      const request: UpdateMemoRequest = {
        title: "Updated Title",
        content: "Updated content",
        tags: ["new-tag"],
        visibility: "team",
      };
      expect(request.title).toBe("Updated Title");
    });

    it("should have all optional fields", () => {
      const request: UpdateMemoRequest = {};
      expect(request.title).toBeUndefined();
      expect(request.content).toBeUndefined();
    });
  });
});
