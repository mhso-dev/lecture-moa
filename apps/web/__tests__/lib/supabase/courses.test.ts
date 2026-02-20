/**
 * Supabase Courses Query Layer - Unit Tests
 *
 * Tests all 13 exported functions from ~/lib/supabase/courses.ts
 * using chainable Supabase client mocks.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

// ---------------------------------------------------------------------------
// Chainable Supabase mock setup
// ---------------------------------------------------------------------------

function createMockQueryBuilder() {
  const builder = {
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
  };
  return builder;
}

const mockCoursesBuilder = createMockQueryBuilder();
const mockEnrollmentsBuilder = createMockQueryBuilder();
const mockMaterialsBuilder = createMockQueryBuilder();

const mockAuth = {
  getUser: vi.fn(),
};

const mockSupabaseClient = {
  from: vi.fn((table: string) => {
    switch (table) {
      case 'courses':
        return mockCoursesBuilder;
      case 'course_enrollments':
        return mockEnrollmentsBuilder;
      case 'materials':
        return mockMaterialsBuilder;
      default:
        return createMockQueryBuilder();
    }
  }),
  auth: mockAuth,
};

vi.mock('~/lib/supabase/client', () => ({
  createClient: vi.fn(() => mockSupabaseClient),
}));

// Import after mock setup
import {
  fetchCourses,
  fetchCourse,
  createCourse,
  updateCourse,
  deleteCourse,
  archiveCourse,
  enrollInCourse,
  enrollWithCode,
  generateInviteCode,
  fetchCourseStudents,
  fetchCourseProgress,
  removeStudent,
} from '../../../lib/supabase/courses';

// ---------------------------------------------------------------------------
// Test Fixtures
// ---------------------------------------------------------------------------

const MOCK_COURSE_ROW = {
  id: 'course-1',
  instructor_id: 'instructor-1',
  title: 'TypeScript Fundamentals',
  description: 'Learn TypeScript',
  cover_image_url: 'https://example.com/thumb.jpg',
  category: 'programming' as const,
  status: 'published' as const,
  visibility: 'public' as const,
  invite_code: 'ABC123',
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-15T00:00:00Z',
};

const MOCK_PROFILE = {
  id: 'instructor-1',
  role: 'instructor' as const,
  display_name: 'John Doe',
  avatar_url: 'https://example.com/avatar.jpg',
  bio: 'Expert instructor',
  created_at: '2023-01-01T00:00:00Z',
  updated_at: '2023-06-01T00:00:00Z',
};

const MOCK_USER = { id: 'user-1', email: 'user@test.com' };

const MOCK_ENROLLMENT_ROW = {
  id: 'enrollment-1',
  course_id: 'course-1',
  student_id: 'user-1',
  enrolled_at: '2024-02-01T00:00:00Z',
  status: 'active' as const,
  progress_percent: 50,
};

// ---------------------------------------------------------------------------
// Helper: reset all mocks between tests
// ---------------------------------------------------------------------------

function resetBuilderMocks(builder: Record<string, ReturnType<typeof vi.fn>>) {
  Object.values(builder).forEach((fn) => {
    fn.mockReset();
    // Restore chainable behavior for non-terminal methods
    if (fn !== builder.single) {
      fn.mockReturnThis();
    }
  });
}

beforeEach(() => {
  vi.clearAllMocks();
  resetBuilderMocks(mockCoursesBuilder);
  resetBuilderMocks(mockEnrollmentsBuilder);
  resetBuilderMocks(mockMaterialsBuilder);
  mockAuth.getUser.mockReset();
  mockSupabaseClient.from.mockImplementation((table: string) => {
    switch (table) {
      case 'courses':
        return mockCoursesBuilder;
      case 'course_enrollments':
        return mockEnrollmentsBuilder;
      case 'materials':
        return mockMaterialsBuilder;
      default:
        return createMockQueryBuilder();
    }
  });
});

// ===========================================================================
// 1. fetchCourses
// ===========================================================================

describe('fetchCourses', () => {
  it('should fetch with default params (page 1, limit 20)', async () => {
    const mockData = [
      { ...MOCK_COURSE_ROW, instructor: MOCK_PROFILE },
    ];
    mockCoursesBuilder.range.mockResolvedValue({
      data: mockData,
      error: null,
      count: 1,
    });

    const result = await fetchCourses();

    expect(mockSupabaseClient.from).toHaveBeenCalledWith('courses');
    expect(mockCoursesBuilder.select).toHaveBeenCalledWith(
      '*, instructor:profiles!courses_instructor_id_fkey(*)',
      { count: 'exact' }
    );
    expect(mockCoursesBuilder.order).toHaveBeenCalledWith('created_at', { ascending: false });
    expect(mockCoursesBuilder.range).toHaveBeenCalledWith(0, 19);
    expect(result.page).toBe(1);
    expect(result.limit).toBe(20);
    expect(result.total).toBe(1);
    expect(result.data).toHaveLength(1);
    expect(result.data[0]!.id).toBe('course-1');
  });

  it('should apply search filter with ilike', async () => {
    mockCoursesBuilder.range.mockResolvedValue({
      data: [],
      error: null,
      count: 0,
    });

    await fetchCourses({ search: 'typescript' });

    expect(mockCoursesBuilder.ilike).toHaveBeenCalledWith('title', '%typescript%');
  });

  it('should apply category filter', async () => {
    mockCoursesBuilder.range.mockResolvedValue({
      data: [],
      error: null,
      count: 0,
    });

    await fetchCourses({ category: 'programming' });

    expect(mockCoursesBuilder.eq).toHaveBeenCalledWith('category', 'programming');
  });

  it('should apply status filter', async () => {
    mockCoursesBuilder.range.mockResolvedValue({
      data: [],
      error: null,
      count: 0,
    });

    await fetchCourses({ status: 'published' });

    expect(mockCoursesBuilder.eq).toHaveBeenCalledWith('status', 'published');
  });

  it('should sort by popular (created_at desc)', async () => {
    mockCoursesBuilder.range.mockResolvedValue({
      data: [],
      error: null,
      count: 0,
    });

    await fetchCourses({ sort: 'popular' });

    expect(mockCoursesBuilder.order).toHaveBeenCalledWith('created_at', { ascending: false });
  });

  it('should sort alphabetically by title', async () => {
    mockCoursesBuilder.range.mockResolvedValue({
      data: [],
      error: null,
      count: 0,
    });

    await fetchCourses({ sort: 'alphabetical' });

    expect(mockCoursesBuilder.order).toHaveBeenCalledWith('title', { ascending: true });
  });

  it('should sort by recent (default)', async () => {
    mockCoursesBuilder.range.mockResolvedValue({
      data: [],
      error: null,
      count: 0,
    });

    await fetchCourses({ sort: 'recent' });

    expect(mockCoursesBuilder.order).toHaveBeenCalledWith('created_at', { ascending: false });
  });

  it('should calculate correct pagination range for page 3, limit 10', async () => {
    mockCoursesBuilder.range.mockResolvedValue({
      data: [],
      error: null,
      count: 50,
    });

    const result = await fetchCourses({ page: 3, limit: 10 });

    // from = (3-1)*10 = 20, to = 20+10-1 = 29
    expect(mockCoursesBuilder.range).toHaveBeenCalledWith(20, 29);
    expect(result.page).toBe(3);
    expect(result.limit).toBe(10);
    expect(result.total).toBe(50);
  });

  it('should return empty data array when no results', async () => {
    mockCoursesBuilder.range.mockResolvedValue({
      data: [],
      error: null,
      count: 0,
    });

    const result = await fetchCourses();

    expect(result.data).toEqual([]);
    expect(result.total).toBe(0);
  });

  it('should throw error on query failure', async () => {
    mockCoursesBuilder.range.mockResolvedValue({
      data: null,
      error: { message: 'connection refused' },
      count: null,
    });

    await expect(fetchCourses()).rejects.toThrow(
      'Failed to fetch courses: connection refused'
    );
  });

  it('should map instructor from profile data', async () => {
    mockCoursesBuilder.range.mockResolvedValue({
      data: [{ ...MOCK_COURSE_ROW, instructor: MOCK_PROFILE }],
      error: null,
      count: 1,
    });

    const result = await fetchCourses();

    expect(result.data[0]!.instructor).toEqual({
      id: 'instructor-1',
      name: 'John Doe',
      avatarUrl: 'https://example.com/avatar.jpg',
    });
  });

  it('should fallback to Unknown instructor when profile is null', async () => {
    mockCoursesBuilder.range.mockResolvedValue({
      data: [{ ...MOCK_COURSE_ROW, instructor: null }],
      error: null,
      count: 1,
    });

    const result = await fetchCourses();

    expect(result.data[0]!.instructor).toEqual({
      id: 'instructor-1',
      name: 'Unknown',
    });
  });

  it('should default total to 0 when count is null', async () => {
    mockCoursesBuilder.range.mockResolvedValue({
      data: [],
      error: null,
      count: null,
    });

    const result = await fetchCourses();

    expect(result.total).toBe(0);
  });

  it('should map thumbnailUrl from cover_image_url', async () => {
    mockCoursesBuilder.range.mockResolvedValue({
      data: [{ ...MOCK_COURSE_ROW, instructor: MOCK_PROFILE }],
      error: null,
      count: 1,
    });

    const result = await fetchCourses();

    expect(result.data[0]!.thumbnailUrl).toBe('https://example.com/thumb.jpg');
  });

  it('should set thumbnailUrl to undefined when cover_image_url is null', async () => {
    mockCoursesBuilder.range.mockResolvedValue({
      data: [
        { ...MOCK_COURSE_ROW, cover_image_url: null, instructor: MOCK_PROFILE },
      ],
      error: null,
      count: 1,
    });

    const result = await fetchCourses();

    expect(result.data[0]!.thumbnailUrl).toBeUndefined();
  });
});

// ===========================================================================
// 2. fetchCourse
// ===========================================================================

describe('fetchCourse', () => {
  // Helper: for fetchCourse sub-queries that chain .select().eq().eq()
  // The first .eq() must return the builder (chainable), and the second .eq() resolves.
  function setupFetchCourseSubQueries(enrolledCount: number | null, materialCount: number | null) {
    // course_enrollments: .select().eq("course_id",...).eq("status","active")
    mockEnrollmentsBuilder.eq
      .mockReturnValueOnce(mockEnrollmentsBuilder) // first .eq() chains
      .mockResolvedValueOnce({ count: enrolledCount, error: null }); // second .eq() resolves
    // materials: .select().eq("course_id",...)  -- only one .eq(), terminal
    mockMaterialsBuilder.eq.mockResolvedValueOnce({ count: materialCount, error: null });
  }

  it('should fetch a single course with full detail', async () => {
    mockCoursesBuilder.single.mockResolvedValue({
      data: { ...MOCK_COURSE_ROW, instructor: MOCK_PROFILE },
      error: null,
    });
    setupFetchCourseSubQueries(25, 10);

    const result = await fetchCourse('course-1');

    expect(mockSupabaseClient.from).toHaveBeenCalledWith('courses');
    expect(mockCoursesBuilder.eq).toHaveBeenCalledWith('id', 'course-1');
    expect(result.id).toBe('course-1');
    expect(result.title).toBe('TypeScript Fundamentals');
    expect(result.enrolledCount).toBe(25);
    expect(result.materialCount).toBe(10);
    expect(result.inviteCode).toBe('ABC123');
    expect(result.syllabus).toEqual([]);
  });

  it('should fallback to Unknown instructor when profile is null', async () => {
    mockCoursesBuilder.single.mockResolvedValue({
      data: { ...MOCK_COURSE_ROW, instructor: null },
      error: null,
    });
    setupFetchCourseSubQueries(0, 0);

    const result = await fetchCourse('course-1');

    expect(result.instructor).toEqual({
      id: 'instructor-1',
      name: 'Unknown',
    });
  });

  it('should default enrolledCount and materialCount to 0 when count is null', async () => {
    mockCoursesBuilder.single.mockResolvedValue({
      data: { ...MOCK_COURSE_ROW, instructor: MOCK_PROFILE },
      error: null,
    });
    setupFetchCourseSubQueries(null, null);

    const result = await fetchCourse('course-1');

    expect(result.enrolledCount).toBe(0);
    expect(result.materialCount).toBe(0);
  });

  it('should throw error when course query fails', async () => {
    mockCoursesBuilder.single.mockResolvedValue({
      data: null,
      error: { message: 'not found' },
    });

    await expect(fetchCourse('missing-id')).rejects.toThrow(
      'Failed to fetch course: not found'
    );
  });

  it('should set inviteCode to undefined when invite_code is null', async () => {
    mockCoursesBuilder.single.mockResolvedValue({
      data: { ...MOCK_COURSE_ROW, invite_code: null, instructor: MOCK_PROFILE },
      error: null,
    });
    setupFetchCourseSubQueries(0, 0);

    const result = await fetchCourse('course-1');

    expect(result.inviteCode).toBeUndefined();
  });
});

// ===========================================================================
// 3. createCourse
// ===========================================================================

describe('createCourse', () => {
  const payload = {
    title: 'New Course',
    description: 'Course description',
    category: 'programming' as const,
    visibility: 'public' as const,
    thumbnailUrl: 'https://example.com/img.jpg',
  };

  it('should create a course with authenticated user', async () => {
    mockAuth.getUser.mockResolvedValue({
      data: { user: MOCK_USER },
      error: null,
    });
    mockCoursesBuilder.single.mockResolvedValue({
      data: {
        ...MOCK_COURSE_ROW,
        title: payload.title,
        description: payload.description,
        instructor: MOCK_PROFILE,
      },
      error: null,
    });

    const result = await createCourse(payload);

    expect(mockAuth.getUser).toHaveBeenCalled();
    expect(mockCoursesBuilder.insert).toHaveBeenCalledWith(
      expect.objectContaining({
        instructor_id: 'user-1',
        title: 'New Course',
        description: 'Course description',
        category: 'programming',
        cover_image_url: 'https://example.com/img.jpg',
        visibility: 'public',
        status: 'draft',
      })
    );
    expect(result.title).toBe('New Course');
  });

  it('should throw error when user is not authenticated', async () => {
    mockAuth.getUser.mockResolvedValue({
      data: { user: null },
      error: { message: 'not logged in' },
    });

    await expect(createCourse(payload)).rejects.toThrow(
      'Authentication required to create a course'
    );
  });

  it('should throw error when user is null (no auth error)', async () => {
    mockAuth.getUser.mockResolvedValue({
      data: { user: null },
      error: null,
    });

    await expect(createCourse(payload)).rejects.toThrow(
      'Authentication required to create a course'
    );
  });

  it('should throw error on insert failure', async () => {
    mockAuth.getUser.mockResolvedValue({
      data: { user: MOCK_USER },
      error: null,
    });
    mockCoursesBuilder.single.mockResolvedValue({
      data: null,
      error: { message: 'duplicate key' },
    });

    await expect(createCourse(payload)).rejects.toThrow(
      'Failed to create course: duplicate key'
    );
  });

  it('should map thumbnailUrl to cover_image_url as null when not provided', async () => {
    mockAuth.getUser.mockResolvedValue({
      data: { user: MOCK_USER },
      error: null,
    });
    mockCoursesBuilder.single.mockResolvedValue({
      data: { ...MOCK_COURSE_ROW, instructor: MOCK_PROFILE },
      error: null,
    });

    const payloadNoThumb = { ...payload };
    delete (payloadNoThumb as Partial<typeof payload>).thumbnailUrl;

    await createCourse(payloadNoThumb);

    expect(mockCoursesBuilder.insert).toHaveBeenCalledWith(
      expect.objectContaining({
        cover_image_url: null,
      })
    );
  });
});

// ===========================================================================
// 4. updateCourse
// ===========================================================================

describe('updateCourse', () => {
  it('should update only provided fields (partial update)', async () => {
    mockCoursesBuilder.single.mockResolvedValue({
      data: {
        ...MOCK_COURSE_ROW,
        title: 'Updated Title',
        instructor: MOCK_PROFILE,
      },
      error: null,
    });

    const result = await updateCourse('course-1', { title: 'Updated Title' });

    expect(mockCoursesBuilder.update).toHaveBeenCalledWith({ title: 'Updated Title' });
    expect(mockCoursesBuilder.eq).toHaveBeenCalledWith('id', 'course-1');
    expect(result.title).toBe('Updated Title');
  });

  it('should update all fields when fully provided', async () => {
    const fullPayload = {
      title: 'Full Update',
      description: 'New desc',
      category: 'design' as const,
      thumbnailUrl: 'https://example.com/new.jpg',
      visibility: 'invite_only' as const,
      status: 'archived' as const,
    };

    mockCoursesBuilder.single.mockResolvedValue({
      data: { ...MOCK_COURSE_ROW, instructor: MOCK_PROFILE },
      error: null,
    });

    await updateCourse('course-1', fullPayload);

    expect(mockCoursesBuilder.update).toHaveBeenCalledWith({
      title: 'Full Update',
      description: 'New desc',
      category: 'design',
      cover_image_url: 'https://example.com/new.jpg',
      visibility: 'invite_only',
      status: 'archived',
    });
  });

  it('should map thumbnailUrl to cover_image_url', async () => {
    mockCoursesBuilder.single.mockResolvedValue({
      data: { ...MOCK_COURSE_ROW, instructor: MOCK_PROFILE },
      error: null,
    });

    await updateCourse('course-1', { thumbnailUrl: 'https://example.com/thumb2.jpg' });

    expect(mockCoursesBuilder.update).toHaveBeenCalledWith({
      cover_image_url: 'https://example.com/thumb2.jpg',
    });
  });

  it('should throw error on update failure', async () => {
    mockCoursesBuilder.single.mockResolvedValue({
      data: null,
      error: { message: 'row not found' },
    });

    await expect(updateCourse('missing', { title: 'X' })).rejects.toThrow(
      'Failed to update course: row not found'
    );
  });

  it('should not include undefined fields in update payload', async () => {
    mockCoursesBuilder.single.mockResolvedValue({
      data: { ...MOCK_COURSE_ROW, instructor: MOCK_PROFILE },
      error: null,
    });

    await updateCourse('course-1', { title: 'Only Title' });

    const updateArg = mockCoursesBuilder.update.mock.calls[0]![0];
    expect(updateArg).toEqual({ title: 'Only Title' });
    expect(updateArg).not.toHaveProperty('description');
    expect(updateArg).not.toHaveProperty('category');
    expect(updateArg).not.toHaveProperty('cover_image_url');
  });
});

// ===========================================================================
// 5. deleteCourse
// ===========================================================================

describe('deleteCourse', () => {
  it('should delete a course by ID', async () => {
    mockCoursesBuilder.eq.mockResolvedValue({ error: null });

    await deleteCourse('course-1');

    expect(mockSupabaseClient.from).toHaveBeenCalledWith('courses');
    expect(mockCoursesBuilder.delete).toHaveBeenCalled();
    expect(mockCoursesBuilder.eq).toHaveBeenCalledWith('id', 'course-1');
  });

  it('should throw error on delete failure', async () => {
    mockCoursesBuilder.eq.mockResolvedValue({
      error: { message: 'permission denied' },
    });

    await expect(deleteCourse('course-1')).rejects.toThrow(
      'Failed to delete course: permission denied'
    );
  });
});

// ===========================================================================
// 6. archiveCourse
// ===========================================================================

describe('archiveCourse', () => {
  it('should archive by delegating to updateCourse with status archived', async () => {
    mockCoursesBuilder.single.mockResolvedValue({
      data: {
        ...MOCK_COURSE_ROW,
        status: 'archived',
        instructor: MOCK_PROFILE,
      },
      error: null,
    });

    const result = await archiveCourse('course-1');

    expect(mockCoursesBuilder.update).toHaveBeenCalledWith({ status: 'archived' });
    expect(result.status).toBe('archived');
  });
});

// ===========================================================================
// 7. enrollInCourse
// ===========================================================================

describe('enrollInCourse', () => {
  it('should enroll authenticated user in a course', async () => {
    mockAuth.getUser.mockResolvedValue({
      data: { user: MOCK_USER },
      error: null,
    });
    mockEnrollmentsBuilder.single.mockResolvedValue({
      data: MOCK_ENROLLMENT_ROW,
      error: null,
    });

    const result = await enrollInCourse('course-1');

    expect(mockAuth.getUser).toHaveBeenCalled();
    expect(mockEnrollmentsBuilder.insert).toHaveBeenCalledWith({
      course_id: 'course-1',
      student_id: 'user-1',
      status: 'active',
    });
    expect(result).toEqual(MOCK_ENROLLMENT_ROW);
  });

  it('should throw error when not authenticated', async () => {
    mockAuth.getUser.mockResolvedValue({
      data: { user: null },
      error: { message: 'no session' },
    });

    await expect(enrollInCourse('course-1')).rejects.toThrow(
      'Authentication required to enroll in a course'
    );
  });

  it('should throw error when user is null without auth error', async () => {
    mockAuth.getUser.mockResolvedValue({
      data: { user: null },
      error: null,
    });

    await expect(enrollInCourse('course-1')).rejects.toThrow(
      'Authentication required to enroll in a course'
    );
  });

  it('should throw error on enrollment insert failure', async () => {
    mockAuth.getUser.mockResolvedValue({
      data: { user: MOCK_USER },
      error: null,
    });
    mockEnrollmentsBuilder.single.mockResolvedValue({
      data: null,
      error: { message: 'already enrolled' },
    });

    await expect(enrollInCourse('course-1')).rejects.toThrow(
      'Failed to enroll in course: already enrolled'
    );
  });
});

// ===========================================================================
// 8. enrollWithCode
// ===========================================================================

describe('enrollWithCode', () => {
  it('should find course by invite code and enroll', async () => {
    mockAuth.getUser.mockResolvedValue({
      data: { user: MOCK_USER },
      error: null,
    });
    // First .from('courses') call to look up course by invite code
    mockCoursesBuilder.single.mockResolvedValue({
      data: { id: 'course-1' },
      error: null,
    });
    // Second .from('course_enrollments') call to insert enrollment
    mockEnrollmentsBuilder.single.mockResolvedValue({
      data: MOCK_ENROLLMENT_ROW,
      error: null,
    });

    const result = await enrollWithCode('abc123');

    expect(mockCoursesBuilder.eq).toHaveBeenCalledWith('invite_code', 'ABC123');
    expect(mockEnrollmentsBuilder.insert).toHaveBeenCalledWith({
      course_id: 'course-1',
      student_id: 'user-1',
      status: 'active',
    });
    expect(result).toEqual(MOCK_ENROLLMENT_ROW);
  });

  it('should throw error for invalid invite code', async () => {
    mockAuth.getUser.mockResolvedValue({
      data: { user: MOCK_USER },
      error: null,
    });
    mockCoursesBuilder.single.mockResolvedValue({
      data: null,
      error: { message: 'no rows found' },
    });

    await expect(enrollWithCode('INVALID')).rejects.toThrow(
      'Invalid or expired invite code'
    );
  });

  it('should throw error when not authenticated', async () => {
    mockAuth.getUser.mockResolvedValue({
      data: { user: null },
      error: { message: 'not authenticated' },
    });

    await expect(enrollWithCode('ABC123')).rejects.toThrow(
      'Authentication required to enroll with invite code'
    );
  });

  it('should throw error on enrollment insert failure after valid code', async () => {
    mockAuth.getUser.mockResolvedValue({
      data: { user: MOCK_USER },
      error: null,
    });
    mockCoursesBuilder.single.mockResolvedValue({
      data: { id: 'course-1' },
      error: null,
    });
    mockEnrollmentsBuilder.single.mockResolvedValue({
      data: null,
      error: { message: 'duplicate enrollment' },
    });

    await expect(enrollWithCode('ABC123')).rejects.toThrow(
      'Failed to enroll with invite code: duplicate enrollment'
    );
  });

  it('should uppercase the invite code before lookup', async () => {
    mockAuth.getUser.mockResolvedValue({
      data: { user: MOCK_USER },
      error: null,
    });
    mockCoursesBuilder.single.mockResolvedValue({
      data: { id: 'course-1' },
      error: null,
    });
    mockEnrollmentsBuilder.single.mockResolvedValue({
      data: MOCK_ENROLLMENT_ROW,
      error: null,
    });

    await enrollWithCode('xyz789');

    expect(mockCoursesBuilder.eq).toHaveBeenCalledWith('invite_code', 'XYZ789');
  });
});

// ===========================================================================
// 9. generateInviteCode
// ===========================================================================

describe('generateInviteCode', () => {
  it('should generate and persist a random code', async () => {
    mockCoursesBuilder.eq.mockResolvedValue({ error: null });

    const result = await generateInviteCode('course-1');

    expect(mockSupabaseClient.from).toHaveBeenCalledWith('courses');
    expect(mockCoursesBuilder.update).toHaveBeenCalledWith(
      expect.objectContaining({
        invite_code: expect.any(String),
      })
    );
    expect(mockCoursesBuilder.eq).toHaveBeenCalledWith('id', 'course-1');
    expect(result.code).toBeDefined();
    expect(result.code).toHaveLength(6);
    expect(result.code).toMatch(/^[A-Z0-9]{6}$/);
  });

  it('should throw error on update failure', async () => {
    mockCoursesBuilder.eq.mockResolvedValue({
      error: { message: 'update failed' },
    });

    await expect(generateInviteCode('course-1')).rejects.toThrow(
      'Failed to generate invite code: update failed'
    );
  });
});

// ===========================================================================
// 10. fetchCourseStudents
// ===========================================================================

describe('fetchCourseStudents', () => {
  // fetchCourseStudents chains .select().eq("course_id",...).eq("status","active")
  // First .eq() must return builder, second .eq() resolves to data.
  function setupStudentQuery(resolvedValue: unknown) {
    mockEnrollmentsBuilder.eq
      .mockReturnValueOnce(mockEnrollmentsBuilder) // first .eq() chains
      .mockResolvedValueOnce(resolvedValue); // second .eq() resolves
  }

  it('should fetch students with profile data', async () => {
    setupStudentQuery({
      data: [
        {
          student_id: 'student-1',
          enrolled_at: '2024-02-01T00:00:00Z',
          progress_percent: 75,
          student: {
            display_name: 'Alice',
            avatar_url: 'https://example.com/alice.jpg',
          },
        },
        {
          student_id: 'student-2',
          enrolled_at: '2024-02-05T00:00:00Z',
          progress_percent: 30,
          student: {
            display_name: 'Bob',
            avatar_url: null,
          },
        },
      ],
      error: null,
    });

    const result = await fetchCourseStudents('course-1');

    expect(mockSupabaseClient.from).toHaveBeenCalledWith('course_enrollments');
    expect(result).toHaveLength(2);
    expect(result[0]).toEqual({
      userId: 'student-1',
      name: 'Alice',
      avatarUrl: 'https://example.com/alice.jpg',
      enrolledAt: '2024-02-01T00:00:00Z',
      progressPercent: 75,
    });
    expect(result[1]!.avatarUrl).toBeUndefined();
  });

  it('should fallback name to Unknown Student when profile is null', async () => {
    setupStudentQuery({
      data: [
        {
          student_id: 'student-3',
          enrolled_at: '2024-03-01T00:00:00Z',
          progress_percent: 0,
          student: null,
        },
      ],
      error: null,
    });

    const result = await fetchCourseStudents('course-1');

    expect(result[0]!.name).toBe('Unknown Student');
    expect(result[0]!.avatarUrl).toBeUndefined();
  });

  it('should return empty list when no students enrolled', async () => {
    setupStudentQuery({
      data: [],
      error: null,
    });

    const result = await fetchCourseStudents('course-1');

    expect(result).toEqual([]);
  });

  it('should throw error on query failure', async () => {
    setupStudentQuery({
      data: null,
      error: { message: 'table not found' },
    });

    await expect(fetchCourseStudents('course-1')).rejects.toThrow(
      'Failed to fetch course students: table not found'
    );
  });
});

// ===========================================================================
// 11. fetchCourseProgress
// ===========================================================================

describe('fetchCourseProgress', () => {
  it('should fetch progress for the authenticated user', async () => {
    mockAuth.getUser.mockResolvedValue({
      data: { user: MOCK_USER },
      error: null,
    });
    mockEnrollmentsBuilder.single.mockResolvedValue({
      data: {
        course_id: 'course-1',
        student_id: 'user-1',
        enrolled_at: '2024-02-01T00:00:00Z',
        progress_percent: 60,
      },
      error: null,
    });

    const result = await fetchCourseProgress('course-1');

    expect(result).toEqual({
      courseId: 'course-1',
      userId: 'user-1',
      enrolledAt: '2024-02-01T00:00:00Z',
      progressPercent: 60,
      completedMaterialIds: [],
    });
  });

  it('should throw error when not authenticated', async () => {
    mockAuth.getUser.mockResolvedValue({
      data: { user: null },
      error: { message: 'expired session' },
    });

    await expect(fetchCourseProgress('course-1')).rejects.toThrow(
      'Authentication required to fetch course progress'
    );
  });

  it('should throw error when user is null without auth error', async () => {
    mockAuth.getUser.mockResolvedValue({
      data: { user: null },
      error: null,
    });

    await expect(fetchCourseProgress('course-1')).rejects.toThrow(
      'Authentication required to fetch course progress'
    );
  });

  it('should throw error on enrollment query failure', async () => {
    mockAuth.getUser.mockResolvedValue({
      data: { user: MOCK_USER },
      error: null,
    });
    mockEnrollmentsBuilder.single.mockResolvedValue({
      data: null,
      error: { message: 'no enrollment found' },
    });

    await expect(fetchCourseProgress('course-1')).rejects.toThrow(
      'Failed to fetch course progress: no enrollment found'
    );
  });
});

// ===========================================================================
// 12. removeStudent
// ===========================================================================

describe('removeStudent', () => {
  // removeStudent chains .update().eq("course_id",...).eq("student_id",...)
  // First .eq() must return builder, second .eq() resolves.
  function setupRemoveStudentQuery(resolvedValue: unknown) {
    mockEnrollmentsBuilder.eq
      .mockReturnValueOnce(mockEnrollmentsBuilder) // first .eq() chains
      .mockResolvedValueOnce(resolvedValue); // second .eq() resolves
  }

  it('should soft-delete enrollment by setting status to dropped', async () => {
    setupRemoveStudentQuery({ error: null });

    await removeStudent('course-1', 'student-1');

    expect(mockSupabaseClient.from).toHaveBeenCalledWith('course_enrollments');
    expect(mockEnrollmentsBuilder.update).toHaveBeenCalledWith({ status: 'dropped' });
    expect(mockEnrollmentsBuilder.eq).toHaveBeenCalledWith('course_id', 'course-1');
    expect(mockEnrollmentsBuilder.eq).toHaveBeenCalledWith('student_id', 'student-1');
  });

  it('should throw error on update failure', async () => {
    setupRemoveStudentQuery({ error: { message: 'forbidden' } });

    await expect(removeStudent('course-1', 'student-1')).rejects.toThrow(
      'Failed to remove student: forbidden'
    );
  });
});

// ===========================================================================
// Cross-cutting: field mapping validation
// ===========================================================================

describe('Field mapping edge cases', () => {
  it('should map description to empty string when null in DB row', async () => {
    mockCoursesBuilder.range.mockResolvedValue({
      data: [
        { ...MOCK_COURSE_ROW, description: null, instructor: MOCK_PROFILE },
      ],
      error: null,
      count: 1,
    });

    const result = await fetchCourses();

    expect(result.data[0]!.description).toBe('');
  });

  it('should map category to "other" when null in DB row', async () => {
    mockCoursesBuilder.range.mockResolvedValue({
      data: [
        { ...MOCK_COURSE_ROW, category: null, instructor: MOCK_PROFILE },
      ],
      error: null,
      count: 1,
    });

    const result = await fetchCourses();

    expect(result.data[0]!.category).toBe('other');
  });

  it('should include avatarUrl as undefined when profile avatar_url is null', async () => {
    const profileNoAvatar = { ...MOCK_PROFILE, avatar_url: null };
    mockCoursesBuilder.range.mockResolvedValue({
      data: [{ ...MOCK_COURSE_ROW, instructor: profileNoAvatar }],
      error: null,
      count: 1,
    });

    const result = await fetchCourses();

    expect(result.data[0]!.instructor.avatarUrl).toBeUndefined();
  });
});
