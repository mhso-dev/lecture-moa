/**
 * Supabase Query Layer for Teams
 *
 * Provides direct Supabase database access for all team-related operations.
 * Replaces REST API calls with typed Supabase client queries.
 * Uses browser client for all client-side operations (RLS enforced by Supabase).
 *
 * REQ-BE-006-007: Defines fetchMyTeams, fetchAvailableTeams, fetchTeamDetail,
 * fetchTeamMembers, createTeam, updateTeam, deleteTeam, joinTeamByInviteCode,
 * leaveTeam, removeMember, changeMemberRole.
 */

import { createClient } from "./client";
import type { Database } from "~/types/supabase";
import type {
  Team,
  TeamMemberDetail,
  TeamDetailResponse,
  TeamMemberRole,
} from "@shared";

// ---------------------------------------------------------------------------
// Type Helpers
// ---------------------------------------------------------------------------

/** Input data for creating a team */
interface CreateTeamData {
  name: string;
  description?: string;
  maxMembers?: number;
  courseId?: string;
}

/** Input data for updating a team */
interface UpdateTeamData {
  name?: string;
  description?: string;
  maxMembers?: number;
}

// ---------------------------------------------------------------------------
// Helper: generate a random 6-character alphanumeric invite code
// ---------------------------------------------------------------------------

function generateRandomCode(): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let result = "";
  for (let i = 0; i < 6; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

// ---------------------------------------------------------------------------
// Type Mappers (snake_case → camelCase)
// REQ-BE-006-009
// ---------------------------------------------------------------------------

/**
 * Map a team row (with joined courses and member count) to the frontend Team type.
 */
function mapTeamRowToTeam(
  row: Record<string, unknown>,
  courseName: string,
  memberCount: number
): Team {
  return {
    id: row.id as string,
    name: row.name as string,
    description: (row.description as string | null) ?? undefined,
    courseName,
    memberCount,
    courseId: row.course_id as string,
    inviteCode: (row.invite_code as string | null) ?? null,
    maxMembers: (row.max_members as number | null) ?? 10,
    createdBy: row.created_by as string,
    createdAt: new Date(row.created_at as string),
    updatedAt: new Date(row.updated_at as string),
  };
}

/**
 * Map a team_members row (with joined profile) to the frontend TeamMemberDetail type.
 */
function mapMemberRowToDetail(
  row: Record<string, unknown>
): TeamMemberDetail {
  const profile = row.profiles as Record<string, unknown> | null;
  const joinedAt = new Date(row.joined_at as string);

  return {
    id: row.id as string,
    name: (profile?.display_name as string | undefined) ?? "Unknown Member",
    avatarUrl: (profile?.avatar_url as string | null | undefined) ?? undefined,
    role: row.role as TeamMemberRole,
    lastActiveAt: joinedAt,
    userId: row.user_id as string,
    teamId: row.team_id as string,
    joinedAt,
  };
}

// ---------------------------------------------------------------------------
// Team Query Functions
// ---------------------------------------------------------------------------

/**
 * Fetch teams that the given user belongs to.
 * REQ-BE-006-011: Queries team_members joined with teams and courses.
 */
export async function fetchMyTeams(userId: string): Promise<Team[]> {
  const supabase = createClient();

  const { data, error } = await supabase
    .from("team_members")
    .select(
      "*, teams(*, courses(id, title), team_members(count))"
    )
    .eq("user_id", userId);

  if (error) {
    throw new Error(`Failed to fetch my teams: ${error.message}`);
  }

  return data.map((row: Record<string, unknown>) => {
    const team = row.teams as Record<string, unknown>;
    const courses = team.courses as Record<string, unknown> | null;
    const memberAgg = team.team_members as { count: number }[] | null;
    const courseName = (courses?.title as string | undefined) ?? "";
    const memberCount = memberAgg?.[0]?.count ?? 0;

    return mapTeamRowToTeam(team, courseName, memberCount);
  });
}

/**
 * Fetch available teams, optionally filtered by name search.
 * REQ-BE-006-012: Queries teams with optional ilike filter.
 */
export async function fetchAvailableTeams(
  search?: string
): Promise<Team[]> {
  const supabase = createClient();

  let query = supabase
    .from("teams")
    .select("*, courses(id, title), team_members(count)");

  if (search) {
    query = query.ilike("name", `%${search}%`);
  }

  const { data, error } = await query.order("created_at", {
    ascending: false,
  });

  if (error) {
    throw new Error(`Failed to fetch available teams: ${error.message}`);
  }

  return data.map((row: Record<string, unknown>) => {
    const courses = row.courses as Record<string, unknown> | null;
    const memberAgg = row.team_members as { count: number }[] | null;
    const courseName = (courses?.title as string | undefined) ?? "";
    const memberCount = memberAgg?.[0]?.count ?? 0;

    return mapTeamRowToTeam(row, courseName, memberCount);
  });
}

/**
 * Fetch detailed team information including members.
 * REQ-BE-006-013: Queries team by ID with member count, then fetches members.
 */
export async function fetchTeamDetail(
  teamId: string
): Promise<TeamDetailResponse> {
  const supabase = createClient();

  const { data, error } = await supabase
    .from("teams")
    .select("*, courses(id, title), team_members(count)")
    .eq("id", teamId)
    .single();

  if (error) {
    throw new Error(`Failed to fetch team detail: ${error.message}`);
  }

  const courses = data.courses as Record<string, unknown> | null;
  const memberAgg = data.team_members as { count: number }[] | null;
  const courseName = (courses?.title as string | undefined) ?? "";
  const memberCount = memberAgg?.[0]?.count ?? 0;

  const team = mapTeamRowToTeam(
    data as unknown as Record<string, unknown>,
    courseName,
    memberCount
  );

  const members = await fetchTeamMembers(teamId);

  return { team, members };
}

/**
 * Fetch members of a team with profile data.
 * REQ-BE-006-014: Queries team_members joined with profiles.
 */
export async function fetchTeamMembers(
  teamId: string
): Promise<TeamMemberDetail[]> {
  const supabase = createClient();

  const { data, error } = await supabase
    .from("team_members")
    .select("*, profiles(id, display_name, avatar_url)")
    .eq("team_id", teamId);

  if (error) {
    throw new Error(`Failed to fetch team members: ${error.message}`);
  }

  return data.map((row: Record<string, unknown>) =>
    mapMemberRowToDetail(row)
  );
}

// ---------------------------------------------------------------------------
// Team Mutation Functions
// ---------------------------------------------------------------------------

/**
 * Create a new team and add the creator as leader.
 * REQ-BE-006-017, REQ-BE-006-018: Inserts team with invite_code, then adds leader.
 */
export async function createTeam(
  teamData: CreateTeamData,
  userId: string
): Promise<Team> {
  const supabase = createClient();

  const inviteCode = generateRandomCode();

  const insertData: Database["public"]["Tables"]["teams"]["Insert"] = {
    name: teamData.name,
    course_id: teamData.courseId ?? "",
    created_by: userId,
    invite_code: inviteCode,
    description: teamData.description,
    max_members: teamData.maxMembers,
  };

  const { data: teamRow, error: teamError } = await supabase
    .from("teams")
    .insert(insertData)
    .select("*")
    .single();

  if (teamError) {
    throw new Error(`Failed to create team: ${teamError.message}`);
  }

  // Add creator as team leader
  const { error: memberError } = await supabase
    .from("team_members")
    .insert({
      team_id: teamRow.id,
      user_id: userId,
      role: "leader",
    })
    .select("*")
    .single();

  if (memberError) {
    throw new Error(`Failed to add team leader: ${memberError.message}`);
  }

  return mapTeamRowToTeam(
    teamRow as unknown as Record<string, unknown>,
    "",
    1
  );
}

/**
 * Update an existing team by ID.
 * REQ-BE-006-019: Updates team fields with camelCase to snake_case mapping.
 */
export async function updateTeam(
  teamId: string,
  teamData: UpdateTeamData
): Promise<Team> {
  const supabase = createClient();

  const updateData: Database["public"]["Tables"]["teams"]["Update"] = {};

  if (teamData.name !== undefined) updateData.name = teamData.name;
  if (teamData.description !== undefined)
    updateData.description = teamData.description;
  if (teamData.maxMembers !== undefined)
    updateData.max_members = teamData.maxMembers;

  const { data, error } = await supabase
    .from("teams")
    .update(updateData)
    .eq("id", teamId)
    .select("*")
    .single();

  if (error) {
    throw new Error(`Failed to update team: ${error.message}`);
  }

  return mapTeamRowToTeam(
    data as unknown as Record<string, unknown>,
    "",
    0
  );
}

/**
 * Delete a team by ID (CASCADE deletes team_members).
 * REQ-BE-006-020
 */
export async function deleteTeam(teamId: string): Promise<void> {
  const supabase = createClient();

  const { error } = await supabase
    .from("teams")
    .delete()
    .eq("id", teamId);

  if (error) {
    throw new Error(`Failed to delete team: ${error.message}`);
  }
}

// ---------------------------------------------------------------------------
// Team Membership Functions
// ---------------------------------------------------------------------------

/**
 * Join a team using an invite code.
 * REQ-BE-006-022, REQ-BE-006-023, REQ-BE-006-024:
 * 3-step validation: team exists, not full, not already member.
 */
export async function joinTeamByInviteCode(
  inviteCode: string,
  userId: string
): Promise<{ teamId: string }> {
  const supabase = createClient();

  // Step 1: Find team by invite code
  const { data: teamData, error: teamError } = await supabase
    .from("teams")
    .select("id, max_members")
    .eq("invite_code", inviteCode.toUpperCase())
    .single();

  if (teamError) {
    throw new Error("Invalid invite code");
  }

  const teamId = teamData.id;
  const maxMembers = teamData.max_members;

  // Step 2: Check if team is full
  const { count: currentCount } = await supabase
    .from("team_members")
    .select("id", { count: "exact", head: true })
    .eq("team_id", teamId);

  if ((currentCount ?? 0) >= maxMembers) {
    throw new Error("Team is full");
  }

  // Step 3: Check if user is already a member
  const { data: existingMember } = await supabase
    .from("team_members")
    .select("id")
    .eq("team_id", teamId)
    .eq("user_id", userId);

  if (existingMember && existingMember.length > 0) {
    throw new Error("Already a member of this team");
  }

  // Insert new member
  const { error: insertError } = await supabase
    .from("team_members")
    .insert({
      team_id: teamId,
      user_id: userId,
      role: "member",
    })
    .select("*")
    .single();

  if (insertError) {
    throw new Error(`Failed to join team: ${insertError.message}`);
  }

  return { teamId };
}

/**
 * Leave a team (remove self from team_members).
 * REQ-BE-006-025
 */
export async function leaveTeam(
  teamId: string,
  userId: string
): Promise<void> {
  const supabase = createClient();

  const { error } = await supabase
    .from("team_members")
    .delete()
    .eq("team_id", teamId)
    .eq("user_id", userId);

  if (error) {
    throw new Error(`Failed to leave team: ${error.message}`);
  }
}

/**
 * Remove a member from a team (leader action).
 * REQ-BE-006-026
 */
export async function removeMember(
  teamId: string,
  userId: string
): Promise<void> {
  const supabase = createClient();

  const { error } = await supabase
    .from("team_members")
    .delete()
    .eq("team_id", teamId)
    .eq("user_id", userId);

  if (error) {
    throw new Error(`Failed to remove member: ${error.message}`);
  }
}

/**
 * Change a team member's role.
 * REQ-BE-006-027
 */
export async function changeMemberRole(
  teamId: string,
  userId: string,
  role: TeamMemberRole
): Promise<void> {
  const supabase = createClient();

  const { error } = await supabase
    .from("team_members")
    .update({ role })
    .eq("team_id", teamId)
    .eq("user_id", userId);

  if (error) {
    throw new Error(`Failed to change member role: ${error.message}`);
  }
}
