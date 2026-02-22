-- Migration: 00018_dashboard_functions
-- Description: Create PL/pgSQL functions for dashboard aggregation (SPEC-BE-007)
--              All functions use SECURITY DEFINER with SET search_path = public
--              to bypass RLS while maintaining explicit security checks.

-- ============================================================================
-- REQ-BE-080: Student Study Progress Function
-- ============================================================================
-- Returns study streak and session metrics as JSON for a given student.
-- Activity is derived from quiz_attempts, questions, and answers.
-- Uses CTE-based date series for consecutive streak calculation.

CREATE OR REPLACE FUNCTION public.get_student_study_progress(p_user_id UUID)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_result JSON;
  v_current_streak INTEGER := 0;
  v_longest_streak INTEGER := 0;
  v_total_sessions INTEGER := 0;
  v_materials_read INTEGER := 0;
BEGIN
  -- Validate caller identity (AC-091)
  IF p_user_id != auth.uid() THEN
    RAISE EXCEPTION 'Unauthorized: user ID mismatch'
      USING ERRCODE = 'P0008';
  END IF;

  -- Collect all distinct activity dates in the last 90 days
  WITH activity_dates AS (
    -- Quiz attempt start dates
    SELECT DISTINCT DATE(started_at) AS activity_date
    FROM quiz_attempts
    WHERE student_id = p_user_id
      AND started_at >= now() - interval '90 days'

    UNION

    -- Question creation dates
    SELECT DISTINCT DATE(created_at) AS activity_date
    FROM questions
    WHERE author_id = p_user_id
      AND created_at >= now() - interval '90 days'

    UNION

    -- Answer creation dates
    SELECT DISTINCT DATE(created_at) AS activity_date
    FROM answers
    WHERE author_id = p_user_id
      AND created_at >= now() - interval '90 days'
  ),
  -- Generate the date series for streak calculation
  ordered_dates AS (
    SELECT activity_date,
           activity_date - (ROW_NUMBER() OVER (ORDER BY activity_date))::INTEGER AS streak_group
    FROM activity_dates
  ),
  -- Calculate streak lengths per group
  streak_lengths AS (
    SELECT streak_group,
           COUNT(*)::INTEGER AS streak_len,
           MAX(activity_date) AS streak_end
    FROM ordered_dates
    GROUP BY streak_group
  )
  SELECT
    -- Current streak: only if the most recent streak includes today or yesterday
    COALESCE(
      (SELECT streak_len
       FROM streak_lengths
       WHERE streak_end >= CURRENT_DATE - 1
       ORDER BY streak_end DESC
       LIMIT 1),
      0
    ),
    -- Longest streak in last 90 days
    COALESCE((SELECT MAX(streak_len) FROM streak_lengths), 0),
    -- Total distinct activity days
    (SELECT COUNT(*)::INTEGER FROM activity_dates)
  INTO v_current_streak, v_longest_streak, v_total_sessions;

  -- Materials read: distinct materials the student interacted with
  -- via questions on materials or quiz attempts linked through quizzes to courses
  SELECT COUNT(DISTINCT material_id)::INTEGER INTO v_materials_read
  FROM (
    -- Materials where the student asked questions
    SELECT DISTINCT q.material_id
    FROM questions q
    WHERE q.author_id = p_user_id
      AND q.material_id IS NOT NULL

    UNION

    -- Materials in courses where the student took quizzes
    SELECT DISTINCT m.id AS material_id
    FROM quiz_attempts qa
    JOIN quizzes qz ON qz.id = qa.quiz_id
    JOIN materials m ON m.course_id = qz.course_id
    WHERE qa.student_id = p_user_id
      AND m.status = 'published'
  ) AS interacted_materials;

  -- Build result JSON
  v_result := json_build_object(
    'currentStreak', v_current_streak,
    'longestStreak', v_longest_streak,
    'totalSessions', v_total_sessions,
    'materialsRead', v_materials_read
  );

  RETURN v_result;
END;
$$;

COMMENT ON FUNCTION public.get_student_study_progress IS
  'Returns study streak and session metrics (currentStreak, longestStreak, totalSessions, materialsRead) as JSON for a student.';


-- ============================================================================
-- REQ-BE-081: Instructor Student Activity Stats Function
-- ============================================================================
-- Returns aggregated student activity statistics across the instructor's courses.
-- Validates that p_instructor_id matches auth.uid().

CREATE OR REPLACE FUNCTION public.get_student_activity_stats(p_instructor_id UUID)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_total_students INTEGER;
  v_active_students_7d INTEGER;
  v_avg_completion NUMERIC;
  v_study_sessions_7d INTEGER;
  v_result JSON;
BEGIN
  -- Validate authorization
  IF p_instructor_id != auth.uid() THEN
    RAISE EXCEPTION 'Not authorized' USING ERRCODE = 'P0008';
  END IF;

  -- Collect instructor's course IDs for reuse
  -- Total distinct students with active enrollment in instructor's courses
  SELECT COUNT(DISTINCT ce.student_id)::INTEGER INTO v_total_students
  FROM course_enrollments ce
  JOIN courses c ON c.id = ce.course_id
  WHERE c.instructor_id = p_instructor_id
    AND ce.status = 'active';

  -- Active students in last 7 days (any activity in instructor's courses)
  WITH instructor_courses AS (
    SELECT id FROM courses WHERE instructor_id = p_instructor_id
  ),
  active_students AS (
    -- Students who attempted quizzes
    SELECT DISTINCT qa.student_id
    FROM quiz_attempts qa
    JOIN quizzes qz ON qz.id = qa.quiz_id
    WHERE qz.course_id IN (SELECT id FROM instructor_courses)
      AND qa.started_at >= now() - interval '7 days'

    UNION

    -- Students who asked questions
    SELECT DISTINCT q.author_id AS student_id
    FROM questions q
    WHERE q.course_id IN (SELECT id FROM instructor_courses)
      AND q.created_at >= now() - interval '7 days'

    UNION

    -- Students who posted answers to questions in instructor's courses
    SELECT DISTINCT a.author_id AS student_id
    FROM answers a
    JOIN questions q ON q.id = a.question_id
    WHERE q.course_id IN (SELECT id FROM instructor_courses)
      AND a.created_at >= now() - interval '7 days'
  )
  SELECT COUNT(*)::INTEGER INTO v_active_students_7d FROM active_students;

  -- Average completion rate from active enrollments
  SELECT COALESCE(ROUND(AVG(ce.progress_percent)::NUMERIC, 1), 0)
  INTO v_avg_completion
  FROM course_enrollments ce
  JOIN courses c ON c.id = ce.course_id
  WHERE c.instructor_id = p_instructor_id
    AND ce.status = 'active';

  -- Study sessions in last 7 days: COUNT DISTINCT (student_id, activity_date)
  WITH instructor_courses AS (
    SELECT id FROM courses WHERE instructor_id = p_instructor_id
  ),
  session_pairs AS (
    SELECT DISTINCT qa.student_id, DATE(qa.started_at) AS activity_date
    FROM quiz_attempts qa
    JOIN quizzes qz ON qz.id = qa.quiz_id
    WHERE qz.course_id IN (SELECT id FROM instructor_courses)
      AND qa.started_at >= now() - interval '7 days'

    UNION

    SELECT DISTINCT q.author_id AS student_id, DATE(q.created_at) AS activity_date
    FROM questions q
    WHERE q.course_id IN (SELECT id FROM instructor_courses)
      AND q.created_at >= now() - interval '7 days'

    UNION

    SELECT DISTINCT a.author_id AS student_id, DATE(a.created_at) AS activity_date
    FROM answers a
    JOIN questions q ON q.id = a.question_id
    WHERE q.course_id IN (SELECT id FROM instructor_courses)
      AND a.created_at >= now() - interval '7 days'
  )
  SELECT COUNT(*)::INTEGER INTO v_study_sessions_7d FROM session_pairs;

  -- Build result JSON
  v_result := json_build_object(
    'totalStudents', v_total_students,
    'activeStudents7d', v_active_students_7d,
    'avgCompletionRate', v_avg_completion,
    'studySessions7d', v_study_sessions_7d
  );

  RETURN v_result;
END;
$$;

COMMENT ON FUNCTION public.get_student_activity_stats IS
  'Returns aggregated student activity statistics (totalStudents, activeStudents7d, avgCompletionRate, studySessions7d) for an instructor.';


-- ============================================================================
-- REQ-BE-082: Instructor Activity Feed Function
-- ============================================================================
-- Returns a paginated activity feed from enrollments, questions, and quiz attempts
-- across the instructor's courses.
-- Validates that p_instructor_id matches auth.uid().

CREATE OR REPLACE FUNCTION public.get_instructor_activity_feed(
  p_instructor_id UUID,
  p_limit INT DEFAULT 10,
  p_offset INT DEFAULT 0
)
RETURNS TABLE(
  id UUID,
  type TEXT,
  actor_name TEXT,
  course_name TEXT,
  created_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Validate authorization
  IF p_instructor_id != auth.uid() THEN
    RAISE EXCEPTION 'Not authorized' USING ERRCODE = 'P0008';
  END IF;

  RETURN QUERY
  (
    -- New enrollments
    SELECT
      ce.id,
      'enrollment'::TEXT AS type,
      p.display_name AS actor_name,
      c.title AS course_name,
      ce.enrolled_at AS created_at
    FROM course_enrollments ce
    JOIN courses c  ON c.id = ce.course_id
    JOIN profiles p ON p.id = ce.student_id
    WHERE c.instructor_id = p_instructor_id

    UNION ALL

    -- New questions
    SELECT
      q.id,
      'question'::TEXT AS type,
      p.display_name AS actor_name,
      c.title AS course_name,
      q.created_at
    FROM questions q
    JOIN courses c  ON c.id = q.course_id
    JOIN profiles p ON p.id = q.author_id
    WHERE c.instructor_id = p_instructor_id

    UNION ALL

    -- Quiz attempts (submitted or graded)
    SELECT
      qa.id,
      'quiz_attempt'::TEXT AS type,
      p.display_name AS actor_name,
      c.title AS course_name,
      qa.started_at AS created_at
    FROM quiz_attempts qa
    JOIN quizzes qz ON qz.id = qa.quiz_id
    JOIN courses c  ON c.id = qz.course_id
    JOIN profiles p ON p.id = qa.student_id
    WHERE c.instructor_id = p_instructor_id
  )
  ORDER BY created_at DESC
  LIMIT p_limit
  OFFSET p_offset;
END;
$$;

COMMENT ON FUNCTION public.get_instructor_activity_feed IS
  'Returns a paginated activity feed (enrollments, questions, quiz attempts) for an instructor''s courses.';


-- ============================================================================
-- REQ-BE-083: Team Activity Feed Function
-- ============================================================================
-- Returns a paginated team activity feed from memos, questions by team members,
-- and new member joins.
-- Validates team membership via is_team_member().

CREATE OR REPLACE FUNCTION public.get_team_activity_feed(
  p_team_id UUID,
  p_limit INT DEFAULT 10,
  p_offset INT DEFAULT 0
)
RETURNS TABLE(
  id UUID,
  type TEXT,
  actor_name TEXT,
  description TEXT,
  created_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Validate team membership
  IF NOT is_team_member(p_team_id) THEN
    RAISE EXCEPTION 'Not a team member' USING ERRCODE = 'P0009';
  END IF;

  RETURN QUERY
  (
    -- Team memos (shared, non-draft)
    SELECT
      m.id,
      'memo'::TEXT AS type,
      p.display_name AS actor_name,
      m.title AS description,
      m.updated_at AS created_at
    FROM memos m
    JOIN profiles p ON p.id = m.author_id
    WHERE m.team_id = p_team_id
      AND m.visibility = 'team'
      AND m.is_draft = false

    UNION ALL

    -- Questions by team members in the team's course
    SELECT
      q.id,
      'question'::TEXT AS type,
      p.display_name AS actor_name,
      q.title AS description,
      q.created_at
    FROM questions q
    JOIN profiles p ON p.id = q.author_id
    JOIN team_members tm ON tm.user_id = q.author_id AND tm.team_id = p_team_id
    JOIN teams t ON t.id = p_team_id
    WHERE q.course_id = t.course_id

    UNION ALL

    -- Members who joined the team
    SELECT
      tm.id,
      'member_joined'::TEXT AS type,
      p.display_name AS actor_name,
      'Joined the team' AS description,
      tm.joined_at AS created_at
    FROM team_members tm
    JOIN profiles p ON p.id = tm.user_id
    WHERE tm.team_id = p_team_id
  )
  ORDER BY created_at DESC
  LIMIT p_limit
  OFFSET p_offset;
END;
$$;

COMMENT ON FUNCTION public.get_team_activity_feed IS
  'Returns a paginated team activity feed (memos, questions, member joins) for a team.';
