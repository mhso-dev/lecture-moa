/**
 * Supabase Teams Query Layer - Unit Tests
 *
 * Tests all 11 exported functions from ~/lib/supabase/teams.ts
 * using chainable Supabase client mocks.
 * REQ-BE-006-007, REQ-BE-006-009, REQ-BE-006-010
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
    neq: vi.fn().mockReturnThis(),
    ilike: vi.fn().mockReturnThis(),
    order: vi.fn().mockReturnThis(),
    range: vi.fn().mockReturnThis(),
    single: vi.fn(),
    limit: vi.fn().mockReturnThis(),
    not: vi.fn().mockReturnThis(),
    in: vi.fn().mockReturnThis(),
  };
  return builder;
}

const mockTeamsBuilder = createMockQueryBuilder();
const mockTeamMembersBuilder = createMockQueryBuilder();
const mockProfilesBuilder = createMockQueryBuilder();

const mockAuth = {
  getUser: vi.fn(),
};

const mockSupabaseClient = {
  from: vi.fn((table: string) => {
    switch (table) {
      case 'teams':
        return mockTeamsBuilder;
      case 'team_members':
        return mockTeamMembersBuilder;
      case 'profiles':
        return mockProfilesBuilder;
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
  fetchMyTeams,
  fetchAvailableTeams,
  fetchTeamDetail,
  fetchTeamMembers,
  createTeam,
  updateTeam,
  deleteTeam,
  joinTeamByInviteCode,
  leaveTeam,
  removeMember,
  changeMemberRole,
} from '../../../lib/supabase/teams';

// ---------------------------------------------------------------------------
// Test Fixtures
// ---------------------------------------------------------------------------

const MOCK_TEAM_ROW = {
  id: 'team-1',
  name: 'Study Group A',
  description: 'A study group',
  course_id: 'course-1',
  created_by: 'user-1',
  max_members: 10,
  invite_code: 'ABC123',
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-15T00:00:00Z',
};

const MOCK_COURSE = {
  id: 'course-1',
  title: 'TypeScript Fundamentals',
};

const MOCK_PROFILE = {
  id: 'user-1',
  display_name: 'John Doe',
  avatar_url: 'https://example.com/avatar.jpg',
  role: 'student' as const,
  bio: null,
  created_at: '2023-01-01T00:00:00Z',
  updated_at: '2023-06-01T00:00:00Z',
};

const MOCK_TEAM_MEMBER_ROW = {
  id: 'member-1',
  team_id: 'team-1',
  user_id: 'user-1',
  role: 'leader',
  joined_at: '2024-01-01T00:00:00Z',
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
  resetBuilderMocks(mockTeamsBuilder);
  resetBuilderMocks(mockTeamMembersBuilder);
  resetBuilderMocks(mockProfilesBuilder);
  mockAuth.getUser.mockReset();
  mockSupabaseClient.from.mockImplementation((table: string) => {
    switch (table) {
      case 'teams':
        return mockTeamsBuilder;
      case 'team_members':
        return mockTeamMembersBuilder;
      case 'profiles':
        return mockProfilesBuilder;
      default:
        return createMockQueryBuilder();
    }
  });
});

// ===========================================================================
// 1. fetchMyTeams
// ===========================================================================

describe('fetchMyTeams', () => {
  it('should fetch teams for the given user by querying team_members', async () => {
    const mockData = [
      {
        ...MOCK_TEAM_MEMBER_ROW,
        teams: {
          ...MOCK_TEAM_ROW,
          courses: MOCK_COURSE,
          team_members: [{ count: 3 }],
        },
      },
    ];
    mockTeamMembersBuilder.eq.mockResolvedValue({
      data: mockData,
      error: null,
    });

    const result = await fetchMyTeams('user-1');

    expect(mockSupabaseClient.from).toHaveBeenCalledWith('team_members');
    expect(mockTeamMembersBuilder.select).toHaveBeenCalled();
    expect(mockTeamMembersBuilder.eq).toHaveBeenCalledWith('user_id', 'user-1');
    expect(result).toHaveLength(1);
    expect(result[0]!.id).toBe('team-1');
    expect(result[0]!.name).toBe('Study Group A');
    expect(result[0]!.courseName).toBe('TypeScript Fundamentals');
    expect(result[0]!.memberCount).toBe(3);
  });

  it('should map snake_case to camelCase fields', async () => {
    const mockData = [
      {
        ...MOCK_TEAM_MEMBER_ROW,
        teams: {
          ...MOCK_TEAM_ROW,
          courses: MOCK_COURSE,
          team_members: [{ count: 1 }],
        },
      },
    ];
    mockTeamMembersBuilder.eq.mockResolvedValue({
      data: mockData,
      error: null,
    });

    const result = await fetchMyTeams('user-1');

    expect(result[0]!.courseId).toBe('course-1');
    expect(result[0]!.inviteCode).toBe('ABC123');
    expect(result[0]!.maxMembers).toBe(10);
    expect(result[0]!.createdBy).toBe('user-1');
    expect(result[0]!.createdAt).toEqual(new Date('2024-01-01T00:00:00Z'));
    expect(result[0]!.updatedAt).toEqual(new Date('2024-01-15T00:00:00Z'));
  });

  it('should return empty array when user has no teams', async () => {
    mockTeamMembersBuilder.eq.mockResolvedValue({
      data: [],
      error: null,
    });

    const result = await fetchMyTeams('user-1');

    expect(result).toEqual([]);
  });

  it('should throw error on query failure', async () => {
    mockTeamMembersBuilder.eq.mockResolvedValue({
      data: null,
      error: { message: 'connection refused' },
    });

    await expect(fetchMyTeams('user-1')).rejects.toThrow(
      'Failed to fetch my teams: connection refused'
    );
  });

  it('should handle null description', async () => {
    const mockData = [
      {
        ...MOCK_TEAM_MEMBER_ROW,
        teams: {
          ...MOCK_TEAM_ROW,
          description: null,
          courses: MOCK_COURSE,
          team_members: [{ count: 1 }],
        },
      },
    ];
    mockTeamMembersBuilder.eq.mockResolvedValue({
      data: mockData,
      error: null,
    });

    const result = await fetchMyTeams('user-1');

    expect(result[0]!.description).toBeUndefined();
  });

  it('should handle null invite_code', async () => {
    const mockData = [
      {
        ...MOCK_TEAM_MEMBER_ROW,
        teams: {
          ...MOCK_TEAM_ROW,
          invite_code: null,
          courses: MOCK_COURSE,
          team_members: [{ count: 1 }],
        },
      },
    ];
    mockTeamMembersBuilder.eq.mockResolvedValue({
      data: mockData,
      error: null,
    });

    const result = await fetchMyTeams('user-1');

    expect(result[0]!.inviteCode).toBeNull();
  });

  it('should default courseName to empty string when courses is null', async () => {
    const mockData = [
      {
        ...MOCK_TEAM_MEMBER_ROW,
        teams: {
          ...MOCK_TEAM_ROW,
          courses: null,
          team_members: [{ count: 1 }],
        },
      },
    ];
    mockTeamMembersBuilder.eq.mockResolvedValue({
      data: mockData,
      error: null,
    });

    const result = await fetchMyTeams('user-1');

    expect(result[0]!.courseName).toBe('');
  });
});

// ===========================================================================
// 2. fetchAvailableTeams
// ===========================================================================

describe('fetchAvailableTeams', () => {
  it('should fetch all teams without search filter', async () => {
    const mockData = [
      {
        ...MOCK_TEAM_ROW,
        courses: MOCK_COURSE,
        team_members: [{ count: 3 }],
      },
    ];
    mockTeamsBuilder.order.mockResolvedValue({
      data: mockData,
      error: null,
    });

    const result = await fetchAvailableTeams();

    expect(mockSupabaseClient.from).toHaveBeenCalledWith('teams');
    expect(mockTeamsBuilder.select).toHaveBeenCalled();
    expect(result).toHaveLength(1);
    expect(result[0]!.id).toBe('team-1');
  });

  it('should apply search filter with ilike on name', async () => {
    mockTeamsBuilder.order.mockResolvedValue({
      data: [],
      error: null,
    });

    await fetchAvailableTeams('study');

    expect(mockTeamsBuilder.ilike).toHaveBeenCalledWith('name', '%study%');
  });

  it('should return empty array when no teams match', async () => {
    mockTeamsBuilder.order.mockResolvedValue({
      data: [],
      error: null,
    });

    const result = await fetchAvailableTeams('nonexistent');

    expect(result).toEqual([]);
  });

  it('should throw error on query failure', async () => {
    mockTeamsBuilder.order.mockResolvedValue({
      data: null,
      error: { message: 'timeout' },
    });

    await expect(fetchAvailableTeams()).rejects.toThrow(
      'Failed to fetch available teams: timeout'
    );
  });

  it('should map all fields correctly', async () => {
    const mockData = [
      {
        ...MOCK_TEAM_ROW,
        courses: MOCK_COURSE,
        team_members: [{ count: 5 }],
      },
    ];
    mockTeamsBuilder.order.mockResolvedValue({
      data: mockData,
      error: null,
    });

    const result = await fetchAvailableTeams();

    expect(result[0]!.courseId).toBe('course-1');
    expect(result[0]!.maxMembers).toBe(10);
    expect(result[0]!.memberCount).toBe(5);
    expect(result[0]!.courseName).toBe('TypeScript Fundamentals');
  });
});

// ===========================================================================
// 3. fetchTeamDetail
// ===========================================================================

describe('fetchTeamDetail', () => {
  it('should fetch team detail with member count', async () => {
    mockTeamsBuilder.single.mockResolvedValue({
      data: {
        ...MOCK_TEAM_ROW,
        courses: MOCK_COURSE,
        team_members: [{ count: 4 }],
      },
      error: null,
    });
    // For fetchTeamMembers sub-query
    mockTeamMembersBuilder.eq.mockResolvedValue({
      data: [
        {
          ...MOCK_TEAM_MEMBER_ROW,
          profiles: MOCK_PROFILE,
        },
      ],
      error: null,
    });

    const result = await fetchTeamDetail('team-1');

    expect(mockSupabaseClient.from).toHaveBeenCalledWith('teams');
    expect(mockTeamsBuilder.eq).toHaveBeenCalledWith('id', 'team-1');
    expect(result.team.id).toBe('team-1');
    expect(result.team.name).toBe('Study Group A');
    expect(result.team.memberCount).toBe(4);
    expect(result.members).toHaveLength(1);
  });

  it('should throw error when team not found', async () => {
    mockTeamsBuilder.single.mockResolvedValue({
      data: null,
      error: { message: 'not found' },
    });

    await expect(fetchTeamDetail('missing-id')).rejects.toThrow(
      'Failed to fetch team detail: not found'
    );
  });

  it('should map team fields from snake_case to camelCase', async () => {
    mockTeamsBuilder.single.mockResolvedValue({
      data: {
        ...MOCK_TEAM_ROW,
        courses: MOCK_COURSE,
        team_members: [{ count: 1 }],
      },
      error: null,
    });
    mockTeamMembersBuilder.eq.mockResolvedValue({
      data: [],
      error: null,
    });

    const result = await fetchTeamDetail('team-1');

    expect(result.team.courseId).toBe('course-1');
    expect(result.team.inviteCode).toBe('ABC123');
    expect(result.team.maxMembers).toBe(10);
    expect(result.team.createdBy).toBe('user-1');
  });
});

// ===========================================================================
// 4. fetchTeamMembers
// ===========================================================================

describe('fetchTeamMembers', () => {
  it('should fetch team members with profile data', async () => {
    mockTeamMembersBuilder.eq.mockResolvedValue({
      data: [
        {
          ...MOCK_TEAM_MEMBER_ROW,
          profiles: MOCK_PROFILE,
        },
        {
          id: 'member-2',
          team_id: 'team-1',
          user_id: 'user-2',
          role: 'member',
          joined_at: '2024-02-01T00:00:00Z',
          profiles: {
            ...MOCK_PROFILE,
            id: 'user-2',
            display_name: 'Jane Smith',
            avatar_url: null,
          },
        },
      ],
      error: null,
    });

    const result = await fetchTeamMembers('team-1');

    expect(mockSupabaseClient.from).toHaveBeenCalledWith('team_members');
    expect(mockTeamMembersBuilder.eq).toHaveBeenCalledWith('team_id', 'team-1');
    expect(result).toHaveLength(2);
    expect(result[0]!.name).toBe('John Doe');
    expect(result[0]!.role).toBe('leader');
    expect(result[0]!.userId).toBe('user-1');
    expect(result[0]!.teamId).toBe('team-1');
    expect(result[0]!.joinedAt).toEqual(new Date('2024-01-01T00:00:00Z'));
  });

  it('should handle null avatar_url in profile', async () => {
    mockTeamMembersBuilder.eq.mockResolvedValue({
      data: [
        {
          ...MOCK_TEAM_MEMBER_ROW,
          profiles: {
            ...MOCK_PROFILE,
            avatar_url: null,
          },
        },
      ],
      error: null,
    });

    const result = await fetchTeamMembers('team-1');

    expect(result[0]!.avatarUrl).toBeUndefined();
  });

  it('should fallback to Unknown Member when profile is null', async () => {
    mockTeamMembersBuilder.eq.mockResolvedValue({
      data: [
        {
          ...MOCK_TEAM_MEMBER_ROW,
          profiles: null,
        },
      ],
      error: null,
    });

    const result = await fetchTeamMembers('team-1');

    expect(result[0]!.name).toBe('Unknown Member');
    expect(result[0]!.avatarUrl).toBeUndefined();
  });

  it('should return empty array when team has no members', async () => {
    mockTeamMembersBuilder.eq.mockResolvedValue({
      data: [],
      error: null,
    });

    const result = await fetchTeamMembers('team-1');

    expect(result).toEqual([]);
  });

  it('should throw error on query failure', async () => {
    mockTeamMembersBuilder.eq.mockResolvedValue({
      data: null,
      error: { message: 'permission denied' },
    });

    await expect(fetchTeamMembers('team-1')).rejects.toThrow(
      'Failed to fetch team members: permission denied'
    );
  });
});

// ===========================================================================
// 5. createTeam
// ===========================================================================

describe('createTeam', () => {
  const payload = {
    name: 'New Team',
    description: 'A new study group',
    maxMembers: 8,
    courseId: 'course-1',
  };

  it('should create a team and add user as leader', async () => {
    // First: insert into teams
    mockTeamsBuilder.single.mockResolvedValue({
      data: {
        ...MOCK_TEAM_ROW,
        name: 'New Team',
        description: 'A new study group',
        max_members: 8,
        invite_code: 'XYZ789',
      },
      error: null,
    });
    // Second: insert into team_members as leader
    mockTeamMembersBuilder.single.mockResolvedValue({
      data: MOCK_TEAM_MEMBER_ROW,
      error: null,
    });

    const result = await createTeam(payload, 'user-1');

    expect(mockSupabaseClient.from).toHaveBeenCalledWith('teams');
    expect(mockTeamsBuilder.insert).toHaveBeenCalledWith(
      expect.objectContaining({
        name: 'New Team',
        description: 'A new study group',
        max_members: 8,
        course_id: 'course-1',
        created_by: 'user-1',
        invite_code: expect.any(String),
      })
    );
    expect(mockSupabaseClient.from).toHaveBeenCalledWith('team_members');
    expect(mockTeamMembersBuilder.insert).toHaveBeenCalledWith(
      expect.objectContaining({
        team_id: expect.any(String),
        user_id: 'user-1',
        role: 'leader',
      })
    );
    expect(result.name).toBe('New Team');
  });

  it('should generate a 6-character invite code', async () => {
    mockTeamsBuilder.single.mockResolvedValue({
      data: { ...MOCK_TEAM_ROW },
      error: null,
    });
    mockTeamMembersBuilder.single.mockResolvedValue({
      data: MOCK_TEAM_MEMBER_ROW,
      error: null,
    });

    await createTeam(payload, 'user-1');

    const insertArg = mockTeamsBuilder.insert.mock.calls[0]![0] as Record<string, unknown>;
    const inviteCode = insertArg.invite_code as string;
    expect(inviteCode).toHaveLength(6);
    expect(inviteCode).toMatch(/^[A-Z0-9]{6}$/);
  });

  it('should throw error on team insert failure', async () => {
    mockTeamsBuilder.single.mockResolvedValue({
      data: null,
      error: { message: 'duplicate name' },
    });

    await expect(createTeam(payload, 'user-1')).rejects.toThrow(
      'Failed to create team: duplicate name'
    );
  });

  it('should throw error on member insert failure', async () => {
    mockTeamsBuilder.single.mockResolvedValue({
      data: { ...MOCK_TEAM_ROW },
      error: null,
    });
    mockTeamMembersBuilder.single.mockResolvedValue({
      data: null,
      error: { message: 'constraint violation' },
    });

    await expect(createTeam(payload, 'user-1')).rejects.toThrow(
      'Failed to add team leader: constraint violation'
    );
  });

  it('should handle optional description', async () => {
    mockTeamsBuilder.single.mockResolvedValue({
      data: { ...MOCK_TEAM_ROW, description: null },
      error: null,
    });
    mockTeamMembersBuilder.single.mockResolvedValue({
      data: MOCK_TEAM_MEMBER_ROW,
      error: null,
    });

    const payloadNoDesc = { name: 'Minimal Team', maxMembers: 5, courseId: 'course-1' };

    await createTeam(payloadNoDesc, 'user-1');

    const insertArg = mockTeamsBuilder.insert.mock.calls[0]![0] as Record<string, unknown>;
    expect(insertArg.description).toBeUndefined();
  });
});

// ===========================================================================
// 6. updateTeam
// ===========================================================================

describe('updateTeam', () => {
  it('should update team with provided fields', async () => {
    mockTeamsBuilder.single.mockResolvedValue({
      data: {
        ...MOCK_TEAM_ROW,
        name: 'Updated Team',
      },
      error: null,
    });

    const result = await updateTeam('team-1', { name: 'Updated Team' });

    expect(mockSupabaseClient.from).toHaveBeenCalledWith('teams');
    expect(mockTeamsBuilder.update).toHaveBeenCalledWith({ name: 'Updated Team' });
    expect(mockTeamsBuilder.eq).toHaveBeenCalledWith('id', 'team-1');
    expect(result.name).toBe('Updated Team');
  });

  it('should map camelCase to snake_case for update', async () => {
    mockTeamsBuilder.single.mockResolvedValue({
      data: { ...MOCK_TEAM_ROW, max_members: 15 },
      error: null,
    });

    await updateTeam('team-1', { maxMembers: 15 });

    expect(mockTeamsBuilder.update).toHaveBeenCalledWith({ max_members: 15 });
  });

  it('should update all fields when fully provided', async () => {
    mockTeamsBuilder.single.mockResolvedValue({
      data: { ...MOCK_TEAM_ROW },
      error: null,
    });

    await updateTeam('team-1', {
      name: 'Full Update',
      description: 'New desc',
      maxMembers: 20,
    });

    expect(mockTeamsBuilder.update).toHaveBeenCalledWith({
      name: 'Full Update',
      description: 'New desc',
      max_members: 20,
    });
  });

  it('should throw error on update failure', async () => {
    mockTeamsBuilder.single.mockResolvedValue({
      data: null,
      error: { message: 'not found' },
    });

    await expect(updateTeam('missing', { name: 'X' })).rejects.toThrow(
      'Failed to update team: not found'
    );
  });

  it('should not include undefined fields in update payload', async () => {
    mockTeamsBuilder.single.mockResolvedValue({
      data: { ...MOCK_TEAM_ROW },
      error: null,
    });

    await updateTeam('team-1', { name: 'Only Name' });

    const updateArg = mockTeamsBuilder.update.mock.calls[0]![0];
    expect(updateArg).toEqual({ name: 'Only Name' });
    expect(updateArg).not.toHaveProperty('description');
    expect(updateArg).not.toHaveProperty('max_members');
  });
});

// ===========================================================================
// 7. deleteTeam
// ===========================================================================

describe('deleteTeam', () => {
  it('should delete a team by ID', async () => {
    mockTeamsBuilder.eq.mockResolvedValue({ error: null });

    await deleteTeam('team-1');

    expect(mockSupabaseClient.from).toHaveBeenCalledWith('teams');
    expect(mockTeamsBuilder.delete).toHaveBeenCalled();
    expect(mockTeamsBuilder.eq).toHaveBeenCalledWith('id', 'team-1');
  });

  it('should throw error on delete failure', async () => {
    mockTeamsBuilder.eq.mockResolvedValue({
      error: { message: 'permission denied' },
    });

    await expect(deleteTeam('team-1')).rejects.toThrow(
      'Failed to delete team: permission denied'
    );
  });
});

// ===========================================================================
// 8. joinTeamByInviteCode
// ===========================================================================

describe('joinTeamByInviteCode', () => {
  // joinTeamByInviteCode calls from("team_members") multiple times:
  //   Step 2: .select("id", { count, head }).eq("team_id", teamId) -- 1 eq resolves
  //   Step 3: .select("id").eq("team_id", teamId).eq("user_id", userId) -- 2 eqs (chain, resolve)
  //   Step 4: .insert(...).select("*").single() -- uses single()
  function setupJoinMemberMocks(
    countResult: { count: number | null; error: unknown },
    duplicateResult: { data: unknown[]; error: unknown } | null,
    insertResult?: { data: unknown; error: unknown }
  ) {
    // Step 2: count query has 1 eq -> resolves
    mockTeamMembersBuilder.eq.mockResolvedValueOnce(countResult);

    if (duplicateResult !== null) {
      // Step 3: duplicate check has 2 eqs -> chain, then resolve
      mockTeamMembersBuilder.eq.mockReturnValueOnce(mockTeamMembersBuilder);
      mockTeamMembersBuilder.eq.mockResolvedValueOnce(duplicateResult);
    }

    if (insertResult) {
      mockTeamMembersBuilder.single.mockResolvedValue(insertResult);
    }
  }

  it('should find team by invite code and add user as member', async () => {
    // Step 1: find team by invite_code
    mockTeamsBuilder.single.mockResolvedValue({
      data: { id: 'team-1', max_members: 10 },
      error: null,
    });
    // Steps 2-4: count + duplicate + insert
    setupJoinMemberMocks(
      { count: 3, error: null },
      { data: [], error: null },
      { data: { ...MOCK_TEAM_MEMBER_ROW, role: 'member' }, error: null }
    );

    const result = await joinTeamByInviteCode('abc123', 'user-2');

    expect(mockTeamsBuilder.eq).toHaveBeenCalledWith('invite_code', 'ABC123');
    expect(result.teamId).toBe('team-1');
  });

  it('should uppercase the invite code before lookup', async () => {
    mockTeamsBuilder.single.mockResolvedValue({
      data: { id: 'team-1', max_members: 10 },
      error: null,
    });
    setupJoinMemberMocks(
      { count: 1, error: null },
      { data: [], error: null },
      { data: { ...MOCK_TEAM_MEMBER_ROW, role: 'member' }, error: null }
    );

    await joinTeamByInviteCode('xyz789', 'user-2');

    expect(mockTeamsBuilder.eq).toHaveBeenCalledWith('invite_code', 'XYZ789');
  });

  it('should throw error for invalid invite code', async () => {
    mockTeamsBuilder.single.mockResolvedValue({
      data: null,
      error: { message: 'no rows found' },
    });

    await expect(joinTeamByInviteCode('INVALID', 'user-1')).rejects.toThrow(
      'Invalid invite code'
    );
  });

  it('should throw error when team is full', async () => {
    mockTeamsBuilder.single.mockResolvedValue({
      data: { id: 'team-1', max_members: 3 },
      error: null,
    });
    // Count query: 1 eq resolves with full count (no duplicate check needed)
    setupJoinMemberMocks(
      { count: 3, error: null },
      null // will not reach duplicate check
    );

    await expect(joinTeamByInviteCode('ABC123', 'user-2')).rejects.toThrow(
      'Team is full'
    );
  });

  it('should throw error when user is already a member', async () => {
    mockTeamsBuilder.single.mockResolvedValue({
      data: { id: 'team-1', max_members: 10 },
      error: null,
    });
    // Count query passes, duplicate check finds existing member
    setupJoinMemberMocks(
      { count: 3, error: null },
      { data: [{ id: 'existing-member' }], error: null }
    );

    await expect(joinTeamByInviteCode('ABC123', 'user-1')).rejects.toThrow(
      'Already a member of this team'
    );
  });

  it('should throw error on member insert failure', async () => {
    mockTeamsBuilder.single.mockResolvedValue({
      data: { id: 'team-1', max_members: 10 },
      error: null,
    });
    // Count query passes, no duplicate, but insert fails
    setupJoinMemberMocks(
      { count: 3, error: null },
      { data: [], error: null },
      { data: null, error: { message: 'constraint violation' } }
    );

    await expect(joinTeamByInviteCode('ABC123', 'user-2')).rejects.toThrow(
      'Failed to join team: constraint violation'
    );
  });
});

// ===========================================================================
// 9. leaveTeam
// ===========================================================================

describe('leaveTeam', () => {
  // leaveTeam chains .delete().eq("team_id",...).eq("user_id",...)
  function setupLeaveTeamQuery(resolvedValue: unknown) {
    mockTeamMembersBuilder.eq
      .mockReturnValueOnce(mockTeamMembersBuilder) // first .eq() chains
      .mockResolvedValueOnce(resolvedValue); // second .eq() resolves
  }

  it('should remove user from team', async () => {
    setupLeaveTeamQuery({ error: null });

    await leaveTeam('team-1', 'user-1');

    expect(mockSupabaseClient.from).toHaveBeenCalledWith('team_members');
    expect(mockTeamMembersBuilder.delete).toHaveBeenCalled();
    expect(mockTeamMembersBuilder.eq).toHaveBeenCalledWith('team_id', 'team-1');
    expect(mockTeamMembersBuilder.eq).toHaveBeenCalledWith('user_id', 'user-1');
  });

  it('should throw error on delete failure', async () => {
    setupLeaveTeamQuery({ error: { message: 'not found' } });

    await expect(leaveTeam('team-1', 'user-1')).rejects.toThrow(
      'Failed to leave team: not found'
    );
  });
});

// ===========================================================================
// 10. removeMember
// ===========================================================================

describe('removeMember', () => {
  // removeMember chains .delete().eq("team_id",...).eq("user_id",...)
  function setupRemoveMemberQuery(resolvedValue: unknown) {
    mockTeamMembersBuilder.eq
      .mockReturnValueOnce(mockTeamMembersBuilder)
      .mockResolvedValueOnce(resolvedValue);
  }

  it('should remove member from team', async () => {
    setupRemoveMemberQuery({ error: null });

    await removeMember('team-1', 'user-2');

    expect(mockSupabaseClient.from).toHaveBeenCalledWith('team_members');
    expect(mockTeamMembersBuilder.delete).toHaveBeenCalled();
    expect(mockTeamMembersBuilder.eq).toHaveBeenCalledWith('team_id', 'team-1');
    expect(mockTeamMembersBuilder.eq).toHaveBeenCalledWith('user_id', 'user-2');
  });

  it('should throw error on removal failure', async () => {
    setupRemoveMemberQuery({ error: { message: 'forbidden' } });

    await expect(removeMember('team-1', 'user-2')).rejects.toThrow(
      'Failed to remove member: forbidden'
    );
  });
});

// ===========================================================================
// 11. changeMemberRole
// ===========================================================================

describe('changeMemberRole', () => {
  // changeMemberRole chains .update({ role }).eq("team_id",...).eq("user_id",...)
  function setupChangeRoleQuery(resolvedValue: unknown) {
    mockTeamMembersBuilder.eq
      .mockReturnValueOnce(mockTeamMembersBuilder)
      .mockResolvedValueOnce(resolvedValue);
  }

  it('should update member role to leader', async () => {
    setupChangeRoleQuery({ error: null });

    await changeMemberRole('team-1', 'user-2', 'leader');

    expect(mockSupabaseClient.from).toHaveBeenCalledWith('team_members');
    expect(mockTeamMembersBuilder.update).toHaveBeenCalledWith({ role: 'leader' });
    expect(mockTeamMembersBuilder.eq).toHaveBeenCalledWith('team_id', 'team-1');
    expect(mockTeamMembersBuilder.eq).toHaveBeenCalledWith('user_id', 'user-2');
  });

  it('should update member role to member', async () => {
    setupChangeRoleQuery({ error: null });

    await changeMemberRole('team-1', 'user-1', 'member');

    expect(mockTeamMembersBuilder.update).toHaveBeenCalledWith({ role: 'member' });
  });

  it('should throw error on role change failure', async () => {
    setupChangeRoleQuery({ error: { message: 'forbidden' } });

    await expect(changeMemberRole('team-1', 'user-2', 'leader')).rejects.toThrow(
      'Failed to change member role: forbidden'
    );
  });
});

// ===========================================================================
// Cross-cutting: field mapping validation
// ===========================================================================

describe('Field mapping edge cases', () => {
  it('should correctly map all Team fields in fetchAvailableTeams', async () => {
    const mockData = [
      {
        id: 'team-2',
        name: 'Test Team',
        description: 'Test desc',
        course_id: 'course-2',
        created_by: 'user-3',
        max_members: 20,
        invite_code: null,
        created_at: '2024-06-01T00:00:00Z',
        updated_at: '2024-06-15T00:00:00Z',
        courses: { id: 'course-2', title: 'Advanced React' },
        team_members: [{ count: 7 }],
      },
    ];
    mockTeamsBuilder.order.mockResolvedValue({
      data: mockData,
      error: null,
    });

    const result = await fetchAvailableTeams();

    const team = result[0]!;
    expect(team.id).toBe('team-2');
    expect(team.name).toBe('Test Team');
    expect(team.description).toBe('Test desc');
    expect(team.courseId).toBe('course-2');
    expect(team.courseName).toBe('Advanced React');
    expect(team.createdBy).toBe('user-3');
    expect(team.maxMembers).toBe(20);
    expect(team.inviteCode).toBeNull();
    expect(team.memberCount).toBe(7);
    expect(team.createdAt).toEqual(new Date('2024-06-01T00:00:00Z'));
    expect(team.updatedAt).toEqual(new Date('2024-06-15T00:00:00Z'));
  });

  it('should correctly map TeamMemberDetail fields in fetchTeamMembers', async () => {
    mockTeamMembersBuilder.eq.mockResolvedValue({
      data: [
        {
          id: 'member-5',
          team_id: 'team-1',
          user_id: 'user-5',
          role: 'member',
          joined_at: '2024-03-15T10:30:00Z',
          profiles: {
            id: 'user-5',
            display_name: 'Alice Wonder',
            avatar_url: 'https://example.com/alice.png',
          },
        },
      ],
      error: null,
    });

    const result = await fetchTeamMembers('team-1');

    const member = result[0]!;
    expect(member.id).toBe('member-5');
    expect(member.name).toBe('Alice Wonder');
    expect(member.avatarUrl).toBe('https://example.com/alice.png');
    expect(member.role).toBe('member');
    expect(member.userId).toBe('user-5');
    expect(member.teamId).toBe('team-1');
    expect(member.joinedAt).toEqual(new Date('2024-03-15T10:30:00Z'));
    // lastActiveAt should equal joinedAt when no separate data
    expect(member.lastActiveAt).toEqual(new Date('2024-03-15T10:30:00Z'));
  });
});
