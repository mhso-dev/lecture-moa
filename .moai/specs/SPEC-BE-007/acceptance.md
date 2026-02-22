---
id: SPEC-BE-007
title: "Dashboard Backend Integration - Acceptance Criteria"
version: 1.0.0
status: completed
created: 2026-02-22
---

# SPEC-BE-007: Acceptance Criteria

## 1. Schema Additions

### AC-070: Team Members Last Active Column

**Given** the `team_members` table exists
**When** migration 00016 is applied
**Then** the `last_active_at` column of type `TIMESTAMPTZ` with default `now()` shall exist on `team_members`
**And** existing rows shall have `last_active_at` set to their default value

### AC-071: Dashboard Composite Indexes

**Given** the database tables exist with data
**When** migration 00016 is applied
**Then** the following indexes shall exist:
- `idx_course_enrollments_status` on `course_enrollments(status)`
- `idx_quiz_attempts_status` on `quiz_attempts(status)`
- `idx_quiz_attempts_quiz_student` on `quiz_attempts(quiz_id, student_id)`
- `idx_questions_course_status` on `questions(course_id, status)`
- `idx_courses_instructor_status` on `courses(instructor_id, status)`
- `idx_team_members_user_team` on `team_members(user_id, team_id)`

**And** running `EXPLAIN ANALYZE` on dashboard views shall show index scans (not sequential scans) for filtered queries

---

## 2. Student Dashboard Views

### AC-072: Student Enrolled Courses View

**Given** a student is enrolled in 3 courses with varying progress
**When** querying `v_student_enrolled_courses` as that student
**Then** the result shall contain exactly 3 rows
**And** each row shall include: enrollment_id, course_id, title, instructor_name, progress_percent, last_accessed_at, student_id
**And** only active enrollments are returned (dropped/completed excluded)
**And** results are ordered by enrolled_at DESC

**Given** a student is enrolled in 0 courses
**When** querying `v_student_enrolled_courses` as that student
**Then** the result shall be an empty set (0 rows)

**Given** two students are enrolled in different courses
**When** student A queries `v_student_enrolled_courses`
**Then** only student A's enrollments are returned (RLS enforcement)

### AC-073: Student Q&A Activity View

**Given** a student has asked 15 questions across multiple courses
**When** querying `v_student_qa_activity` as that student
**Then** the result shall contain at most 10 rows (most recent)
**And** each row shall include: question_id, question_excerpt (max 80 chars), course_name, status, created_at, author_id
**And** questions with answer_count > 0 shall have status = 'answered'
**And** questions with answer_count = 0 shall have status = 'pending'
**And** results are ordered by created_at DESC

**Given** a student has asked 0 questions
**When** querying `v_student_qa_activity` as that student
**Then** the result shall be an empty set

### AC-074: Student Quiz Results View

**Given** a student has completed 8 graded quiz attempts
**When** querying `v_student_quiz_results` as that student
**Then** the result shall contain 8 rows (or at most 10)
**And** each row shall include: attempt_id, quiz_title, course_name, score, total_points, taken_at
**And** only graded attempts are returned (in_progress/submitted excluded)
**And** results are ordered by submitted_at DESC

### AC-075: Student Upcoming Quizzes View

**Given** a student is enrolled in a course with 2 published quizzes: one already attempted, one not
**When** querying `v_student_upcoming_quizzes` as that student
**Then** the result shall contain 1 row (the unattempted quiz)
**And** each row shall include: quiz_id, quiz_title, course_name, question_count, due_date
**And** results are ordered by due_date ASC NULLS LAST

**Given** a student is enrolled in a course with a published quiz that has been submitted
**When** querying `v_student_upcoming_quizzes` as that student
**Then** the submitted quiz shall NOT appear in results

---

## 3. Instructor Dashboard Views

### AC-076: Instructor Courses Overview View

**Given** an instructor has created 5 courses (3 published, 2 draft)
**When** querying `v_instructor_courses_overview` as that instructor
**Then** the result shall contain 5 rows
**And** each row shall include: course_id, title, enrolled_count, materials_count, pending_qa_count, is_published, instructor_id
**And** enrolled_count reflects only active enrollments
**And** materials_count reflects only published materials
**And** pending_qa_count reflects only OPEN questions
**And** is_published is true for published courses, false otherwise

**Given** another instructor queries the same view
**Then** only their own courses are returned (RLS enforcement)

### AC-077: Instructor Pending Q&A View

**Given** an instructor's courses have 5 OPEN questions, 2 older than 48 hours
**When** querying `v_instructor_pending_qa` as that instructor
**Then** the result shall contain 5 rows
**And** each row shall include: question_id, question_excerpt, student_name, course_name, asked_at, is_urgent, instructor_id
**And** 2 rows shall have is_urgent = true
**And** results are ordered by created_at ASC (oldest first)

**Given** an instructor's courses have 0 OPEN questions
**When** querying `v_instructor_pending_qa`
**Then** the result shall be an empty set

### AC-078: Instructor Quiz Performance View

**Given** an instructor has a quiz with 20 graded attempts, passing_score = 60
**When** querying `v_instructor_quiz_performance` as that instructor
**Then** the result shall include a row for that quiz with:
- average_score: calculated as AVG(score/total_points * 100)
- submission_count: 20
- pass_rate: percentage of attempts scoring >= 60% of total_points
**And** quiz_title and course_name are correctly populated

**Given** a quiz with 0 graded attempts
**When** querying `v_instructor_quiz_performance`
**Then** that quiz shall appear with submission_count = 0, average_score = NULL or 0, pass_rate = 0

### AC-079: Team Views

**v_team_overview:**
**Given** a user is a member of a team with 5 members
**When** querying `v_team_overview` for that team
**Then** the result shall include: team_id, team_name, course_name, member_count (5), description, created_at

**v_team_members_detail:**
**Given** a team has 5 members
**When** querying `v_team_members_detail` for that team
**Then** the result shall contain 5 rows with: member_id, team_id, user_id, display_name, avatar_url, role, last_active_at

**v_team_shared_memos:**
**Given** a team has 10 shared memos (3 drafts, 7 published)
**When** querying `v_team_shared_memos` for that team
**Then** the result shall contain 7 rows (drafts excluded)
**And** each row shall include: memo_id, title, author_name, excerpt (max 120 chars), updated_at, team_id
**And** results are ordered by updated_at DESC

---

## 4. Dashboard Functions

### AC-080: Student Study Progress Function

**Given** a student has been active on 5 consecutive days ending today
**When** calling `get_student_study_progress(auth.uid())`
**Then** the result JSON shall include:
- currentStreak >= 5
- longestStreak >= 5
- totalSessions >= 5
- materialsRead >= 0

**Given** a student has no activity at all
**When** calling `get_student_study_progress(auth.uid())`
**Then** the result JSON shall be: `{"currentStreak": 0, "longestStreak": 0, "totalSessions": 0, "materialsRead": 0}`

**Given** a student had a 10-day streak that ended 3 days ago, then 2 days of activity today and yesterday
**When** calling `get_student_study_progress(auth.uid())`
**Then** currentStreak = 2 and longestStreak = 10

### AC-081: Instructor Student Activity Stats Function

**Given** an instructor has 2 courses with 50 total active students, 30 active in last 7 days
**When** calling `get_student_activity_stats(auth.uid())`
**Then** the result JSON shall include:
- totalStudents: 50
- activeStudents7d: 30
- avgCompletionRate: calculated average
- studySessions7d: total distinct (student, day) pairs

**Given** a non-instructor user calls the function with a different instructor's ID
**When** calling `get_student_activity_stats(other_instructor_id)`
**Then** the function shall validate auth.uid() matches the parameter and return data only for the authenticated user

### AC-082: Instructor Activity Feed Function

**Given** an instructor's courses have recent activity (enrollments, questions, quiz attempts)
**When** calling `get_instructor_activity_feed(auth.uid(), 10, 0)`
**Then** the result shall contain up to 10 rows ordered by created_at DESC
**And** each row shall include: id, type, actor_name, course_name, created_at
**And** type values are one of: 'enrollment', 'question', 'quiz_attempt'

**Given** calling with p_offset = 10
**When** calling `get_instructor_activity_feed(auth.uid(), 10, 10)`
**Then** the result shall contain the next page of results (rows 11-20)

**Given** a user calls with a mismatched instructor_id
**When** calling `get_instructor_activity_feed(other_user_id, 10, 0)`
**Then** the function shall raise error P0008

### AC-083: Team Activity Feed Function

**Given** a team has recent memos, questions by members, and new member joins
**When** calling `get_team_activity_feed(team_id, 10, 0)` as a team member
**Then** the result shall contain up to 10 rows ordered by created_at DESC
**And** each row shall include: id, type, actor_name, description, created_at
**And** type values are one of: 'memo', 'question', 'member_joined'

**Given** a non-member calls the function
**When** calling `get_team_activity_feed(team_id, 10, 0)` as a non-member
**Then** the function shall raise error P0009

---

## 5. Supabase Query Layer

### AC-084: Dashboard Query Module Structure

**Given** the dashboard query module exists at `apps/web/lib/supabase/dashboard.ts`
**Then** it shall export all query functions listed in REQ-BE-085 and REQ-BE-086
**And** each function accepts a `SupabaseClient` as its first parameter
**And** all functions return properly typed results matching `packages/shared` types
**And** snake_case to camelCase mapping is applied to all returned data

### AC-085: Student Query Functions

**Given** a valid Supabase client with an authenticated student session
**When** calling `fetchEnrolledCourses(supabase)`
**Then** the result shall be typed as `EnrolledCourse[]` with camelCase properties
**And** the underlying query targets `v_student_enrolled_courses`

**Given** a Supabase error occurs during query
**When** the query function catches the error
**Then** it shall throw a descriptive error with the original Supabase error message

(Same pattern applies to all 6 student query functions)

### AC-086: Instructor and Team Query Functions

**Given** a valid Supabase client with an authenticated instructor session
**When** calling `fetchActivityFeed(supabase, 1, 10)`
**Then** the result shall be typed as `PaginatedResponse<ActivityFeedItem>`
**And** the underlying call uses `supabase.rpc('get_instructor_activity_feed', {...})`

**Given** a valid Supabase client with an authenticated team member session
**When** calling `fetchTeamOverview(supabase, teamId)`
**Then** the result shall be typed as `TeamOverview` with camelCase properties
**And** the underlying query targets `v_team_overview` filtered by team_id

---

## 6. Frontend Hook Migration

### AC-087: Student Hook Migration

**Given** `useStudentDashboard.ts` is updated
**Then** it shall NOT import from `~/lib/api` or `~/lib/api-endpoints`
**And** it shall import from `~/lib/supabase/dashboard`
**And** all query keys in `studentDashboardKeys` shall remain unchanged
**And** stale times shall remain: METRICS = 2 minutes, NOTIFICATIONS = 30 seconds
**And** all TypeScript return types shall remain unchanged
**And** `useEnrolledCourses()` queryFn calls `fetchEnrolledCourses(supabase)`
**And** `useRecentQA()` queryFn calls `fetchRecentQA(supabase)`
**And** `useQuizResults()` queryFn calls `fetchQuizResults(supabase)`
**And** `useStudyProgress()` queryFn calls `fetchStudyProgress(supabase)`
**And** `useUpcomingQuizzes()` queryFn calls `fetchUpcomingQuizzes(supabase)`
**And** `useQANotifications()` queryFn calls `fetchQANotifications(supabase)`

### AC-088: Instructor Hook Migration

**Given** `useInstructorDashboard.ts` is updated
**Then** it shall NOT import from `~/lib/api` or `~/lib/api-endpoints`
**And** all query keys in `instructorDashboardKeys` shall remain unchanged
**And** stale times shall remain: METRICS = 2 minutes, PENDING_QA = 1 minute
**And** `useActivityFeed({ page })` correctly passes page and limit to RPC function

### AC-089: Team Hook Migration

**Given** `useTeamDashboard.ts` is updated
**Then** it shall NOT import from `~/lib/api` or `~/lib/api-endpoints`
**And** all query keys in `teamDashboardKeys` shall remain unchanged
**And** stale times shall remain: OVERVIEW = 2 minutes, ACTIVITY = 30 seconds
**And** all team query functions receive the `teamId` parameter
**And** `useSharedMemos({ page })` correctly passes teamId, page, and limit
**And** `useTeamActivity({ page })` correctly passes teamId, page, and limit

---

## 7. Performance

### AC-090: Query Performance Targets

**Given** source tables contain up to 10,000 rows each
**When** executing any dashboard view query
**Then** the query shall complete within 200ms

**Given** source tables contain up to 10,000 rows each
**When** executing any dashboard RPC function
**Then** the function shall complete within 500ms

**Given** the composite indexes from REQ-BE-071 are created
**When** running `EXPLAIN ANALYZE` on dashboard view queries
**Then** index scans shall be used instead of sequential scans on filtered columns

---

## 8. Security

### AC-091: Data Isolation

**Given** two students (A and B) are enrolled in different courses
**When** student A queries any student dashboard view
**Then** only student A's data is returned (no data from student B)

**Given** two instructors with separate courses
**When** instructor A queries any instructor dashboard view
**Then** only instructor A's course data is returned

**Given** a user who is NOT a member of team X
**When** the user calls `get_team_activity_feed(team_x_id, 10, 0)`
**Then** the function raises exception P0009

**Given** a SECURITY DEFINER function is called
**When** inspecting the function definition
**Then** `SET search_path = public` shall be present
**And** `auth.uid()` validation shall be present before data access

---

## 9. Definition of Done

- [ ] All 3 migration files created and applied successfully via `supabase db reset`
- [ ] 10 views return correct data when queried with authenticated Supabase client
- [ ] 4 functions return correct data and enforce authorization
- [ ] `lib/supabase/dashboard.ts` exports all 15 query functions with correct types
- [ ] All 3 hook files migrated from `api.get()` to Supabase queries
- [ ] Supabase types regenerated with `supabase gen types typescript`
- [ ] Existing 201 dashboard tests pass (with updated mocks)
- [ ] `EXPLAIN ANALYZE` confirms index usage on all dashboard views
- [ ] No sequential scans on filtered columns with the new composite indexes
- [ ] All SECURITY DEFINER functions have `SET search_path = public`
- [ ] RLS data isolation verified for student, instructor, and team boundaries
- [ ] Performance targets met: views < 200ms, functions < 500ms
- [ ] No remaining `api.get()` calls for dashboard data in hook files
- [ ] Dashboard endpoint constants removed from `api-endpoints.ts`
