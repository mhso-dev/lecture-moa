---
id: SPEC-BE-007
title: "Dashboard Backend Integration - Implementation Plan"
version: 1.0.0
status: completed
created: 2026-02-22
---

# SPEC-BE-007: Implementation Plan

## 1. Milestones

### Primary Goal: Database Layer (Migrations)

**Scope:** Create 3 migration files establishing the dashboard data infrastructure.

**Tasks:**

1. **00016_dashboard_schema_additions.sql** (REQ-BE-070, REQ-BE-071)
   - Add `last_active_at TIMESTAMPTZ DEFAULT now()` column to `team_members`
   - Create 6 composite indexes:
     - `idx_course_enrollments_status` on `course_enrollments(status)`
     - `idx_quiz_attempts_status` on `quiz_attempts(status)`
     - `idx_quiz_attempts_quiz_student` on `quiz_attempts(quiz_id, student_id)`
     - `idx_questions_course_status` on `questions(course_id, status)`
     - `idx_courses_instructor_status` on `courses(instructor_id, status)`
     - `idx_team_members_user_team` on `team_members(user_id, team_id)`
   - Use `IF NOT EXISTS` for idempotent index creation

2. **00017_dashboard_views.sql** (REQ-BE-072 through REQ-BE-079)
   - Create 10 views with `CREATE OR REPLACE VIEW`:
     - Student: `v_student_enrolled_courses`, `v_student_qa_activity`, `v_student_quiz_results`, `v_student_upcoming_quizzes`
     - Instructor: `v_instructor_courses_overview`, `v_instructor_pending_qa`, `v_instructor_quiz_performance`
     - Team: `v_team_overview`, `v_team_members_detail`, `v_team_shared_memos`
   - Each view includes SQL comments documenting column semantics and SPEC traceability

3. **00018_dashboard_functions.sql** (REQ-BE-080 through REQ-BE-083)
   - Create 4 PL/pgSQL functions:
     - `get_student_study_progress(p_user_id UUID)` -> JSON
     - `get_student_activity_stats(p_instructor_id UUID)` -> JSON
     - `get_instructor_activity_feed(p_instructor_id UUID, p_limit INT, p_offset INT)` -> TABLE
     - `get_team_activity_feed(p_team_id UUID, p_limit INT, p_offset INT)` -> TABLE
   - All functions: `SECURITY DEFINER`, `SET search_path = public`
   - Error codes: P0008, P0009 for authorization failures

**Verification:**
- Run `supabase db reset` to verify migration chain integrity
- Run `EXPLAIN ANALYZE` on each view with test data to confirm index usage
- Verify SECURITY DEFINER functions return correct data isolation

---

### Secondary Goal: Supabase Query Layer

**Scope:** Create the TypeScript query module that bridges database views/functions with frontend hooks.

**Tasks:**

1. **Create `apps/web/lib/supabase/dashboard.ts`** (REQ-BE-084 through REQ-BE-086)
   - Import Supabase client from `~/lib/supabase/client.ts`
   - Implement snake_case to camelCase mapping utility
   - Implement 6 student query functions:
     - `fetchEnrolledCourses(supabase)` -> query `v_student_enrolled_courses`
     - `fetchRecentQA(supabase)` -> query `v_student_qa_activity`
     - `fetchQuizResults(supabase)` -> query `v_student_quiz_results`
     - `fetchStudyProgress(supabase)` -> RPC `get_student_study_progress`
     - `fetchUpcomingQuizzes(supabase)` -> query `v_student_upcoming_quizzes`
     - `fetchQANotifications(supabase)` -> query `notifications` table
   - Implement 5 instructor query functions:
     - `fetchInstructorCourses(supabase)` -> query `v_instructor_courses_overview`
     - `fetchStudentActivityStats(supabase)` -> RPC `get_student_activity_stats`
     - `fetchPendingQA(supabase)` -> query `v_instructor_pending_qa`
     - `fetchQuizPerformance(supabase)` -> query `v_instructor_quiz_performance`
     - `fetchActivityFeed(supabase, page, limit)` -> RPC `get_instructor_activity_feed`
   - Implement 4 team query functions:
     - `fetchTeamOverview(supabase, teamId)` -> query `v_team_overview`
     - `fetchTeamMembers(supabase, teamId)` -> query `v_team_members_detail`
     - `fetchSharedMemos(supabase, teamId, page, limit)` -> query `v_team_shared_memos`
     - `fetchTeamActivityFeed(supabase, teamId, page, limit)` -> RPC `get_team_activity_feed`

2. **Regenerate Supabase types**
   - Run `supabase gen types typescript --local > apps/web/types/supabase.ts`
   - Verify new views and functions appear in generated types

**Verification:**
- Unit test each query function with mocked Supabase client
- Integration test against local Supabase instance

---

### Final Goal: Frontend Hook Migration

**Scope:** Update existing dashboard hooks to use Supabase queries instead of REST API calls.

**Tasks:**

1. **Update `useStudentDashboard.ts`** (REQ-BE-087)
   - Replace `import { api } from "~/lib/api"` with dashboard query imports
   - Remove `import { STUDENT_DASHBOARD_ENDPOINTS }` (no longer needed)
   - Add Supabase client initialization (from context or inline)
   - Update each `queryFn` to call the corresponding `fetch*` function
   - Preserve all query keys, stale times, and type exports

2. **Update `useInstructorDashboard.ts`** (REQ-BE-088)
   - Same pattern as student hooks
   - Ensure pagination in `useActivityFeed` passes page/limit to RPC

3. **Update `useTeamDashboard.ts`** (REQ-BE-089)
   - Same pattern as student hooks
   - Add `teamId` parameter to all team query functions
   - Ensure pagination in `useSharedMemos` and `useTeamActivity` passes page/limit

4. **Clean up unused imports**
   - Remove dashboard endpoint constants from `api-endpoints.ts` if no other consumers
   - Verify no remaining `api.get()` references for dashboard data

**Verification:**
- Run existing dashboard test suite (201 tests from SPEC-FE-003)
- Manual verification in browser with local Supabase instance
- Verify TanStack Query devtools show correct query keys and cache behavior

---

### Optional Goal: Performance Optimization

**Scope:** Validate and optimize query performance after initial implementation.

**Tasks:**

1. Run `EXPLAIN ANALYZE` on all views with realistic data volume
2. Verify composite indexes are used (no sequential scans on large tables)
3. Profile RPC function execution times
4. Add materialized views if any query exceeds 200ms target (unlikely at initial scale)
5. Consider connection pooling configuration if concurrent dashboard loads spike

---

## 2. Technical Approach

### 2.1 Migration Strategy

Migrations follow the existing numbered convention (00016, 00017, 00018). Each migration is idempotent:
- Schema additions use `ALTER TABLE ... ADD COLUMN IF NOT EXISTS`
- Indexes use `CREATE INDEX IF NOT EXISTS`
- Views use `CREATE OR REPLACE VIEW`
- Functions use `CREATE OR REPLACE FUNCTION`

### 2.2 View Design Principles

- Views encapsulate JOIN complexity, exposing a flat result set
- Views do NOT use `SECURITY DEFINER` (they inherit RLS from base tables)
- Views include the user identifier column (e.g., `student_id`, `instructor_id`) to work with RLS
- Views use column aliases matching the frontend TypeScript property expectations (in snake_case; camelCase mapping happens in the query layer)

### 2.3 Function Design Principles

- All functions use `SECURITY DEFINER` to bypass RLS for cross-user aggregations
- All functions validate the caller's identity (`auth.uid()`) internally
- Functions that accept a user ID parameter verify it matches `auth.uid()` to prevent IDOR
- Error handling uses PostgreSQL `RAISE EXCEPTION` with custom error codes (P0008, P0009)
- Study progress approximation uses date-based grouping of existing activity timestamps

### 2.4 Query Layer Design

- Single module file `dashboard.ts` exports all query functions
- Each function accepts a `SupabaseClient` instance (dependency injection for testability)
- snake_case to camelCase mapping is centralized in a utility function
- Error handling: Supabase errors are caught and re-thrown with descriptive messages
- RPC calls use `supabase.rpc('function_name', { params })` pattern

### 2.5 Hook Migration Strategy

- Minimal changes to hook files: only the `queryFn` implementation changes
- Query keys, stale times, TypeScript types, and re-exports are preserved
- Supabase client is obtained via `createBrowserClient()` from `~/lib/supabase/client.ts`
- The `api.ts` module and `api-endpoints.ts` dashboard constants become unused after migration

---

## 3. Architecture Design Direction

### 3.1 Data Flow

```
PostgreSQL Views/Functions
    |
    v
Supabase PostgREST / RPC
    |
    v
@supabase/supabase-js (browser client with JWT)
    |
    v
lib/supabase/dashboard.ts (query functions + camelCase mapping)
    |
    v
hooks/dashboard/use*.ts (TanStack Query wrappers)
    |
    v
Dashboard Widget Components (from SPEC-FE-003)
```

### 3.2 Security Architecture

```
User JWT (from Supabase Auth)
    |
    +-- Views: RLS on base tables filters rows automatically
    |
    +-- Functions (SECURITY DEFINER):
        |-- Validates auth.uid() internally
        |-- Bypasses RLS for aggregation
        |-- Returns only authorized data
```

### 3.3 File Dependencies

```
00016_dashboard_schema_additions.sql
    |-- depends on: 00006 (teams), 00010 (indexes)
    v
00017_dashboard_views.sql
    |-- depends on: 00016, all table migrations (00001-00009)
    v
00018_dashboard_functions.sql
    |-- depends on: 00017 (views referenced), 00011 (RLS helpers)
    v
lib/supabase/dashboard.ts
    |-- depends on: lib/supabase/client.ts, types/supabase.ts (regenerated)
    v
hooks/dashboard/use*.ts (modified)
    |-- depends on: lib/supabase/dashboard.ts
```

---

## 4. Risks and Response Plans

### Risk 1: View Performance with RLS

**Risk:** Views inheriting RLS may have suboptimal query plans due to additional security checks on each base table.

**Mitigation:** Composite indexes (REQ-BE-071) are specifically designed to support RLS filter patterns. If performance degrades, migrate critical views to SECURITY DEFINER functions with explicit filtering.

**Probability:** Low (RLS overhead is minimal with proper indexes)

### Risk 2: Study Progress Approximation Accuracy

**Risk:** Streak calculation based on existing timestamps may not accurately reflect actual study behavior (e.g., a student may read materials without creating any trackable activity).

**Mitigation:** Document the approximation clearly in UI (e.g., "Based on your quiz and Q&A activity"). Accept this limitation for the current iteration; a dedicated study session tracking table can be added in a future SPEC.

**Probability:** Medium (known limitation, acceptable for MVP)

### Risk 3: Supabase Type Regeneration Breaking Changes

**Risk:** Running `supabase gen types typescript` may produce types that conflict with existing manually-defined types in `packages/shared`.

**Mitigation:** The shared package types serve as the API contract (camelCase); the auto-generated types (snake_case) are used only within `lib/supabase/dashboard.ts`. The query layer handles the mapping, isolating the two type systems.

**Probability:** Low (clear separation of concerns)

### Risk 4: Frontend Hook Migration Regressions

**Risk:** Changing `queryFn` implementations may break existing 201 tests.

**Mitigation:** Tests mock the data fetching layer. Update test mocks to use Supabase client mocks instead of `api.get()` mocks. Run the full test suite after each hook migration.

**Probability:** Medium (test mocks need updating)

---

## 5. Expert Consultation Recommendations

### Backend Expert Consultation

This SPEC contains significant backend implementation:
- 10 PostgreSQL views with complex JOINs and aggregations
- 4 PL/pgSQL SECURITY DEFINER functions with error handling
- 6 composite indexes for performance optimization
- Snake-to-camelCase type mapping layer

**Recommendation:** Consult with `expert-backend` for:
- Optimal view query plans and index strategy
- SECURITY DEFINER function implementation and auth validation
- Supabase RPC call patterns and error handling
- Performance profiling with EXPLAIN ANALYZE
