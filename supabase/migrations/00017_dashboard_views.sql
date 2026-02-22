-- Migration: 00017_dashboard_views
-- Description: Create dashboard views for student, instructor, and team dashboards (SPEC-BE-007)
--              Views inherit RLS from their base tables when queried via Supabase client.

-- ============================================================================
-- STUDENT VIEWS
-- ============================================================================

-- REQ-BE-072: Student Enrolled Courses View
-- Returns enrolled course data with instructor name and progress for the
-- authenticated student. RLS on course_enrollments filters by student_id.
CREATE OR REPLACE VIEW public.v_student_enrolled_courses AS
SELECT
  ce.id          AS enrollment_id,
  c.id           AS course_id,
  c.title,
  p.display_name AS instructor_name,
  ce.progress_percent,
  ce.enrolled_at AS last_accessed_at,
  ce.student_id
FROM public.course_enrollments ce
JOIN public.courses c  ON c.id = ce.course_id
JOIN public.profiles p ON p.id = c.instructor_id
WHERE ce.status = 'active'
ORDER BY ce.enrolled_at DESC;

COMMENT ON VIEW public.v_student_enrolled_courses
  IS 'Active course enrollments with instructor name for dashboard display';


-- REQ-BE-073: Student Q&A Activity View
-- Returns the student''s recent Q&A interactions with status mapping.
-- LIMIT is omitted from the view definition; apply it in the query layer.
CREATE OR REPLACE VIEW public.v_student_qa_activity AS
SELECT
  q.id           AS question_id,
  LEFT(q.title, 80) AS question_excerpt,
  c.title        AS course_name,
  CASE
    WHEN q.answer_count > 0 THEN 'answered'
    ELSE 'pending'
  END            AS status,
  q.created_at,
  q.author_id
FROM public.questions q
JOIN public.courses c ON c.id = q.course_id
ORDER BY q.created_at DESC;

COMMENT ON VIEW public.v_student_qa_activity
  IS 'Student Q&A activity with answered/pending status mapping';


-- REQ-BE-074: Student Quiz Results View
-- Returns the student''s graded quiz scores with course context.
-- LIMIT is omitted from the view definition; apply it in the query layer.
CREATE OR REPLACE VIEW public.v_student_quiz_results AS
SELECT
  qa.id            AS attempt_id,
  qz.title         AS quiz_title,
  c.title          AS course_name,
  qa.score,
  qa.total_points,
  qa.submitted_at  AS taken_at,
  qa.student_id
FROM public.quiz_attempts qa
JOIN public.quizzes qz ON qz.id = qa.quiz_id
JOIN public.courses c  ON c.id = qz.course_id
WHERE qa.status = 'graded'
ORDER BY qa.submitted_at DESC;

COMMENT ON VIEW public.v_student_quiz_results
  IS 'Graded quiz results with quiz and course details for student dashboard';


-- REQ-BE-075: Student Upcoming Quizzes View
-- Returns published quizzes that the student has not yet submitted.
-- Joins through course_enrollments to ensure only enrolled courses are shown.
CREATE OR REPLACE VIEW public.v_student_upcoming_quizzes AS
SELECT
  qz.id    AS quiz_id,
  qz.title AS quiz_title,
  c.title  AS course_name,
  (
    SELECT COUNT(*)::INTEGER
    FROM public.quiz_questions qq
    WHERE qq.quiz_id = qz.id
  )        AS question_count,
  qz.due_date,
  ce.student_id
FROM public.quizzes qz
JOIN public.courses c            ON c.id = qz.course_id
JOIN public.course_enrollments ce ON ce.course_id = c.id AND ce.status = 'active'
LEFT JOIN public.quiz_attempts qa ON qa.quiz_id = qz.id
                                  AND qa.student_id = ce.student_id
                                  AND qa.status IN ('submitted', 'graded')
WHERE qz.status = 'published'
  AND qa.id IS NULL
ORDER BY qz.due_date ASC NULLS LAST;

COMMENT ON VIEW public.v_student_upcoming_quizzes
  IS 'Published quizzes without a submitted attempt for enrolled students';


-- ============================================================================
-- INSTRUCTOR VIEWS
-- ============================================================================

-- REQ-BE-076: Instructor Courses Overview View
-- Returns the instructor''s courses with aggregated counts for enrollments,
-- published materials, and pending Q&A.
CREATE OR REPLACE VIEW public.v_instructor_courses_overview AS
SELECT
  c.id AS course_id,
  c.title,
  COALESCE(enr.enrolled_count, 0)     AS enrolled_count,
  COALESCE(mat.materials_count, 0)    AS materials_count,
  COALESCE(qst.pending_qa_count, 0)   AS pending_qa_count,
  (c.status = 'published')            AS is_published,
  c.instructor_id
FROM public.courses c
LEFT JOIN LATERAL (
  SELECT COUNT(*)::INTEGER AS enrolled_count
  FROM public.course_enrollments ce
  WHERE ce.course_id = c.id AND ce.status = 'active'
) enr ON true
LEFT JOIN LATERAL (
  SELECT COUNT(*)::INTEGER AS materials_count
  FROM public.materials m
  WHERE m.course_id = c.id AND m.status = 'published'
) mat ON true
LEFT JOIN LATERAL (
  SELECT COUNT(*)::INTEGER AS pending_qa_count
  FROM public.questions q
  WHERE q.course_id = c.id AND q.status = 'OPEN'
) qst ON true
ORDER BY c.created_at DESC;

COMMENT ON VIEW public.v_instructor_courses_overview
  IS 'Instructor courses with enrollment, material, and pending Q&A counts';


-- REQ-BE-077: Instructor Pending Q&A View
-- Returns unanswered questions across the instructor''s courses, ordered
-- oldest first. is_urgent is true for questions older than 48 hours.
CREATE OR REPLACE VIEW public.v_instructor_pending_qa AS
SELECT
  q.id             AS question_id,
  LEFT(q.title, 80) AS question_excerpt,
  p.display_name   AS student_name,
  c.title          AS course_name,
  q.created_at     AS asked_at,
  (q.created_at < now() - interval '48 hours') AS is_urgent,
  c.instructor_id
FROM public.questions q
JOIN public.courses c  ON c.id = q.course_id
JOIN public.profiles p ON p.id = q.author_id
WHERE q.status = 'OPEN'
ORDER BY q.created_at ASC;

COMMENT ON VIEW public.v_instructor_pending_qa
  IS 'Open questions across instructor courses, oldest first, with urgency flag';


-- REQ-BE-078: Instructor Quiz Performance View
-- Returns quiz performance statistics including average score, submission count,
-- and pass rate for the instructor''s quizzes.
CREATE OR REPLACE VIEW public.v_instructor_quiz_performance AS
SELECT
  qz.id    AS quiz_id,
  qz.title AS quiz_title,
  c.title  AS course_name,
  COALESCE(
    ROUND(AVG(qa.score::NUMERIC / NULLIF(qa.total_points, 0) * 100), 1),
    0
  ) AS average_score,
  COUNT(qa.id)::INTEGER AS submission_count,
  COALESCE(
    ROUND(
      COUNT(*) FILTER (
        WHERE qa.score >= COALESCE(qz.passing_score, 60)::NUMERIC / 100.0 * qa.total_points
      )::NUMERIC / NULLIF(COUNT(qa.id), 0) * 100,
      1
    ),
    0
  ) AS pass_rate,
  c.instructor_id
FROM public.quizzes qz
JOIN public.courses c ON c.id = qz.course_id
LEFT JOIN public.quiz_attempts qa ON qa.quiz_id = qz.id AND qa.status = 'graded'
GROUP BY qz.id, qz.title, qz.passing_score, c.title, c.instructor_id, qz.created_at
ORDER BY qz.created_at DESC;

COMMENT ON VIEW public.v_instructor_quiz_performance
  IS 'Quiz performance statistics with average score, submission count, and pass rate';


-- ============================================================================
-- TEAM VIEWS
-- ============================================================================

-- REQ-BE-079: Team Overview View
-- Returns team information with course name and member count.
CREATE OR REPLACE VIEW public.v_team_overview AS
SELECT
  t.id          AS team_id,
  t.name        AS team_name,
  c.title       AS course_name,
  (
    SELECT COUNT(*)::INTEGER
    FROM public.team_members tm
    WHERE tm.team_id = t.id
  )             AS member_count,
  t.description,
  t.created_at
FROM public.teams t
JOIN public.courses c ON c.id = t.course_id;

COMMENT ON VIEW public.v_team_overview
  IS 'Team overview with course name and member count';


-- REQ-BE-079: Team Members Detail View
-- Returns team member details with profile information.
CREATE OR REPLACE VIEW public.v_team_members_detail AS
SELECT
  tm.id             AS member_id,
  tm.team_id,
  tm.user_id,
  p.display_name,
  p.avatar_url,
  tm.role,
  tm.last_active_at
FROM public.team_members tm
JOIN public.profiles p ON p.id = tm.user_id;

COMMENT ON VIEW public.v_team_members_detail
  IS 'Team members with profile display name, avatar, and activity status';


-- REQ-BE-079: Team Shared Memos View
-- Returns team-visible, non-draft memos with author name and content excerpt.
CREATE OR REPLACE VIEW public.v_team_shared_memos AS
SELECT
  m.id              AS memo_id,
  m.title,
  p.display_name    AS author_name,
  LEFT(m.content, 120) AS excerpt,
  m.updated_at,
  m.team_id
FROM public.memos m
JOIN public.profiles p ON p.id = m.author_id
WHERE m.visibility = 'team'
  AND m.is_draft = false
ORDER BY m.updated_at DESC;

COMMENT ON VIEW public.v_team_shared_memos
  IS 'Published team memos with author name and content excerpt';
