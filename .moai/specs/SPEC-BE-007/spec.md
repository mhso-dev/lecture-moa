---
id: SPEC-BE-007
title: "Dashboard Backend Integration"
version: 1.1.0
status: completed
created: 2026-02-22
updated: 2026-02-22
author: MoAI
priority: high
tags: [backend, supabase, postgresql, dashboard, views, functions, rls, performance, student, instructor, team]
related_specs: [SPEC-FE-003, SPEC-BE-003, SPEC-BE-004, SPEC-BE-005, SPEC-BE-006]
---

## HISTORY

| Version | Date | Author | Description |
|---------|------|--------|-------------|
| 1.0.0 | 2026-02-22 | MoAI | Initial SPEC: DB views, functions, indexes, Supabase query layer, frontend hook migration |
| 1.1.0 | 2026-02-22 | MoAI | Marked completed with implementation notes |

---

# SPEC-BE-007: Dashboard Backend Integration

## 1. Environment

### 1.1 Technology Stack

| Category | Technology | Version |
|----------|-----------|---------|
| Database | PostgreSQL (Supabase) | 16.x |
| Client Library | @supabase/supabase-js | latest |
| SSR Helpers | @supabase/ssr | latest |
| Frontend Data Fetching | TanStack Query | v5 |
| Frontend Framework | Next.js (App Router) | 15.x |
| Language | TypeScript | 5.x |
| Shared Types | packages/shared | monorepo |

### 1.2 Scope Context

This SPEC implements the backend data layer for the dashboard views defined in SPEC-FE-003. The frontend dashboard is fully implemented with TanStack Query hooks and widget components, but currently references a non-existent REST API (`api.get()` calls). This SPEC replaces the REST API layer with direct Supabase queries using PostgreSQL views and functions, and updates the frontend hooks accordingly.

### 1.3 Architectural Approach

The implementation follows the Supabase-centric architecture defined in `tech.md`: the frontend queries Supabase directly using the typed client, with RLS policies enforcing authorization at the database layer. Complex aggregations use `SECURITY DEFINER` functions to bypass RLS overhead while maintaining security.

```
Frontend Hooks -> lib/supabase/dashboard.ts -> Supabase Client -> PostgreSQL Views/Functions
```

### 1.4 Database Context

- 15 existing tables (profiles, courses, course_enrollments, materials, questions, answers, votes, teams, team_members, memos, quizzes, quiz_questions, quiz_attempts, quiz_answers, notifications)
- Existing RLS helper functions: get_user_role(), is_course_instructor(), is_course_enrolled(), is_team_member()
- Existing DB functions: start_quiz_attempt(), submit_and_grade_quiz(), duplicate_quiz(), update_vote_count(), update_answer_count()
- Migration numbering: next available is 00016

### 1.5 Affected Files

| Category | Files | Action |
|----------|-------|--------|
| Migration | `supabase/migrations/00016_dashboard_schema_additions.sql` | CREATE |
| Migration | `supabase/migrations/00017_dashboard_views.sql` | CREATE |
| Migration | `supabase/migrations/00018_dashboard_functions.sql` | CREATE |
| Query Layer | `apps/web/lib/supabase/dashboard.ts` | CREATE |
| Hooks | `apps/web/hooks/dashboard/useStudentDashboard.ts` | MODIFY |
| Hooks | `apps/web/hooks/dashboard/useInstructorDashboard.ts` | MODIFY |
| Hooks | `apps/web/hooks/dashboard/useTeamDashboard.ts` | MODIFY |
| Types | `apps/web/types/supabase.ts` | REGENERATE (supabase gen types typescript) |
| Endpoints | `apps/web/lib/api-endpoints.ts` | REMOVE dashboard sections (no longer needed) |

---

## 2. Assumptions

### 2.1 Database Assumptions

- All 15 tables defined in migrations 00001-00009 exist and are populated with data conforming to their schemas.
- RLS policies from migration 00012 are active and enforced on all tables.
- The `auth.uid()` function reliably returns the authenticated user's UUID in all database contexts invoked via the Supabase client.
- Existing indexes from migration 00010 cover primary query patterns; this SPEC adds composite indexes optimized for dashboard aggregation queries.

### 2.2 Data Assumptions

- Study progress is approximated from existing data (quiz_attempts timestamps, questions created_at, course_enrollments enrolled_at). No dedicated study session tracking table exists or is introduced.
- "Active students in last 7 days" is defined as students with any database activity (quiz attempt, question, answer, or memo) within the past 7 days.
- "Urgent Q&A" for instructors is defined as open questions older than 48 hours.
- Team activity is derived from memos with `visibility = 'team'` and questions posted in courses associated with the team.

### 2.3 Frontend Assumptions

- SPEC-FE-003 is fully implemented: all dashboard hooks (`useStudentDashboard.ts`, `useInstructorDashboard.ts`, `useTeamDashboard.ts`), widget components, and shared types exist.
- The current hooks use `api.get()` from `~/lib/api.ts` which will be replaced with Supabase client calls.
- TypeScript types for dashboard data (EnrolledCourse, QAActivityItem, QuizResult, etc.) are defined in `packages/shared/src/types/dashboard.types.ts`.
- TanStack Query key structures and stale time configurations will be preserved.

### 2.4 Security Assumptions

- Views inherit RLS policies from their underlying tables when queried via the Supabase client with the user's JWT.
- `SECURITY DEFINER` functions bypass RLS but receive the user ID as an explicit parameter (`auth.uid()` called inside the function) to ensure data isolation.
- All `SECURITY DEFINER` functions use `SET search_path = public` to prevent search path injection attacks.

---

## 3. Requirements

### 3.1 Schema Additions (REQ-BE-070 through REQ-BE-071)

#### REQ-BE-070: Team Members Last Active Tracking

**When** a team member performs any activity (creates a memo, posts a question, submits a quiz attempt) within a team context, **then** the system shall have a `last_active_at` column on the `team_members` table to track this timestamp.

- Add column: `team_members.last_active_at TIMESTAMPTZ DEFAULT now()`
- This column is updated by application logic or a trigger when team-relevant activity occurs.
- Used by the Team Members Widget (REQ-FE-232) to show member activity status.

#### REQ-BE-071: Dashboard Composite Indexes

The system shall provide composite indexes optimized for dashboard query patterns to ensure sub-second response times.

Required indexes:
1. `idx_course_enrollments_status` on `course_enrollments(status)` - active student count filtering
2. `idx_quiz_attempts_status` on `quiz_attempts(status)` - graded attempt aggregation
3. `idx_quiz_attempts_quiz_student` on `quiz_attempts(quiz_id, student_id)` - composite for attempt lookup
4. `idx_questions_course_status` on `questions(course_id, status)` - composite for open question count
5. `idx_courses_instructor_status` on `courses(instructor_id, status)` - composite for published course filtering
6. `idx_team_members_user_team` on `team_members(user_id, team_id)` - composite for team lookup

---

### 3.2 Student Dashboard Views (REQ-BE-072 through REQ-BE-075)

#### REQ-BE-072: Student Enrolled Courses View

The system shall provide a view `v_student_enrolled_courses` that returns enrolled course data with instructor name and progress for the authenticated student.

- Columns: `enrollment_id`, `course_id`, `title`, `instructor_name`, `progress_percent`, `last_accessed_at`, `student_id`
- Joins: `course_enrollments` -> `courses` -> `profiles` (instructor)
- Filter: `course_enrollments.status = 'active'`
- The `last_accessed_at` is derived from `course_enrollments.enrolled_at` (updated via application logic).
- Order: by `enrolled_at DESC`

#### REQ-BE-073: Student Q&A Activity View

The system shall provide a view `v_student_qa_activity` that returns the student's recent Q&A interactions.

- Columns: `question_id`, `question_excerpt` (first 80 chars of title), `course_name`, `status`, `created_at`, `author_id`
- Joins: `questions` -> `courses`
- Filter: `questions.author_id = auth.uid()`
- Status mapping: questions with `answer_count > 0` -> `'answered'`, else -> `'pending'`
- Order: by `created_at DESC`
- Limit: 10 most recent

#### REQ-BE-074: Student Quiz Results View

The system shall provide a view `v_student_quiz_results` that returns the student's graded quiz scores.

- Columns: `attempt_id`, `quiz_title`, `course_name`, `score`, `total_points`, `taken_at` (submitted_at), `student_id`
- Joins: `quiz_attempts` -> `quizzes` -> `courses`
- Filter: `quiz_attempts.status = 'graded'` AND `quiz_attempts.student_id = auth.uid()`
- Order: by `submitted_at DESC`
- Limit: 10 most recent

#### REQ-BE-075: Student Upcoming Quizzes View

The system shall provide a view `v_student_upcoming_quizzes` that returns published quizzes the student has not yet taken.

- Columns: `quiz_id`, `quiz_title`, `course_name`, `question_count`, `due_date`, `student_id`
- Joins: `quizzes` -> `courses` -> `course_enrollments`, LEFT JOIN `quiz_attempts`
- Filter: `quizzes.status = 'published'` AND student is enrolled AND no existing attempt (or no submitted attempt)
- `question_count`: subquery count from `quiz_questions`
- Order: by `due_date ASC NULLS LAST`

---

### 3.3 Instructor Dashboard Views (REQ-BE-076 through REQ-BE-079)

#### REQ-BE-076: Instructor Courses Overview View

The system shall provide a view `v_instructor_courses_overview` that returns the instructor's courses with aggregated counts.

- Columns: `course_id`, `title`, `enrolled_count`, `materials_count`, `pending_qa_count`, `is_published`, `instructor_id`
- `enrolled_count`: COUNT of active enrollments
- `materials_count`: COUNT of published materials
- `pending_qa_count`: COUNT of questions with status = 'OPEN' in the course
- `is_published`: derived from `courses.status = 'published'`
- Filter: `courses.instructor_id = auth.uid()`
- Order: by `courses.created_at DESC`

#### REQ-BE-077: Instructor Pending Q&A View

The system shall provide a view `v_instructor_pending_qa` that returns unanswered questions across the instructor's courses.

- Columns: `question_id`, `question_excerpt` (first 80 chars of title), `student_name`, `course_name`, `asked_at` (created_at), `is_urgent`, `instructor_id`
- `is_urgent`: `TRUE` when `created_at < now() - interval '48 hours'`
- Joins: `questions` -> `courses`, `questions` -> `profiles` (author)
- Filter: `questions.status = 'OPEN'` AND `courses.instructor_id = auth.uid()`
- Order: by `created_at ASC` (oldest first)

#### REQ-BE-078: Instructor Quiz Performance View

The system shall provide a view `v_instructor_quiz_performance` that returns quiz performance statistics for the instructor's quizzes.

- Columns: `quiz_id`, `quiz_title`, `course_name`, `average_score`, `submission_count`, `pass_rate`, `instructor_id`
- `average_score`: AVG(score / total_points * 100) from graded attempts
- `submission_count`: COUNT of graded attempts
- `pass_rate`: percentage of graded attempts where score >= quiz passing_score (or 60% default)
- Joins: `quizzes` -> `courses`, `quizzes` -> `quiz_attempts`
- Filter: `courses.instructor_id = auth.uid()` AND `quiz_attempts.status = 'graded'`
- Order: by `quizzes.created_at DESC`

#### REQ-BE-079: Team Overview and Members Views

The system shall provide views for team dashboard data.

**v_team_overview:**
- Columns: `team_id`, `team_name`, `course_name`, `member_count`, `description`, `created_at`
- Joins: `teams` -> `courses`, `teams` -> `team_members` (COUNT)
- Filter: accessible to team members only (via RLS)

**v_team_members_detail:**
- Columns: `member_id`, `team_id`, `user_id`, `display_name`, `avatar_url`, `role`, `last_active_at`
- Joins: `team_members` -> `profiles`
- Filter: accessible to team members only (via RLS)

**v_team_shared_memos:**
- Columns: `memo_id`, `title`, `author_name`, `excerpt` (first 120 chars of content), `updated_at`, `team_id`
- Joins: `memos` -> `profiles` (author)
- Filter: `memos.visibility = 'team'` AND `memos.is_draft = false`
- Order: by `updated_at DESC`

---

### 3.4 Dashboard Functions (REQ-BE-080 through REQ-BE-083)

#### REQ-BE-080: Student Study Progress Function

**When** the student dashboard requests study progress data, **then** the system shall provide a function `get_student_study_progress(p_user_id UUID)` that returns approximate study metrics as JSON.

- Return type: `JSON` with fields `{ currentStreak, longestStreak, totalSessions, materialsRead }`
- `currentStreak`: consecutive days with activity (quiz attempt, question, or answer), counting backward from today
- `longestStreak`: maximum consecutive activity days in the last 90 days
- `totalSessions`: distinct activity days in the last 90 days
- `materialsRead`: count of distinct materials the student has interacted with (via questions or quiz attempts linked to materials)
- Language: PL/pgSQL
- Security: `SECURITY DEFINER` with `SET search_path = public`
- Error handling: returns `{"currentStreak": 0, "longestStreak": 0, "totalSessions": 0, "materialsRead": 0}` for users with no activity

#### REQ-BE-081: Instructor Student Activity Stats Function

**When** the instructor dashboard requests student activity statistics, **then** the system shall provide a function `get_student_activity_stats(p_instructor_id UUID)` that returns aggregated student metrics as JSON.

- Return type: `JSON` with fields `{ totalStudents, activeStudents7d, avgCompletionRate, studySessions7d }`
- `totalStudents`: count of distinct students with active enrollment in instructor's courses
- `activeStudents7d`: count of students with any activity in last 7 days across instructor's courses
- `avgCompletionRate`: average `progress_percent` from active enrollments in instructor's courses
- `studySessions7d`: total distinct (student, day) activity pairs in last 7 days
- Language: PL/pgSQL
- Security: `SECURITY DEFINER` with `SET search_path = public`
- Validates that `p_instructor_id` matches `auth.uid()` before execution

#### REQ-BE-082: Instructor Activity Feed Function

**When** the instructor dashboard requests the activity feed, **then** the system shall provide a function `get_instructor_activity_feed(p_instructor_id UUID, p_limit INT DEFAULT 10, p_offset INT DEFAULT 0)` that returns a paginated activity feed.

- Return type: `TABLE(id UUID, type TEXT, actor_name TEXT, course_name TEXT, created_at TIMESTAMPTZ)`
- Activity types: `'enrollment'` (new enrollment), `'question'` (new question), `'quiz_attempt'` (quiz submitted), `'material_view'` (approximated)
- Sources: UNION ALL from `course_enrollments`, `questions`, `quiz_attempts` filtered to instructor's courses
- Language: PL/pgSQL
- Security: `SECURITY DEFINER` with `SET search_path = public`
- Validates that `p_instructor_id` matches `auth.uid()` before execution
- Error code `P0008`: unauthorized access if user ID mismatch

#### REQ-BE-083: Team Activity Feed Function

**When** the team dashboard requests the activity timeline, **then** the system shall provide a function `get_team_activity_feed(p_team_id UUID, p_limit INT DEFAULT 10, p_offset INT DEFAULT 0)` that returns a paginated team activity feed.

- Return type: `TABLE(id UUID, type TEXT, actor_name TEXT, description TEXT, created_at TIMESTAMPTZ)`
- Activity types: `'memo'` (shared memo created/updated), `'question'` (question posted by team member), `'member_joined'` (new team member)
- Sources: UNION ALL from `memos` (team visibility), `questions` (by team members), `team_members` (joined_at)
- Language: PL/pgSQL
- Security: `SECURITY DEFINER` with `SET search_path = public`
- Validates team membership via `is_team_member(p_team_id)` before execution
- Error code `P0009`: unauthorized access if not a team member

---

### 3.5 Supabase Query Layer (REQ-BE-084 through REQ-BE-086)

#### REQ-BE-084: Dashboard Query Module

The system shall provide a Supabase query module at `apps/web/lib/supabase/dashboard.ts` that encapsulates all dashboard data fetching.

- Uses `createClient()` from `~/lib/supabase/client.ts` (browser) or `~/lib/supabase/server.ts` (RSC)
- Each query function is typed using the auto-generated Supabase types
- Functions follow the naming convention: `fetch{WidgetName}(supabase: SupabaseClient)` for browser and `fetch{WidgetName}Server()` for server-side
- Handles error mapping: Supabase errors are caught and thrown as typed dashboard errors
- camelCase mapping: transforms snake_case database column names to camelCase TypeScript properties

#### REQ-BE-085: Student Dashboard Queries

The system shall provide the following query functions for the student dashboard:

1. `fetchEnrolledCourses(supabase)` - queries `v_student_enrolled_courses`, returns `EnrolledCourse[]`
2. `fetchRecentQA(supabase)` - queries `v_student_qa_activity`, returns `QAActivityItem[]`
3. `fetchQuizResults(supabase)` - queries `v_student_quiz_results`, returns `QuizResult[]`
4. `fetchStudyProgress(supabase)` - calls `get_student_study_progress()` RPC, returns `StudyProgress`
5. `fetchUpcomingQuizzes(supabase)` - queries `v_student_upcoming_quizzes`, returns `UpcomingQuiz[]`
6. `fetchQANotifications(supabase)` - queries `notifications` table filtered by user, returns `QANotification[]`

#### REQ-BE-086: Instructor and Team Dashboard Queries

The system shall provide the following query functions:

**Instructor:**
1. `fetchInstructorCourses(supabase)` - queries `v_instructor_courses_overview`, returns `InstructorCourse[]`
2. `fetchStudentActivityStats(supabase)` - calls `get_student_activity_stats()` RPC, returns `StudentActivityStats`
3. `fetchPendingQA(supabase)` - queries `v_instructor_pending_qa`, returns `PendingQAItem[]`
4. `fetchQuizPerformance(supabase)` - queries `v_instructor_quiz_performance`, returns `QuizPerformanceSummary[]`
5. `fetchActivityFeed(supabase, page, limit)` - calls `get_instructor_activity_feed()` RPC, returns `PaginatedResponse<ActivityFeedItem>`

**Team:**
1. `fetchTeamOverview(supabase, teamId)` - queries `v_team_overview`, returns `TeamOverview`
2. `fetchTeamMembers(supabase, teamId)` - queries `v_team_members_detail`, returns `TeamMember[]`
3. `fetchSharedMemos(supabase, teamId, page, limit)` - queries `v_team_shared_memos`, returns `PaginatedResponse<SharedMemo>`
4. `fetchTeamActivityFeed(supabase, teamId, page, limit)` - calls `get_team_activity_feed()` RPC, returns `PaginatedResponse<TeamActivityItem>`

---

### 3.6 Frontend Hook Migration (REQ-BE-087 through REQ-BE-089)

#### REQ-BE-087: Student Hook Migration

**When** the student dashboard hooks are updated, **then** the system shall replace all `api.get()` calls with Supabase query functions from `lib/supabase/dashboard.ts`.

- File: `apps/web/hooks/dashboard/useStudentDashboard.ts`
- Replace: `import { api } from "~/lib/api"` with `import { fetch* } from "~/lib/supabase/dashboard"`
- Replace: `import { STUDENT_DASHBOARD_ENDPOINTS } from "~/lib/api-endpoints"` (remove)
- Preserve: existing query key structures (`studentDashboardKeys`)
- Preserve: existing stale time configurations (METRICS: 2min, NOTIFICATIONS: 30sec)
- Preserve: existing TypeScript return types and re-exports
- Add: Supabase client initialization via `useSupabase()` hook or inline `createBrowserClient()`

#### REQ-BE-088: Instructor Hook Migration

**When** the instructor dashboard hooks are updated, **then** the system shall replace all `api.get()` calls with Supabase query functions from `lib/supabase/dashboard.ts`.

- File: `apps/web/hooks/dashboard/useInstructorDashboard.ts`
- Same migration pattern as REQ-BE-087
- Preserve: stale time configurations (METRICS: 2min, PENDING_QA: 1min)
- Preserve: pagination support for activity feed

#### REQ-BE-089: Team Hook Migration

**When** the team dashboard hooks are updated, **then** the system shall replace all `api.get()` calls with Supabase query functions from `lib/supabase/dashboard.ts`.

- File: `apps/web/hooks/dashboard/useTeamDashboard.ts`
- Same migration pattern as REQ-BE-087
- Preserve: stale time configurations (OVERVIEW: 2min, ACTIVITY: 30sec)
- Preserve: pagination support for shared memos and activity feed
- Team ID must be passed as a parameter (obtained from route params or Zustand store)

---

### 3.7 Performance Requirements (REQ-BE-090)

#### REQ-BE-090: Dashboard Query Performance

The system shall meet the following performance targets for dashboard queries:

- All view queries shall complete within 200ms for up to 10,000 rows in source tables
- All function calls (RPC) shall complete within 500ms for aggregation queries
- Composite indexes shall be verified with `EXPLAIN ANALYZE` to confirm index usage
- TanStack Query stale times shall prevent redundant queries: metrics at 2 minutes, notifications at 30 seconds, pending Q&A at 1 minute

---

### 3.8 Security Requirements (REQ-BE-091)

#### REQ-BE-091: Dashboard Data Security

The system shall enforce data isolation and authorization for all dashboard queries.

- Views queried via the Supabase client inherit RLS policies from underlying tables.
- `SECURITY DEFINER` functions explicitly validate user identity: either `auth.uid()` is used internally or the parameter is validated against `auth.uid()`.
- All `SECURITY DEFINER` functions use `SET search_path = public` to prevent search path injection.
- No dashboard query shall expose data belonging to other users, courses the user is not enrolled in, or teams the user is not a member of.
- Error codes for unauthorized access: `P0008` (instructor function), `P0009` (team function).

---

## 4. Specifications

### 4.1 Migration File Listing

| Migration | Purpose | Contents |
|-----------|---------|----------|
| `00016_dashboard_schema_additions.sql` | Schema additions | `team_members.last_active_at` column, 6 composite indexes |
| `00017_dashboard_views.sql` | Dashboard views | 10 views (4 student, 3 instructor, 3 team) |
| `00018_dashboard_functions.sql` | Dashboard functions | 4 PL/pgSQL functions with SECURITY DEFINER |

### 4.2 View RLS Strategy

Views in PostgreSQL inherit RLS from their base tables when queried by a non-superuser role (which is the case for Supabase anon/authenticated roles). This means:

- `v_student_enrolled_courses` is filtered by RLS on `course_enrollments` (student_id = auth.uid())
- `v_instructor_courses_overview` is filtered by RLS on `courses` (instructor_id = auth.uid())
- `v_team_shared_memos` is filtered by RLS on `memos` (team membership check)

For views that require cross-table aggregation where RLS would prevent access (e.g., counting enrollments in instructor's courses), the corresponding SECURITY DEFINER function is used instead.

### 4.3 Error Code Registry

| Code | Function | Description |
|------|----------|-------------|
| P0002 | start_quiz_attempt | Quiz not found (existing) |
| P0003 | start_quiz_attempt | Quiz not published (existing) |
| P0004 | start_quiz_attempt | Quiz deadline passed (existing) |
| P0005 | start_quiz_attempt | Reattempt not allowed (existing) |
| P0006 | submit_and_grade_quiz | (existing) |
| P0007 | duplicate_quiz | (existing) |
| P0008 | get_instructor_activity_feed | Unauthorized: user is not the specified instructor |
| P0009 | get_team_activity_feed | Unauthorized: user is not a team member |

### 4.4 Type Mapping Convention

Database snake_case columns are mapped to TypeScript camelCase properties in the query layer:

| Database Column | TypeScript Property |
|----------------|-------------------|
| `course_id` | `id` (aliased) |
| `instructor_name` | `instructorName` |
| `progress_percent` | `progressPercent` |
| `last_accessed_at` | `lastAccessedAt` |
| `question_excerpt` | `questionExcerpt` |
| `course_name` | `courseName` |
| `created_at` | `createdAt` |
| `is_urgent` | `isUrgent` |
| `average_score` | `averageScore` |
| `submission_count` | `submissionCount` |
| `pass_rate` | `passRate` |
| `member_count` | `memberCount` |
| `avatar_url` | `avatarUrl` |
| `last_active_at` | `lastActiveAt` |
| `is_published` | `isPublished` |
| `enrolled_count` | `enrolledCount` |
| `materials_count` | `materialsCount` |
| `pending_qa_count` | `pendingQACount` |

### 4.5 Traceability

| Requirement | Migration | View/Function | Query Function | Frontend Hook |
|------------|-----------|--------------|----------------|---------------|
| REQ-BE-070 | 00016 | - | - | - |
| REQ-BE-071 | 00016 | - | - | - |
| REQ-BE-072 | 00017 | v_student_enrolled_courses | fetchEnrolledCourses | useEnrolledCourses |
| REQ-BE-073 | 00017 | v_student_qa_activity | fetchRecentQA | useRecentQA |
| REQ-BE-074 | 00017 | v_student_quiz_results | fetchQuizResults | useQuizResults |
| REQ-BE-075 | 00017 | v_student_upcoming_quizzes | fetchUpcomingQuizzes | useUpcomingQuizzes |
| REQ-BE-076 | 00017 | v_instructor_courses_overview | fetchInstructorCourses | useInstructorCourses |
| REQ-BE-077 | 00017 | v_instructor_pending_qa | fetchPendingQA | usePendingQA |
| REQ-BE-078 | 00017 | v_instructor_quiz_performance | fetchQuizPerformance | useQuizPerformance |
| REQ-BE-079 | 00017 | v_team_overview, v_team_members_detail, v_team_shared_memos | fetchTeamOverview, fetchTeamMembers, fetchSharedMemos | useTeamOverview, useTeamMembers, useSharedMemos |
| REQ-BE-080 | 00018 | get_student_study_progress | fetchStudyProgress | useStudyProgress |
| REQ-BE-081 | 00018 | get_student_activity_stats | fetchStudentActivityStats | useStudentActivity |
| REQ-BE-082 | 00018 | get_instructor_activity_feed | fetchActivityFeed | useActivityFeed |
| REQ-BE-083 | 00018 | get_team_activity_feed | fetchTeamActivityFeed | useTeamActivity |
| REQ-BE-084 | - | - | dashboard.ts module | - |
| REQ-BE-085 | - | - | Student query functions | - |
| REQ-BE-086 | - | - | Instructor/Team query functions | - |
| REQ-BE-087 | - | - | - | useStudentDashboard.ts |
| REQ-BE-088 | - | - | - | useInstructorDashboard.ts |
| REQ-BE-089 | - | - | - | useTeamDashboard.ts |
| REQ-BE-090 | 00016 (indexes) | All views | All functions | Stale times |
| REQ-BE-091 | - | RLS inheritance | SECURITY DEFINER | - |

---

## 5. Implementation Notes

### 5.1 Implementation Summary

All requirements (REQ-BE-070 through REQ-BE-091) were implemented as specified. The implementation commit is `8cd731e`.

### 5.2 Files Created/Modified

| File | Action | Lines |
|------|--------|-------|
| `supabase/migrations/00016_dashboard_schema_additions.sql` | CREATE | 46 |
| `supabase/migrations/00017_dashboard_views.sql` | CREATE | 257 |
| `supabase/migrations/00018_dashboard_functions.sql` | CREATE | 399 |
| `apps/web/lib/supabase/dashboard.ts` | CREATE | 485 |
| `apps/web/hooks/dashboard/useStudentDashboard.ts` | MODIFY | -/+ |
| `apps/web/hooks/dashboard/useInstructorDashboard.ts` | MODIFY | -/+ |
| `apps/web/hooks/dashboard/useTeamDashboard.ts` | MODIFY | -/+ |
| `apps/web/types/supabase.ts` | REGENERATE | 371+ |
| `apps/web/lib/api-endpoints.ts` | DELETE | -62 |

### 5.3 Post-Implementation Fixes (Sync Phase)

During sync quality verification, additional fixes were applied:

- Widget components (`TeamOverviewWidget`, `TeamMembersWidget`, `SharedMemosFeedWidget`, `TeamActivityWidget`) updated to accept `teamId` prop and use `PaginatedResponse` shape correctly
- `ActivityFeedWidget` updated from `.pagination.hasNextPage` to `.hasMore`
- Test files updated: Date string literals converted to `new Date()` objects for type safety
- `dashboard.ts`: Removed unnecessary `?? []` on non-nullable RPC results
- `quizzes.ts`: Removed unnecessary type assertion

### 5.4 Test Results

- 122 test files, 1,732 tests: all passing
- ESLint: 0 errors
- TypeScript: 0 errors
