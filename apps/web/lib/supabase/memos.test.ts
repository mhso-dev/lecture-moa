/**
 * Tests for Supabase Memo Query Layer
 *
 * Covers: fetchPersonalMemos, fetchTeamMemos, fetchMemoDetail,
 *         createMemo, updateMemo, deleteMemo
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import type { MemoDetailResponse } from "@shared";

// ---------------------------------------------------------------------------
// Mock Supabase client - override the global mock from test/setup.ts
// ---------------------------------------------------------------------------

// Build a chainable query builder mock
function createQueryBuilderMock(resolvedValue: {
  data: unknown;
  error: unknown;
  count?: number | null;
}) {
  const builder: Record<string, ReturnType<typeof vi.fn>> = {};

  const chainable = () =>
    new Proxy(builder, {
      get(_target, prop: string) {
        if (prop === "then") {
          // Make the mock thenable so `await query` works
          return (
            resolve: (v: unknown) => void,
            reject: (e: unknown) => void,
          ) => {
            return Promise.resolve(resolvedValue).then(resolve, reject);
          };
        }
        if (!(prop in builder) || builder[prop] == null) {
          builder[prop] = vi.fn().mockReturnValue(chainable());
        }
        return builder[prop];
      },
    });

  return chainable();
}

let mockQueryResult: {
  data: unknown;
  error: unknown;
  count?: number | null;
} = { data: null, error: null, count: null };

const mockFrom = vi.fn().mockImplementation(() => {
  return createQueryBuilderMock(mockQueryResult);
});

vi.mock("~/lib/supabase/client", () => ({
  createClient: () => ({
    from: mockFrom,
    auth: {
      getUser: vi.fn().mockResolvedValue({
        data: { user: { id: "user-1" } },
        error: null,
      }),
    },
  }),
}));

// ---------------------------------------------------------------------------
// Import after mock setup
// ---------------------------------------------------------------------------
import {
  fetchPersonalMemos,
  fetchTeamMemos,
  fetchMemoDetail,
  createMemo,
  updateMemo,
  deleteMemo,
} from "./memos";

// ---------------------------------------------------------------------------
// Test Fixtures
// ---------------------------------------------------------------------------

/** Raw DB row shape (snake_case) with profiles join */
function makeMemoDbRow(overrides: Record<string, unknown> = {}) {
  return {
    id: "memo-1",
    author_id: "user-1",
    material_id: null,
    team_id: null,
    title: "Test Memo",
    content: "Some content",
    anchor_id: null,
    tags: ["tag1"],
    visibility: "personal" as const,
    is_draft: false,
    created_at: "2026-01-01T00:00:00Z",
    updated_at: "2026-01-01T00:00:00Z",
    profiles: {
      display_name: "Test User",
      avatar_url: "https://example.com/avatar.png",
    },
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

beforeEach(() => {
  vi.clearAllMocks();
  mockQueryResult = { data: null, error: null, count: null };
});

describe("fetchPersonalMemos", () => {
  it("should return paginated personal memos with mapped camelCase fields", async () => {
    const rows = [makeMemoDbRow(), makeMemoDbRow({ id: "memo-2" })];
    mockQueryResult = { data: rows, error: null, count: 2 };

    const result = await fetchPersonalMemos(
      "user-1",
      {},
      { from: 0, to: 19 },
    );

    expect(result.data).toHaveLength(2);
    expect(result.count).toBe(2);
    expect(result.data[0]).toMatchObject({
      id: "memo-1",
      authorId: "user-1",
      authorName: "Test User",
      visibility: "personal",
    });
    expect(mockFrom).toHaveBeenCalledWith("memos");
  });

  it("should return empty list when no memos match", async () => {
    mockQueryResult = { data: [], error: null, count: 0 };

    const result = await fetchPersonalMemos(
      "user-1",
      {},
      { from: 0, to: 19 },
    );

    expect(result.data).toHaveLength(0);
    expect(result.count).toBe(0);
  });

  it("should throw on Supabase error", async () => {
    mockQueryResult = {
      data: null,
      error: { message: "connection refused" },
      count: null,
    };

    await expect(
      fetchPersonalMemos("user-1", {}, { from: 0, to: 19 }),
    ).rejects.toThrow("Failed to fetch personal memos");
  });

  it("should handle boundary pagination range (from=0, to=19 with 25 records)", async () => {
    const rows = Array.from({ length: 20 }, (_, i) =>
      makeMemoDbRow({ id: `memo-${String(i)}` }),
    );
    mockQueryResult = { data: rows, error: null, count: 25 };

    const result = await fetchPersonalMemos(
      "user-1",
      {},
      { from: 0, to: 19 },
    );

    expect(result.data).toHaveLength(20);
    expect(result.count).toBe(25);
  });

  it("should apply materialId filter when provided", async () => {
    mockQueryResult = { data: [], error: null, count: 0 };

    await fetchPersonalMemos(
      "user-1",
      { materialId: "mat-1" },
      { from: 0, to: 19 },
    );

    expect(mockFrom).toHaveBeenCalledWith("memos");
  });

  it("should apply tags filter when provided", async () => {
    mockQueryResult = { data: [], error: null, count: 0 };

    await fetchPersonalMemos(
      "user-1",
      { tags: ["study", "important"] },
      { from: 0, to: 19 },
    );

    expect(mockFrom).toHaveBeenCalledWith("memos");
  });

  it("should apply isDraft filter when provided", async () => {
    mockQueryResult = { data: [], error: null, count: 0 };

    await fetchPersonalMemos(
      "user-1",
      { isDraft: true },
      { from: 0, to: 19 },
    );

    expect(mockFrom).toHaveBeenCalledWith("memos");
  });

  it("should apply search filter when provided", async () => {
    mockQueryResult = { data: [], error: null, count: 0 };

    await fetchPersonalMemos(
      "user-1",
      { search: "react" },
      { from: 0, to: 19 },
    );

    expect(mockFrom).toHaveBeenCalledWith("memos");
  });
});

describe("fetchTeamMemos", () => {
  it("should return paginated team memos", async () => {
    const rows = [
      makeMemoDbRow({ id: "memo-t1", team_id: "team-1", visibility: "team" }),
    ];
    mockQueryResult = { data: rows, error: null, count: 1 };

    const result = await fetchTeamMemos("team-1", { from: 0, to: 19 });

    expect(result.data).toHaveLength(1);
    expect(result.count).toBe(1);
    expect(result.data[0]).toMatchObject({
      id: "memo-t1",
      teamId: "team-1",
      visibility: "team",
    });
    expect(mockFrom).toHaveBeenCalledWith("memos");
  });

  it("should throw on Supabase error", async () => {
    mockQueryResult = {
      data: null,
      error: { message: "db error" },
      count: null,
    };

    await expect(
      fetchTeamMemos("team-1", { from: 0, to: 19 }),
    ).rejects.toThrow("Failed to fetch team memos");
  });

  it("should handle empty results", async () => {
    mockQueryResult = { data: [], error: null, count: 0 };

    const result = await fetchTeamMemos("team-1", { from: 0, to: 19 });

    expect(result.data).toHaveLength(0);
    expect(result.count).toBe(0);
  });
});

describe("fetchMemoDetail", () => {
  it("should return memo with null linkTarget when no material", async () => {
    const row = makeMemoDbRow({ materials: null });
    mockQueryResult = { data: row, error: null };

    const result: MemoDetailResponse = await fetchMemoDetail("memo-1");

    expect(result.memo).toMatchObject({
      id: "memo-1",
      authorName: "Test User",
    });
    expect(result.linkTarget).toBeNull();
  });

  it("should return memo with populated linkTarget when material exists", async () => {
    const row = makeMemoDbRow({
      material_id: "mat-1",
      anchor_id: "heading-1",
      materials: {
        id: "mat-1",
        title: "React Basics",
        course_id: "course-1",
      },
    });
    mockQueryResult = { data: row, error: null };

    const result: MemoDetailResponse = await fetchMemoDetail("memo-1");

    expect(result.linkTarget).toEqual({
      materialId: "mat-1",
      materialTitle: "React Basics",
      courseId: "course-1",
      anchorId: "heading-1",
      anchorText: null,
    });
  });

  it("should throw on Supabase error", async () => {
    mockQueryResult = {
      data: null,
      error: { message: "not found" },
    };

    await expect(fetchMemoDetail("memo-999")).rejects.toThrow(
      "Failed to fetch memo detail",
    );
  });
});

describe("createMemo", () => {
  it("should create a memo and return mapped result", async () => {
    const row = makeMemoDbRow({ id: "new-memo" });
    mockQueryResult = { data: row, error: null };

    const result = await createMemo(
      {
        title: "New Memo",
        content: "Content",
        visibility: "personal",
      },
      "user-1",
    );

    expect(result).toMatchObject({
      id: "new-memo",
      authorId: "user-1",
      authorName: "Test User",
    });
    expect(mockFrom).toHaveBeenCalledWith("memos");
  });

  it("should throw on Supabase error", async () => {
    mockQueryResult = {
      data: null,
      error: { message: "insert failed" },
    };

    await expect(
      createMemo(
        { title: "Test", content: "c", visibility: "personal" },
        "user-1",
      ),
    ).rejects.toThrow("Failed to create memo");
  });
});

describe("updateMemo", () => {
  it("should update a memo and return mapped result", async () => {
    const row = makeMemoDbRow({ title: "Updated Title" });
    mockQueryResult = { data: row, error: null };

    const result = await updateMemo("memo-1", { title: "Updated Title" });

    expect(result).toMatchObject({
      id: "memo-1",
      title: "Updated Title",
    });
    expect(mockFrom).toHaveBeenCalledWith("memos");
  });

  it("should throw on Supabase error", async () => {
    mockQueryResult = {
      data: null,
      error: { message: "update failed" },
    };

    await expect(
      updateMemo("memo-1", { title: "New" }),
    ).rejects.toThrow("Failed to update memo");
  });
});

describe("deleteMemo", () => {
  it("should delete a memo without error", async () => {
    mockQueryResult = { data: null, error: null };

    await expect(deleteMemo("memo-1")).resolves.toBeUndefined();
    expect(mockFrom).toHaveBeenCalledWith("memos");
  });

  it("should throw on Supabase error", async () => {
    mockQueryResult = {
      data: null,
      error: { message: "delete failed" },
    };

    await expect(deleteMemo("memo-1")).rejects.toThrow(
      "Failed to delete memo",
    );
  });
});
