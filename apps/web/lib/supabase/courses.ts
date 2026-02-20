/**
 * Supabase Query Layer for Courses
 *
 * Provides direct Supabase database access for all course-related operations.
 * Replaces REST API calls with typed Supabase client queries.
 * Uses browser client for all client-side operations (RLS enforced by Supabase).
 */

import { createClient } from "./client";
import type { Database } from "~/types/supabase";
import type {
  Course,
  CourseListItem,
  CourseInstructor,
  PaginatedCourseList,
  CourseListParams,
  CreateCoursePayload,
  UpdateCoursePayload,
  CourseEnrollment,
  StudentProgress,
  InviteCodeResponse,
} from "@shared";

type CourseRow = Database["public"]["Tables"]["courses"]["Row"];
type EnrollmentRow = Database["public"]["Tables"]["course_enrollments"]["Row"];
type ProfileRow = Database["public"]["Tables"]["profiles"]["Row"];

// ---------------------------------------------------------------------------
// Type Mappers
// ---------------------------------------------------------------------------

/**
 * Map a DB courses row to the frontend CourseListItem type.
 * DB uses snake_case and different field names from the frontend camelCase types.
 */
function mapCourseRowToListItem(
  row: CourseRow,
  instructor: CourseInstructor,
  enrolledCount = 0,
  materialCount = 0
): CourseListItem {
  return {
    id: row.id,
    title: row.title,
    description: row.description ?? "",
    category: row.category ?? "other",
    status: row.status,
    visibility: row.visibility,
    thumbnailUrl: row.cover_image_url ?? undefined,
    instructor,
    enrolledCount,
    materialCount,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

/**
 * Map a DB courses row to the frontend Course type (includes inviteCode).
 * Only exposes inviteCode for the course owner (enforced by RLS).
 */
function mapCourseRowToDetail(
  row: CourseRow,
  instructor: CourseInstructor,
  enrolledCount = 0,
  materialCount = 0
): Course {
  return {
    ...mapCourseRowToListItem(row, instructor, enrolledCount, materialCount),
    syllabus: [],
    inviteCode: row.invite_code ?? undefined,
  };
}

/**
 * Map a profiles row to the CourseInstructor shape.
 */
function mapProfileToInstructor(profile: ProfileRow): CourseInstructor {
  return {
    id: profile.id,
    name: profile.display_name,
    avatarUrl: profile.avatar_url ?? undefined,
  };
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
// Course Query Functions
// ---------------------------------------------------------------------------

/**
 * Fetch a paginated list of courses with optional filters and sorting.
 */
export async function fetchCourses(
  params?: CourseListParams
): Promise<PaginatedCourseList> {
  const supabase = createClient();

  const page = params?.page ?? 1;
  const limit = params?.limit ?? 20;
  const from = (page - 1) * limit;
  const to = from + limit - 1;

  let query = supabase
    .from("courses")
    .select("*, instructor:profiles!courses_instructor_id_fkey(*)", {
      count: "exact",
    });

  // Apply filters
  if (params?.search) {
    query = query.ilike("title", `%${params.search}%`);
  }
  if (params?.category) {
    query = query.eq("category", params.category);
  }
  if (params?.status) {
    query = query.eq("status", params.status);
  }

  // Apply sorting
  switch (params?.sort) {
    case "popular":
      query = query.order("created_at", { ascending: false });
      break;
    case "alphabetical":
      query = query.order("title", { ascending: true });
      break;
    case "recent":
    default:
      query = query.order("created_at", { ascending: false });
  }

  // Apply pagination
  query = query.range(from, to);

  const { data, error, count } = await query;

  if (error) {
    throw new Error(`Failed to fetch courses: ${error.message}`);
  }

  const items: CourseListItem[] = data.map((row) => {
    // The joined profile comes back as a single object or null
    const profileData = row.instructor as ProfileRow | null;
    const instructor: CourseInstructor = profileData
      ? mapProfileToInstructor(profileData)
      : { id: row.instructor_id, name: "Unknown" };

    return mapCourseRowToListItem(row, instructor);
  });

  return {
    data: items,
    total: count ?? 0,
    page,
    limit,
  };
}

/**
 * Fetch a single course by ID with full detail (including inviteCode for owner).
 */
export async function fetchCourse(courseId: string): Promise<Course> {
  const supabase = createClient();

  const { data, error } = await supabase
    .from("courses")
    .select("*, instructor:profiles!courses_instructor_id_fkey(*)")
    .eq("id", courseId)
    .single();

  if (error) {
    throw new Error(`Failed to fetch course: ${error.message}`);
  }

  const profileData = data.instructor as ProfileRow | null;
  const instructor: CourseInstructor = profileData
    ? mapProfileToInstructor(profileData)
    : { id: data.instructor_id, name: "Unknown" };

  // Fetch enrolled count
  const { count: enrolledCount } = await supabase
    .from("course_enrollments")
    .select("id", { count: "exact", head: true })
    .eq("course_id", courseId)
    .eq("status", "active");

  // Fetch material count
  const { count: materialCount } = await supabase
    .from("materials")
    .select("id", { count: "exact", head: true })
    .eq("course_id", courseId);

  return mapCourseRowToDetail(
    data,
    instructor,
    enrolledCount ?? 0,
    materialCount ?? 0
  );
}

/**
 * Create a new course. The instructor_id is set from the current auth session.
 */
export async function createCourse(
  payload: CreateCoursePayload
): Promise<Course> {
  const supabase = createClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError ?? !user) {
    throw new Error("Authentication required to create a course");
  }

  const insertData: Database["public"]["Tables"]["courses"]["Insert"] = {
     
    instructor_id: user.id,
    title: payload.title,
    description: payload.description,
    category: payload.category,
    cover_image_url: payload.thumbnailUrl ?? null,
    visibility: payload.visibility,
    status: "draft",
  };

  const { data, error } = await supabase
    .from("courses")
    .insert(insertData)
    .select("*, instructor:profiles!courses_instructor_id_fkey(*)")
    .single();

  if (error) {
    throw new Error(`Failed to create course: ${error.message}`);
  }

  const profileData = data.instructor as ProfileRow | null;
  const instructor: CourseInstructor = profileData
    ? mapProfileToInstructor(profileData)
    : { id: data.instructor_id, name: "Unknown" };

  return mapCourseRowToDetail(data, instructor);
}

/**
 * Update an existing course by ID.
 */
export async function updateCourse(
  courseId: string,
  payload: UpdateCoursePayload
): Promise<Course> {
  const supabase = createClient();

  const updateData: Database["public"]["Tables"]["courses"]["Update"] = {};

  if (payload.title !== undefined) updateData.title = payload.title;
  if (payload.description !== undefined)
    updateData.description = payload.description;
  if (payload.category !== undefined) updateData.category = payload.category;
  if (payload.thumbnailUrl !== undefined)
    updateData.cover_image_url = payload.thumbnailUrl;
  if (payload.visibility !== undefined)
    updateData.visibility = payload.visibility;
  if (payload.status !== undefined) updateData.status = payload.status;

  const { data, error } = await supabase
    .from("courses")
    .update(updateData)
    .eq("id", courseId)
    .select("*, instructor:profiles!courses_instructor_id_fkey(*)")
    .single();

  if (error) {
    throw new Error(`Failed to update course: ${error.message}`);
  }

  const profileData = data.instructor as ProfileRow | null;
  const instructor: CourseInstructor = profileData
    ? mapProfileToInstructor(profileData)
    : { id: data.instructor_id, name: "Unknown" };

  return mapCourseRowToDetail(data, instructor);
}

/**
 * Delete a course by ID.
 */
export async function deleteCourse(courseId: string): Promise<void> {
  const supabase = createClient();

  const { error } = await supabase
    .from("courses")
    .delete()
    .eq("id", courseId);

  if (error) {
    throw new Error(`Failed to delete course: ${error.message}`);
  }
}

/**
 * Archive a course (set status to 'archived').
 */
export async function archiveCourse(courseId: string): Promise<Course> {
  return updateCourse(courseId, { status: "archived" });
}

// ---------------------------------------------------------------------------
// Enrollment Functions
// ---------------------------------------------------------------------------

/**
 * Enroll the currently authenticated user in a course.
 */
export async function enrollInCourse(
  courseId: string
): Promise<EnrollmentRow> {
  const supabase = createClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError ?? !user) {
    throw new Error("Authentication required to enroll in a course");
  }

  const { data, error } = await supabase
    .from("course_enrollments")
    .insert({
      course_id: courseId,
       
      student_id: user.id,
      status: "active",
    })
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to enroll in course: ${error.message}`);
  }

  return data;
}

/**
 * Enroll the currently authenticated user using a course invite code.
 */
export async function enrollWithCode(
  inviteCode: string
): Promise<EnrollmentRow> {
  const supabase = createClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError ?? !user) {
    throw new Error("Authentication required to enroll with invite code");
  }

  // Look up the course by invite code
  const { data: courseData, error: courseError } = await supabase
    .from("courses")
    .select("id")
    .eq("invite_code", inviteCode.toUpperCase())
    .single();

  if (courseError) {
    throw new Error("Invalid or expired invite code");
  }

  const { data, error } = await supabase
    .from("course_enrollments")
    .insert({
      course_id: courseData.id,
       
      student_id: user.id,
      status: "active",
    })
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to enroll with invite code: ${error.message}`);
  }

  return data;
}

/**
 * Generate a new invite code for a course and persist it.
 */
export async function generateInviteCode(
  courseId: string
): Promise<InviteCodeResponse> {
  const supabase = createClient();

  const code = generateRandomCode();

  const { error } = await supabase
    .from("courses")
    .update({ invite_code: code })
    .eq("id", courseId);

  if (error) {
    throw new Error(`Failed to generate invite code: ${error.message}`);
  }

  return { code };
}

// ---------------------------------------------------------------------------
// Student Management Functions
// ---------------------------------------------------------------------------

/**
 * Fetch the list of enrolled students for a course (instructor view).
 * Joins course_enrollments with profiles to get student display info.
 */
export async function fetchCourseStudents(
  courseId: string
): Promise<StudentProgress[]> {
  const supabase = createClient();

  const { data, error } = await supabase
    .from("course_enrollments")
    .select(
      "student_id, enrolled_at, progress_percent, student:profiles!course_enrollments_student_id_fkey(display_name, avatar_url)"
    )
    .eq("course_id", courseId)
    .eq("status", "active");

  if (error) {
    throw new Error(`Failed to fetch course students: ${error.message}`);
  }

  return data.map((row) => {
    const profile = row.student as
      | Pick<ProfileRow, "display_name" | "avatar_url">
      | null;

    return {
      userId: row.student_id,
      name: profile?.display_name ?? "Unknown Student",
      avatarUrl: profile?.avatar_url ?? undefined,
      enrolledAt: row.enrolled_at,
      progressPercent: row.progress_percent,
    };
  });
}

/**
 * Fetch the current user's enrollment/progress data for a course.
 */
export async function fetchCourseProgress(
  courseId: string
): Promise<CourseEnrollment> {
  const supabase = createClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError ?? !user) {
    throw new Error("Authentication required to fetch course progress");
  }

  const { data, error } = await supabase
    .from("course_enrollments")
    .select("*")
    .eq("course_id", courseId)
     
    .eq("student_id", user.id)
    .single();

  if (error) {
    throw new Error(`Failed to fetch course progress: ${error.message}`);
  }

  return {
    courseId: data.course_id,
    userId: data.student_id,
    enrolledAt: data.enrolled_at,
    progressPercent: data.progress_percent,
    completedMaterialIds: [],
  };
}

/**
 * Remove a student from a course (instructor only).
 * Sets the enrollment status to 'dropped' rather than hard-deleting.
 */
export async function removeStudent(
  courseId: string,
  studentId: string
): Promise<void> {
  const supabase = createClient();

  const { error } = await supabase
    .from("course_enrollments")
    .update({ status: "dropped" })
    .eq("course_id", courseId)
    .eq("student_id", studentId);

  if (error) {
    throw new Error(`Failed to remove student: ${error.message}`);
  }
}
