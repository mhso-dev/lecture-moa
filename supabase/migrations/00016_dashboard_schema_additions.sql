-- Migration: 00016_dashboard_schema_additions
-- Description: Schema additions for dashboard backend integration (SPEC-BE-007)
--              Adds last_active_at column to team_members and composite indexes
--              for optimized dashboard query performance.

-- ============================================================================
-- REQ-BE-070: Team Members Last Active Tracking
-- ============================================================================
-- Add last_active_at column to track when a team member was last active.
-- Used by the Team Members Widget (REQ-FE-232) to show member activity status.

ALTER TABLE public.team_members
  ADD COLUMN IF NOT EXISTS last_active_at TIMESTAMPTZ DEFAULT now();

COMMENT ON COLUMN public.team_members.last_active_at
  IS 'Timestamp of last activity within the team context';

-- ============================================================================
-- REQ-BE-071: Dashboard Composite Indexes
-- ============================================================================
-- Composite indexes optimized for dashboard aggregation queries.
-- All indexes use IF NOT EXISTS for idempotent migrations.

-- 1. Active student count filtering on course_enrollments
CREATE INDEX IF NOT EXISTS idx_course_enrollments_status
  ON public.course_enrollments(status);

-- 2. Graded attempt aggregation on quiz_attempts
CREATE INDEX IF NOT EXISTS idx_quiz_attempts_status
  ON public.quiz_attempts(status);

-- 3. Composite for quiz attempt lookup by quiz and student
CREATE INDEX IF NOT EXISTS idx_quiz_attempts_quiz_student
  ON public.quiz_attempts(quiz_id, student_id);

-- 4. Composite for open question count per course
CREATE INDEX IF NOT EXISTS idx_questions_course_status
  ON public.questions(course_id, status);

-- 5. Composite for published course filtering by instructor
CREATE INDEX IF NOT EXISTS idx_courses_instructor_status
  ON public.courses(instructor_id, status);

-- 6. Composite for team membership lookup by user
CREATE INDEX IF NOT EXISTS idx_team_members_user_team
  ON public.team_members(user_id, team_id);
