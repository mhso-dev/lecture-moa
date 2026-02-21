/**
 * Realtime Constants Tests
 * REQ-BE-006-030: Test suite for Supabase Realtime constants
 */

import { describe, expect, it } from "vitest";

import {
  REALTIME_CHANNELS,
  REALTIME_EVENTS,
  REALTIME_CONFIG,
} from "./realtime";

describe("Realtime Constants", () => {
  describe("REALTIME_CHANNELS", () => {
    it("should generate team memos channel name with teamId", () => {
      const channel = REALTIME_CHANNELS.TEAM_MEMOS("team-123");
      expect(channel).toBe("team-memos:team-123");
    });

    it("should generate personal memos channel name with userId", () => {
      const channel = REALTIME_CHANNELS.PERSONAL_MEMOS("user-456");
      expect(channel).toBe("personal-memos:user-456");
    });
  });

  describe("REALTIME_EVENTS", () => {
    it("should define INSERT event", () => {
      expect(REALTIME_EVENTS.INSERT).toBe("INSERT");
    });

    it("should define UPDATE event", () => {
      expect(REALTIME_EVENTS.UPDATE).toBe("UPDATE");
    });

    it("should define DELETE event", () => {
      expect(REALTIME_EVENTS.DELETE).toBe("DELETE");
    });
  });

  describe("REALTIME_CONFIG", () => {
    it("should define schema as public", () => {
      expect(REALTIME_CONFIG.SCHEMA).toBe("public");
    });

    it("should define table as memos", () => {
      expect(REALTIME_CONFIG.TABLE).toBe("memos");
    });

    it("should define reconnect interval in milliseconds", () => {
      expect(REALTIME_CONFIG.RECONNECT_INTERVAL_MS).toBe(3000);
    });

    it("should define maximum reconnect attempts", () => {
      expect(REALTIME_CONFIG.MAX_RECONNECT_ATTEMPTS).toBe(5);
    });
  });
});
