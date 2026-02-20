/**
 * Events Constants Tests
 * REQ-FE-704: Test suite for WebSocket event constants
 */

import { describe, expect, it } from "vitest";

import { EVENTS, EVENT_CATEGORIES } from "./events";

describe("Events Constants", () => {
  describe("EVENTS", () => {
    it("should have team memo events", () => {
      expect(EVENTS.TEAM_MEMO_CREATED).toBe("team_memo:created");
      expect(EVENTS.TEAM_MEMO_UPDATED).toBe("team_memo:updated");
      expect(EVENTS.TEAM_MEMO_DELETED).toBe("team_memo:deleted");
    });

    it("should have team member events", () => {
      expect(EVENTS.TEAM_MEMBER_JOINED).toBe("team:member_joined");
      expect(EVENTS.TEAM_MEMBER_LEFT).toBe("team:member_left");
    });

    it("should use namespace:action pattern for events", () => {
      // Verify team memo events follow the pattern
      expect(EVENTS.TEAM_MEMO_CREATED).toMatch(/^[a-z_]+:[a-z_]+$/);
      expect(EVENTS.TEAM_MEMO_UPDATED).toMatch(/^[a-z_]+:[a-z_]+$/);
      expect(EVENTS.TEAM_MEMO_DELETED).toMatch(/^[a-z_]+:[a-z_]+$/);

      // Verify team member events follow the pattern
      expect(EVENTS.TEAM_MEMBER_JOINED).toMatch(/^[a-z_]+:[a-z_]+$/);
      expect(EVENTS.TEAM_MEMBER_LEFT).toMatch(/^[a-z_]+:[a-z_]+$/);
    });

    it("should preserve existing events", () => {
      expect(EVENTS.AUTH_LOGIN).toBe("auth:login");
      expect(EVENTS.COURSE_CREATED).toBe("course:created");
      expect(EVENTS.MATERIAL_UPDATED).toBe("material:updated");
      expect(EVENTS.QUIZ_STARTED).toBe("quiz:started");
      expect(EVENTS.QA_QUESTION_POSTED).toBe("qa:question_posted");
      expect(EVENTS.NOTIFICATION_NEW).toBe("notification:new");
      expect(EVENTS.USER_ONLINE).toBe("user:online");
    });
  });

  describe("EVENT_CATEGORIES", () => {
    it("should have TEAM category", () => {
      expect(EVENT_CATEGORIES.TEAM).toBe("team");
    });

    it("should have MEMO category", () => {
      expect(EVENT_CATEGORIES.MEMO).toBe("memo");
    });

    it("should preserve existing categories", () => {
      expect(EVENT_CATEGORIES.AUTH).toBe("auth");
      expect(EVENT_CATEGORIES.COURSE).toBe("course");
      expect(EVENT_CATEGORIES.MATERIAL).toBe("material");
      expect(EVENT_CATEGORIES.QUIZ).toBe("quiz");
      expect(EVENT_CATEGORIES.QA).toBe("qa");
      expect(EVENT_CATEGORIES.NOTIFICATION).toBe("notification");
      expect(EVENT_CATEGORIES.PRESENCE).toBe("presence");
    });
  });
});
