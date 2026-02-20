/**
 * Unit Tests for Supabase Materials Query Layer
 *
 * Tests all exported functions from ~/lib/supabase/materials.ts:
 *   - toMaterial (pure)
 *   - toMaterialListItem (pure)
 *   - fetchMaterials (async, paginated)
 *   - fetchMaterial (async, single)
 *   - createMaterial (async)
 *   - updateMaterial (async)
 *   - deleteMaterial (async)
 *   - toggleMaterialStatus (async)
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  toMaterial,
  toMaterialListItem,
  fetchMaterials,
  fetchMaterial,
  createMaterial,
  updateMaterial,
  deleteMaterial,
  toggleMaterialStatus,
} from '~/lib/supabase/materials';
import type { MaterialWithAuthor } from '~/lib/supabase/materials';
import type { Database } from '~/types/supabase';

// ---------------------------------------------------------------------------
// Mock Supabase client
// ---------------------------------------------------------------------------

type MaterialRow = Database['public']['Tables']['materials']['Row'];

// Pending result for thenable resolution (used by await query)
let _pendingMaterialsResult: { data: unknown; error: unknown; count?: unknown } = {
  data: [],
  error: null,
  count: 0,
};

/**
 * Helper: set what `await query` resolves to for the materials builder.
 * Supabase query builders are thenable -- `await query` calls `.then()`.
 * This configures the result returned when the builder is awaited.
 */
function setMaterialsQueryResult(result: {
  data: unknown;
  error: unknown;
  count?: unknown;
}) {
  _pendingMaterialsResult = result;
}

// Builder per table: materials, courses, profiles.
// The materials builder is thenable via its `.then` property, which is
// invoked when the builder is `await`-ed (Supabase's PromiseLike pattern).
const mockMaterialsBuilder = {
  select: vi.fn().mockReturnThis(),
  insert: vi.fn().mockReturnThis(),
  update: vi.fn().mockReturnThis(),
  delete: vi.fn().mockReturnThis(),
  eq: vi.fn().mockReturnThis(),
  ilike: vi.fn().mockReturnThis(),
  order: vi.fn().mockReturnThis(),
  range: vi.fn().mockReturnThis(),
  single: vi.fn(),
  limit: vi.fn().mockReturnThis(),
  // Thenable: makes `await builder` work
  then(resolve: (value: unknown) => void) {
    resolve(_pendingMaterialsResult);
  },
};

const mockCoursesBuilder = {
  select: vi.fn().mockReturnThis(),
  eq: vi.fn().mockReturnThis(),
  single: vi.fn(),
};

const mockProfilesBuilder = {
  select: vi.fn().mockReturnThis(),
  eq: vi.fn().mockReturnThis(),
  single: vi.fn(),
};

const mockSupabaseClient = {
  from: vi.fn((table: string) => {
    switch (table) {
      case 'materials':
        return mockMaterialsBuilder;
      case 'courses':
        return mockCoursesBuilder;
      case 'profiles':
        return mockProfilesBuilder;
      default:
        return mockMaterialsBuilder;
    }
  }),
};

vi.mock('~/lib/supabase/client', () => ({
  createClient: vi.fn(() => mockSupabaseClient),
}));

// ---------------------------------------------------------------------------
// Test fixtures
// ---------------------------------------------------------------------------

const baseMaterialRow: MaterialRow = {
  id: 'mat-1',
  course_id: 'course-1',
  title: 'Introduction to TypeScript',
  content: '# Hello\n\nWelcome to the course.',
  excerpt: 'A brief introduction',
  status: 'published',
  position: 1,
  tags: ['typescript', 'basics'],
  read_time_minutes: 5,
  version: 1,
  created_at: '2024-06-01T10:00:00Z',
  updated_at: '2024-06-02T12:00:00Z',
};

const defaultAuthor: { id: string; name: string; avatarUrl: string | null } = {
  id: 'instructor-1',
  name: 'Jane Doe',
  avatarUrl: 'https://example.com/avatar.png',
};

const baseMaterialWithAuthor: MaterialWithAuthor = {
  ...baseMaterialRow,
  author: defaultAuthor,
};

/**
 * Helper: configure fetchCourseAuthor mocks to return the default author.
 * This sets up courses and profiles builders for a successful author lookup.
 */
function setupAuthorMocks(
  author = defaultAuthor,
  instructorId = 'instructor-1',
) {
  mockCoursesBuilder.single.mockResolvedValue({
    data: { instructor_id: instructorId },
    error: null,
  });
  mockProfilesBuilder.single.mockResolvedValue({
    data: {
      id: author.id,
      display_name: author.name,
      avatar_url: author.avatarUrl,
    },
    error: null,
  });
}

// ---------------------------------------------------------------------------
// Reset all mocks before each test
// ---------------------------------------------------------------------------

beforeEach(() => {
  vi.clearAllMocks();

  // Reset chainable methods to return this
  for (const method of [
    'select',
    'insert',
    'update',
    'delete',
    'eq',
    'ilike',
    'order',
    'range',
    'limit',
  ] as const) {
    mockMaterialsBuilder[method].mockReturnThis();
  }
  for (const method of ['select', 'eq'] as const) {
    mockCoursesBuilder[method].mockReturnThis();
    mockProfilesBuilder[method].mockReturnThis();
  }
});

// ===========================================================================
// toMaterial
// ===========================================================================

describe('toMaterial', () => {
  it('should map all fields from snake_case row to camelCase Material', () => {
    const result = toMaterial(baseMaterialWithAuthor);

    expect(result).toEqual({
      id: 'mat-1',
      courseId: 'course-1',
      title: 'Introduction to TypeScript',
      content: '# Hello\n\nWelcome to the course.',
      excerpt: 'A brief introduction',
      status: 'published',
      position: 1,
      tags: ['typescript', 'basics'],
      readTimeMinutes: 5,
      authorId: 'instructor-1',
      author: {
        id: 'instructor-1',
        name: 'Jane Doe',
        avatarUrl: 'https://example.com/avatar.png',
      },
      qaCount: 0,
      createdAt: '2024-06-01T10:00:00Z',
      updatedAt: '2024-06-02T12:00:00Z',
    });
  });

  it('should default excerpt to empty string when null', () => {
    const row: MaterialWithAuthor = {
      ...baseMaterialWithAuthor,
      excerpt: null,
    };

    const result = toMaterial(row);
    expect(result.excerpt).toBe('');
  });

  it('should default readTimeMinutes to 0 when null', () => {
    const row: MaterialWithAuthor = {
      ...baseMaterialWithAuthor,
      read_time_minutes: null,
    };

    const result = toMaterial(row);
    expect(result.readTimeMinutes).toBe(0);
  });

  it('should always set qaCount to 0', () => {
    const result = toMaterial(baseMaterialWithAuthor);
    expect(result.qaCount).toBe(0);
  });

  it('should map author fields correctly', () => {
    const result = toMaterial(baseMaterialWithAuthor);

    expect(result.authorId).toBe('instructor-1');
    expect(result.author).toEqual({
      id: 'instructor-1',
      name: 'Jane Doe',
      avatarUrl: 'https://example.com/avatar.png',
    });
  });

  it('should handle author with null avatarUrl', () => {
    const row: MaterialWithAuthor = {
      ...baseMaterialWithAuthor,
      author: { id: 'a-1', name: 'No Avatar', avatarUrl: null },
    };

    const result = toMaterial(row);
    expect(result.author.avatarUrl).toBeNull();
  });
});

// ===========================================================================
// toMaterialListItem
// ===========================================================================

describe('toMaterialListItem', () => {
  it('should not include content property', () => {
    const result = toMaterialListItem(baseMaterialWithAuthor);

    expect(result).not.toHaveProperty('content');
  });

  it('should include all other fields from toMaterial', () => {
    const result = toMaterialListItem(baseMaterialWithAuthor);

    expect(result.id).toBe('mat-1');
    expect(result.courseId).toBe('course-1');
    expect(result.title).toBe('Introduction to TypeScript');
    expect(result.excerpt).toBe('A brief introduction');
    expect(result.status).toBe('published');
    expect(result.position).toBe(1);
    expect(result.tags).toEqual(['typescript', 'basics']);
    expect(result.readTimeMinutes).toBe(5);
    expect(result.authorId).toBe('instructor-1');
    expect(result.author).toEqual(defaultAuthor);
    expect(result.qaCount).toBe(0);
    expect(result.createdAt).toBe('2024-06-01T10:00:00Z');
    expect(result.updatedAt).toBe('2024-06-02T12:00:00Z');
  });

  it('should apply same defaults as toMaterial (null excerpt, null read_time_minutes)', () => {
    const row: MaterialWithAuthor = {
      ...baseMaterialWithAuthor,
      excerpt: null,
      read_time_minutes: null,
    };

    const result = toMaterialListItem(row);
    expect(result.excerpt).toBe('');
    expect(result.readTimeMinutes).toBe(0);
  });
});

// ===========================================================================
// fetchMaterials
// ===========================================================================

describe('fetchMaterials', () => {
  it('should fetch materials with default pagination (page 1, limit 20)', async () => {
    setMaterialsQueryResult({
      data: [baseMaterialRow],
      error: null,
      count: 1,
    });
    setupAuthorMocks();

    const result = await fetchMaterials('course-1');

    expect(mockSupabaseClient.from).toHaveBeenCalledWith('materials');
    expect(mockMaterialsBuilder.select).toHaveBeenCalledWith('*', {
      count: 'exact',
    });
    expect(mockMaterialsBuilder.eq).toHaveBeenCalledWith(
      'course_id',
      'course-1',
    );
    expect(mockMaterialsBuilder.order).toHaveBeenCalledWith('position', {
      ascending: true,
    });
    // Default: page 1, limit 20 -> range(0, 19)
    expect(mockMaterialsBuilder.range).toHaveBeenCalledWith(0, 19);

    expect(result.data).toHaveLength(1);
    expect(result.count).toBe(1);
    expect(result.data[0]!.author).toEqual(defaultAuthor);
  });

  it('should apply status filter when provided', async () => {
    setMaterialsQueryResult({ data: [], error: null, count: 0 });
    setupAuthorMocks();

    await fetchMaterials('course-1', { status: 'draft' });

    // eq is called for course_id and then for status
    expect(mockMaterialsBuilder.eq).toHaveBeenCalledWith(
      'course_id',
      'course-1',
    );
    expect(mockMaterialsBuilder.eq).toHaveBeenCalledWith('status', 'draft');
  });

  it('should apply search filter with ilike when provided', async () => {
    setMaterialsQueryResult({ data: [], error: null, count: 0 });
    setupAuthorMocks();

    await fetchMaterials('course-1', { search: 'intro' });

    expect(mockMaterialsBuilder.ilike).toHaveBeenCalledWith(
      'title',
      '%intro%',
    );
  });

  it('should handle custom pagination (page 3, limit 5)', async () => {
    setMaterialsQueryResult({ data: [], error: null, count: 0 });
    setupAuthorMocks();

    await fetchMaterials('course-1', { page: 3, limit: 5 });

    // offset = (3 - 1) * 5 = 10, range(10, 14)
    expect(mockMaterialsBuilder.range).toHaveBeenCalledWith(10, 14);
  });

  it('should enrich rows with author info from fetchCourseAuthor', async () => {
    const customAuthor = {
      id: 'prof-99',
      name: 'Professor X',
      avatarUrl: null,
    };

    setMaterialsQueryResult({
      data: [baseMaterialRow, { ...baseMaterialRow, id: 'mat-2' }],
      error: null,
      count: 2,
    });
    setupAuthorMocks(customAuthor, 'prof-99');

    const result = await fetchMaterials('course-1');

    expect(result.data).toHaveLength(2);
    expect(result.data[0]!.author).toEqual(customAuthor);
    expect(result.data[1]!.author).toEqual(customAuthor);
  });

  it('should throw error when query fails', async () => {
    setMaterialsQueryResult({
      data: null,
      error: { message: 'Connection refused' },
      count: null,
    });

    await expect(fetchMaterials('course-1')).rejects.toThrow(
      'Failed to fetch materials: Connection refused',
    );
  });

  it('should return empty data and count 0 for no results', async () => {
    setMaterialsQueryResult({ data: [], error: null, count: 0 });
    setupAuthorMocks();

    const result = await fetchMaterials('course-1');

    expect(result.data).toEqual([]);
    expect(result.count).toBe(0);
  });

  it('should default count to 0 when count is null', async () => {
    setMaterialsQueryResult({ data: [], error: null, count: null });
    setupAuthorMocks();

    const result = await fetchMaterials('course-1');
    expect(result.count).toBe(0);
  });

  it('should apply both status and search filters together', async () => {
    setMaterialsQueryResult({ data: [], error: null, count: 0 });
    setupAuthorMocks();

    await fetchMaterials('course-1', {
      status: 'published',
      search: 'advanced',
    });

    expect(mockMaterialsBuilder.eq).toHaveBeenCalledWith(
      'status',
      'published',
    );
    expect(mockMaterialsBuilder.ilike).toHaveBeenCalledWith(
      'title',
      '%advanced%',
    );
  });
});

// ===========================================================================
// fetchMaterial
// ===========================================================================

describe('fetchMaterial', () => {
  it('should fetch a single material by courseId and materialId', async () => {
    mockMaterialsBuilder.single.mockResolvedValue({
      data: baseMaterialRow,
      error: null,
    });
    setupAuthorMocks();

    const result = await fetchMaterial('course-1', 'mat-1');

    expect(mockMaterialsBuilder.eq).toHaveBeenCalledWith('id', 'mat-1');
    expect(mockMaterialsBuilder.eq).toHaveBeenCalledWith(
      'course_id',
      'course-1',
    );
    expect(result.id).toBe('mat-1');
    expect(result.author).toEqual(defaultAuthor);
  });

  it('should throw error when material not found', async () => {
    mockMaterialsBuilder.single.mockResolvedValue({
      data: null,
      error: { message: 'Row not found' },
    });

    await expect(fetchMaterial('course-1', 'nonexistent')).rejects.toThrow(
      'Failed to fetch material: Row not found',
    );
  });

  it('should use fallback author when course lookup fails', async () => {
    mockMaterialsBuilder.single.mockResolvedValue({
      data: baseMaterialRow,
      error: null,
    });
    // Course lookup fails
    mockCoursesBuilder.single.mockResolvedValue({
      data: null,
      error: { message: 'Course not found' },
    });

    const result = await fetchMaterial('course-1', 'mat-1');

    expect(result.author).toEqual({
      id: '',
      name: 'Unknown',
      avatarUrl: null,
    });
  });

  it('should use partial fallback author when profile lookup fails', async () => {
    mockMaterialsBuilder.single.mockResolvedValue({
      data: baseMaterialRow,
      error: null,
    });
    // Course lookup succeeds
    mockCoursesBuilder.single.mockResolvedValue({
      data: { instructor_id: 'instructor-1' },
      error: null,
    });
    // Profile lookup fails
    mockProfilesBuilder.single.mockResolvedValue({
      data: null,
      error: { message: 'Profile not found' },
    });

    const result = await fetchMaterial('course-1', 'mat-1');

    expect(result.author).toEqual({
      id: 'instructor-1',
      name: 'Unknown',
      avatarUrl: null,
    });
  });
});

// ===========================================================================
// createMaterial
// ===========================================================================

describe('createMaterial', () => {
  const insertData = {
    course_id: 'course-1',
    title: 'New Material',
    content: 'Some content here',
  };

  it('should auto-calculate next position from existing materials', async () => {
    // Position query result (resolved via thenable): last position is 5
    setMaterialsQueryResult({
      data: [{ position: 5 }],
      error: null,
    });
    // Insert result (resolved via .single())
    mockMaterialsBuilder.single.mockResolvedValue({
      data: {
        ...baseMaterialRow,
        id: 'mat-new',
        title: 'New Material',
        position: 6,
      },
      error: null,
    });
    setupAuthorMocks();

    const result = await createMaterial(insertData);

    expect(mockMaterialsBuilder.insert).toHaveBeenCalledWith(
      expect.objectContaining({ position: 6 }),
    );
    expect(result.id).toBe('mat-new');
    expect(result.author).toEqual(defaultAuthor);
  });

  it('should use provided position when data.position is specified', async () => {
    // Position query: last position is 5
    setMaterialsQueryResult({
      data: [{ position: 5 }],
      error: null,
    });
    mockMaterialsBuilder.single.mockResolvedValue({
      data: {
        ...baseMaterialRow,
        id: 'mat-new',
        position: 3,
      },
      error: null,
    });
    setupAuthorMocks();

    await createMaterial({ ...insertData, position: 3 });

    // data.position ?? nextPosition -> 3 ?? 6 = 3
    expect(mockMaterialsBuilder.insert).toHaveBeenCalledWith(
      expect.objectContaining({ position: 3 }),
    );
  });

  it('should default to position 1 when no existing materials', async () => {
    // Position query: empty array
    setMaterialsQueryResult({ data: [], error: null });
    mockMaterialsBuilder.single.mockResolvedValue({
      data: {
        ...baseMaterialRow,
        id: 'mat-first',
        position: 1,
      },
      error: null,
    });
    setupAuthorMocks();

    await createMaterial(insertData);

    // existing.at(0)?.position ?? 0 = 0, nextPosition = 1
    expect(mockMaterialsBuilder.insert).toHaveBeenCalledWith(
      expect.objectContaining({ position: 1 }),
    );
  });

  it('should throw error when position query fails', async () => {
    setMaterialsQueryResult({
      data: null,
      error: { message: 'Position query failed' },
    });

    await expect(createMaterial(insertData)).rejects.toThrow(
      'Failed to determine material position: Position query failed',
    );
  });

  it('should throw error when insert fails', async () => {
    // Position query succeeds
    setMaterialsQueryResult({ data: [{ position: 1 }], error: null });
    // Insert fails
    mockMaterialsBuilder.single.mockResolvedValue({
      data: null,
      error: { message: 'Unique constraint violation' },
    });

    await expect(createMaterial(insertData)).rejects.toThrow(
      'Failed to create material: Unique constraint violation',
    );
  });

  it('should enrich created material with author info', async () => {
    const customAuthor = {
      id: 'prof-42',
      name: 'Dr. Smith',
      avatarUrl: 'https://example.com/smith.png',
    };

    setMaterialsQueryResult({ data: [], error: null });
    mockMaterialsBuilder.single.mockResolvedValue({
      data: { ...baseMaterialRow, id: 'mat-new' },
      error: null,
    });
    setupAuthorMocks(customAuthor, 'prof-42');

    const result = await createMaterial(insertData);
    expect(result.author).toEqual(customAuthor);
  });
});

// ===========================================================================
// updateMaterial
// ===========================================================================

describe('updateMaterial', () => {
  it('should update material and return with author info', async () => {
    mockMaterialsBuilder.single.mockResolvedValue({
      data: {
        ...baseMaterialRow,
        title: 'Updated Title',
        updated_at: '2024-07-01T00:00:00Z',
      },
      error: null,
    });
    setupAuthorMocks();

    const result = await updateMaterial('mat-1', { title: 'Updated Title' });

    expect(mockMaterialsBuilder.update).toHaveBeenCalledWith(
      expect.objectContaining({
        title: 'Updated Title',
        updated_at: expect.any(String),
      }),
    );
    expect(mockMaterialsBuilder.eq).toHaveBeenCalledWith('id', 'mat-1');
    expect(result.title).toBe('Updated Title');
    expect(result.author).toEqual(defaultAuthor);
  });

  it('should automatically set updated_at timestamp', async () => {
    const beforeCall = new Date().toISOString();

    mockMaterialsBuilder.single.mockResolvedValue({
      data: baseMaterialRow,
      error: null,
    });
    setupAuthorMocks();

    await updateMaterial('mat-1', { title: 'Test' });

    const callArgs = mockMaterialsBuilder.update.mock.calls[0]![0];
    expect(callArgs.updated_at).toBeDefined();
    // The updated_at should be a valid ISO string close to now
    const updatedAt = new Date(callArgs.updated_at);
    expect(updatedAt.getTime()).toBeGreaterThanOrEqual(
      new Date(beforeCall).getTime() - 1000,
    );
  });

  it('should handle partial update with only tags', async () => {
    mockMaterialsBuilder.single.mockResolvedValue({
      data: { ...baseMaterialRow, tags: ['new-tag'] },
      error: null,
    });
    setupAuthorMocks();

    const result = await updateMaterial('mat-1', { tags: ['new-tag'] });

    expect(mockMaterialsBuilder.update).toHaveBeenCalledWith(
      expect.objectContaining({ tags: ['new-tag'] }),
    );
    expect(result.tags).toEqual(['new-tag']);
  });

  it('should throw error when update fails', async () => {
    mockMaterialsBuilder.single.mockResolvedValue({
      data: null,
      error: { message: 'Material not found' },
    });

    await expect(
      updateMaterial('nonexistent', { title: 'Updated' }),
    ).rejects.toThrow('Failed to update material: Material not found');
  });
});

// ===========================================================================
// deleteMaterial
// ===========================================================================

describe('deleteMaterial', () => {
  it('should delete material by ID and return void', async () => {
    setMaterialsQueryResult({ data: null, error: null });

    await expect(deleteMaterial('mat-1')).resolves.toBeUndefined();

    expect(mockSupabaseClient.from).toHaveBeenCalledWith('materials');
    expect(mockMaterialsBuilder.delete).toHaveBeenCalled();
    expect(mockMaterialsBuilder.eq).toHaveBeenCalledWith('id', 'mat-1');
  });

  it('should throw error when delete fails', async () => {
    setMaterialsQueryResult({
      data: null,
      error: { message: 'Foreign key constraint' },
    });

    await expect(deleteMaterial('mat-1')).rejects.toThrow(
      'Failed to delete material: Foreign key constraint',
    );
  });
});

// ===========================================================================
// toggleMaterialStatus
// ===========================================================================

describe('toggleMaterialStatus', () => {
  it('should toggle draft to published', async () => {
    // First call: fetch current status
    mockMaterialsBuilder.single
      .mockResolvedValueOnce({
        data: { status: 'draft', course_id: 'course-1' },
        error: null,
      })
      // Second call: update returns new state
      .mockResolvedValueOnce({
        data: {
          ...baseMaterialRow,
          status: 'published',
          updated_at: '2024-07-01T00:00:00Z',
        },
        error: null,
      });
    setupAuthorMocks();

    const result = await toggleMaterialStatus('mat-1');

    expect(mockMaterialsBuilder.update).toHaveBeenCalledWith(
      expect.objectContaining({ status: 'published' }),
    );
    expect(result.status).toBe('published');
    expect(result.author).toEqual(defaultAuthor);
  });

  it('should toggle published to draft', async () => {
    mockMaterialsBuilder.single
      .mockResolvedValueOnce({
        data: { status: 'published', course_id: 'course-1' },
        error: null,
      })
      .mockResolvedValueOnce({
        data: {
          ...baseMaterialRow,
          status: 'draft',
        },
        error: null,
      });
    setupAuthorMocks();

    const result = await toggleMaterialStatus('mat-1');

    expect(mockMaterialsBuilder.update).toHaveBeenCalledWith(
      expect.objectContaining({ status: 'draft' }),
    );
    expect(result.status).toBe('draft');
  });

  it('should set updated_at when toggling status', async () => {
    mockMaterialsBuilder.single
      .mockResolvedValueOnce({
        data: { status: 'draft', course_id: 'course-1' },
        error: null,
      })
      .mockResolvedValueOnce({
        data: baseMaterialRow,
        error: null,
      });
    setupAuthorMocks();

    await toggleMaterialStatus('mat-1');

    expect(mockMaterialsBuilder.update).toHaveBeenCalledWith(
      expect.objectContaining({
        updated_at: expect.any(String),
      }),
    );
  });

  it('should throw error when fetching current status fails', async () => {
    mockMaterialsBuilder.single.mockResolvedValueOnce({
      data: null,
      error: { message: 'Material not found' },
    });

    await expect(toggleMaterialStatus('nonexistent')).rejects.toThrow(
      'Failed to fetch material status: Material not found',
    );
  });

  it('should throw error when update fails', async () => {
    // Fetch current status succeeds
    mockMaterialsBuilder.single
      .mockResolvedValueOnce({
        data: { status: 'draft', course_id: 'course-1' },
        error: null,
      })
      // Update fails
      .mockResolvedValueOnce({
        data: null,
        error: { message: 'Permission denied' },
      });

    await expect(toggleMaterialStatus('mat-1')).rejects.toThrow(
      'Failed to toggle material status: Permission denied',
    );
  });

  it('should enrich toggled material with author info', async () => {
    const customAuthor = {
      id: 'author-77',
      name: 'Dr. Toggle',
      avatarUrl: null,
    };

    mockMaterialsBuilder.single
      .mockResolvedValueOnce({
        data: { status: 'draft', course_id: 'course-1' },
        error: null,
      })
      .mockResolvedValueOnce({
        data: { ...baseMaterialRow, status: 'published' },
        error: null,
      });
    setupAuthorMocks(customAuthor, 'author-77');

    const result = await toggleMaterialStatus('mat-1');
    expect(result.author).toEqual(customAuthor);
  });
});
