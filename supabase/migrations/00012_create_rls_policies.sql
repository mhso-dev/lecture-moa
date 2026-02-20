-- Migration: 00012_create_rls_policies
-- Description: Enable RLS on all tables and create access policies

-- ============================================================
-- Enable RLS on all 15 tables
-- ============================================================
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.course_enrollments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.materials ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.answers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.votes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.team_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.memos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quizzes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quiz_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quiz_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quiz_answers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- profiles policies
-- ============================================================

-- All authenticated users can view profiles
CREATE POLICY profiles_select_authenticated
  ON public.profiles FOR SELECT
  TO authenticated
  USING (true);

-- Users can update their own profile
CREATE POLICY profiles_update_own
  ON public.profiles FOR UPDATE
  TO authenticated
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

-- Users can delete their own profile
CREATE POLICY profiles_delete_own
  ON public.profiles FOR DELETE
  TO authenticated
  USING (id = auth.uid());

-- Users can insert their own profile (for initial signup)
CREATE POLICY profiles_insert_own
  ON public.profiles FOR INSERT
  TO authenticated
  WITH CHECK (id = auth.uid());

-- ============================================================
-- courses policies
-- ============================================================

-- Published courses visible to all authenticated; instructors see all their own
CREATE POLICY courses_select_published
  ON public.courses FOR SELECT
  TO authenticated
  USING (
    status = 'published'
    OR instructor_id = auth.uid()
  );

-- Only instructors can create courses
CREATE POLICY courses_insert_instructor
  ON public.courses FOR INSERT
  TO authenticated
  WITH CHECK (
    instructor_id = auth.uid()
    AND public.get_user_role() = 'instructor'
  );

-- Instructors can update their own courses
CREATE POLICY courses_update_instructor
  ON public.courses FOR UPDATE
  TO authenticated
  USING (instructor_id = auth.uid())
  WITH CHECK (instructor_id = auth.uid());

-- Instructors can delete their own courses
CREATE POLICY courses_delete_instructor
  ON public.courses FOR DELETE
  TO authenticated
  USING (instructor_id = auth.uid());

-- ============================================================
-- course_enrollments policies
-- ============================================================

-- Instructors can see enrollments for their courses; students see their own
CREATE POLICY enrollments_select
  ON public.course_enrollments FOR SELECT
  TO authenticated
  USING (
    student_id = auth.uid()
    OR public.is_course_instructor(course_id)
  );

-- Authenticated users can enroll (insert)
CREATE POLICY enrollments_insert
  ON public.course_enrollments FOR INSERT
  TO authenticated
  WITH CHECK (student_id = auth.uid());

-- Students can drop their own enrollment; instructors can manage enrollments for their courses
CREATE POLICY enrollments_delete
  ON public.course_enrollments FOR DELETE
  TO authenticated
  USING (
    student_id = auth.uid()
    OR public.is_course_instructor(course_id)
  );

-- ============================================================
-- materials policies
-- ============================================================

-- Enrolled students see published materials; instructor sees all in their courses
CREATE POLICY materials_select
  ON public.materials FOR SELECT
  TO authenticated
  USING (
    public.is_course_instructor(course_id)
    OR (
      status = 'published'
      AND public.is_course_enrolled(course_id)
    )
  );

-- Only course instructor can insert materials
CREATE POLICY materials_insert_instructor
  ON public.materials FOR INSERT
  TO authenticated
  WITH CHECK (public.is_course_instructor(course_id));

-- Only course instructor can update materials
CREATE POLICY materials_update_instructor
  ON public.materials FOR UPDATE
  TO authenticated
  USING (public.is_course_instructor(course_id))
  WITH CHECK (public.is_course_instructor(course_id));

-- Only course instructor can delete materials
CREATE POLICY materials_delete_instructor
  ON public.materials FOR DELETE
  TO authenticated
  USING (public.is_course_instructor(course_id));

-- ============================================================
-- questions policies
-- ============================================================

-- Enrolled students and instructor can view questions
CREATE POLICY questions_select
  ON public.questions FOR SELECT
  TO authenticated
  USING (
    public.is_course_instructor(course_id)
    OR public.is_course_enrolled(course_id)
  );

-- Enrolled students can create questions
CREATE POLICY questions_insert_enrolled
  ON public.questions FOR INSERT
  TO authenticated
  WITH CHECK (
    author_id = auth.uid()
    AND public.is_course_enrolled(course_id)
  );

-- Author or instructor can update questions
CREATE POLICY questions_update
  ON public.questions FOR UPDATE
  TO authenticated
  USING (
    author_id = auth.uid()
    OR public.is_course_instructor(course_id)
  )
  WITH CHECK (
    author_id = auth.uid()
    OR public.is_course_instructor(course_id)
  );

-- Author or instructor can delete questions
CREATE POLICY questions_delete
  ON public.questions FOR DELETE
  TO authenticated
  USING (
    author_id = auth.uid()
    OR public.is_course_instructor(course_id)
  );

-- ============================================================
-- answers policies
-- ============================================================

-- Enrolled students and instructor can view answers
CREATE POLICY answers_select
  ON public.answers FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.questions q
      WHERE q.id = question_id
        AND (
          public.is_course_instructor(q.course_id)
          OR public.is_course_enrolled(q.course_id)
        )
    )
  );

-- Enrolled authenticated users can create answers
CREATE POLICY answers_insert_enrolled
  ON public.answers FOR INSERT
  TO authenticated
  WITH CHECK (
    author_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM public.questions q
      WHERE q.id = question_id
        AND public.is_course_enrolled(q.course_id)
    )
  );

-- Author can update their own answers
CREATE POLICY answers_update_author
  ON public.answers FOR UPDATE
  TO authenticated
  USING (author_id = auth.uid())
  WITH CHECK (author_id = auth.uid());

-- Author or course instructor can delete answers
CREATE POLICY answers_delete
  ON public.answers FOR DELETE
  TO authenticated
  USING (
    author_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public.questions q
      WHERE q.id = question_id
        AND public.is_course_instructor(q.course_id)
    )
  );

-- ============================================================
-- votes policies
-- ============================================================

-- Authenticated users can view their own votes
CREATE POLICY votes_select_own
  ON public.votes FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- Authenticated users can create their own votes
CREATE POLICY votes_insert_own
  ON public.votes FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

-- Authenticated users can update their own votes
CREATE POLICY votes_update_own
  ON public.votes FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Authenticated users can delete their own votes
CREATE POLICY votes_delete_own
  ON public.votes FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());

-- ============================================================
-- teams policies
-- ============================================================

-- Enrolled users can view teams in their courses
CREATE POLICY teams_select_enrolled
  ON public.teams FOR SELECT
  TO authenticated
  USING (
    public.is_course_enrolled(course_id)
    OR public.is_course_instructor(course_id)
  );

-- Enrolled students can create teams
CREATE POLICY teams_insert_enrolled
  ON public.teams FOR INSERT
  TO authenticated
  WITH CHECK (
    created_by = auth.uid()
    AND public.is_course_enrolled(course_id)
  );

-- Team leader can update team
CREATE POLICY teams_update_leader
  ON public.teams FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.team_members tm
      WHERE tm.team_id = id
        AND tm.user_id = auth.uid()
        AND tm.role = 'leader'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.team_members tm
      WHERE tm.team_id = id
        AND tm.user_id = auth.uid()
        AND tm.role = 'leader'
    )
  );

-- Team leader can delete team
CREATE POLICY teams_delete_leader
  ON public.teams FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.team_members tm
      WHERE tm.team_id = id
        AND tm.user_id = auth.uid()
        AND tm.role = 'leader'
    )
  );

-- ============================================================
-- team_members policies
-- ============================================================

-- Team members can view their team's members
CREATE POLICY team_members_select
  ON public.team_members FOR SELECT
  TO authenticated
  USING (public.is_team_member(team_id));

-- Enrolled students can join teams (insert)
CREATE POLICY team_members_insert_enrolled
  ON public.team_members FOR INSERT
  TO authenticated
  WITH CHECK (
    user_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM public.teams t
      WHERE t.id = team_id
        AND public.is_course_enrolled(t.course_id)
    )
  );

-- Self or team leader can remove members
CREATE POLICY team_members_delete
  ON public.team_members FOR DELETE
  TO authenticated
  USING (
    user_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public.team_members tm
      WHERE tm.team_id = team_members.team_id
        AND tm.user_id = auth.uid()
        AND tm.role = 'leader'
    )
  );

-- ============================================================
-- memos policies
-- ============================================================

-- Personal memos: author only; Team memos: team members can view
CREATE POLICY memos_select
  ON public.memos FOR SELECT
  TO authenticated
  USING (
    (visibility = 'personal' AND author_id = auth.uid())
    OR (visibility = 'team' AND team_id IS NOT NULL AND public.is_team_member(team_id))
  );

-- Author can insert memos
CREATE POLICY memos_insert_author
  ON public.memos FOR INSERT
  TO authenticated
  WITH CHECK (author_id = auth.uid());

-- Author can update their own memos
CREATE POLICY memos_update_author
  ON public.memos FOR UPDATE
  TO authenticated
  USING (author_id = auth.uid())
  WITH CHECK (author_id = auth.uid());

-- Author can delete their own memos
CREATE POLICY memos_delete_author
  ON public.memos FOR DELETE
  TO authenticated
  USING (author_id = auth.uid());

-- ============================================================
-- quizzes policies
-- ============================================================

-- Enrolled students see published quizzes; instructor sees all
CREATE POLICY quizzes_select
  ON public.quizzes FOR SELECT
  TO authenticated
  USING (
    public.is_course_instructor(course_id)
    OR (
      status = 'published'
      AND public.is_course_enrolled(course_id)
    )
  );

-- Only course instructor can create quizzes
CREATE POLICY quizzes_insert_instructor
  ON public.quizzes FOR INSERT
  TO authenticated
  WITH CHECK (public.is_course_instructor(course_id));

-- Only course instructor can update quizzes
CREATE POLICY quizzes_update_instructor
  ON public.quizzes FOR UPDATE
  TO authenticated
  USING (public.is_course_instructor(course_id))
  WITH CHECK (public.is_course_instructor(course_id));

-- Only course instructor can delete quizzes
CREATE POLICY quizzes_delete_instructor
  ON public.quizzes FOR DELETE
  TO authenticated
  USING (public.is_course_instructor(course_id));

-- ============================================================
-- quiz_questions policies
-- ============================================================

-- Same visibility as quizzes: enrolled (published) + instructor (all)
CREATE POLICY quiz_questions_select
  ON public.quiz_questions FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.quizzes q
      WHERE q.id = quiz_id
        AND (
          public.is_course_instructor(q.course_id)
          OR (
            q.status = 'published'
            AND public.is_course_enrolled(q.course_id)
          )
        )
    )
  );

-- Only course instructor can manage quiz questions
CREATE POLICY quiz_questions_insert_instructor
  ON public.quiz_questions FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.quizzes q
      WHERE q.id = quiz_id
        AND public.is_course_instructor(q.course_id)
    )
  );

CREATE POLICY quiz_questions_update_instructor
  ON public.quiz_questions FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.quizzes q
      WHERE q.id = quiz_id
        AND public.is_course_instructor(q.course_id)
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.quizzes q
      WHERE q.id = quiz_id
        AND public.is_course_instructor(q.course_id)
    )
  );

CREATE POLICY quiz_questions_delete_instructor
  ON public.quiz_questions FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.quizzes q
      WHERE q.id = quiz_id
        AND public.is_course_instructor(q.course_id)
    )
  );

-- ============================================================
-- quiz_attempts policies
-- ============================================================

-- Students see their own attempts; instructor sees all for their courses
CREATE POLICY quiz_attempts_select
  ON public.quiz_attempts FOR SELECT
  TO authenticated
  USING (
    student_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public.quizzes q
      WHERE q.id = quiz_id
        AND public.is_course_instructor(q.course_id)
    )
  );

-- Enrolled students can create attempts
CREATE POLICY quiz_attempts_insert_enrolled
  ON public.quiz_attempts FOR INSERT
  TO authenticated
  WITH CHECK (
    student_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM public.quizzes q
      WHERE q.id = quiz_id
        AND public.is_course_enrolled(q.course_id)
    )
  );

-- Students can update their own attempts (e.g., submit)
CREATE POLICY quiz_attempts_update_own
  ON public.quiz_attempts FOR UPDATE
  TO authenticated
  USING (student_id = auth.uid())
  WITH CHECK (student_id = auth.uid());

-- ============================================================
-- quiz_answers policies
-- ============================================================

-- Attempt owner and course instructor can view answers
CREATE POLICY quiz_answers_select
  ON public.quiz_answers FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.quiz_attempts qa
      WHERE qa.id = attempt_id
        AND (
          qa.student_id = auth.uid()
          OR EXISTS (
            SELECT 1 FROM public.quizzes q
            WHERE q.id = qa.quiz_id
              AND public.is_course_instructor(q.course_id)
          )
        )
    )
  );

-- Attempt owner can insert answers
CREATE POLICY quiz_answers_insert_owner
  ON public.quiz_answers FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.quiz_attempts qa
      WHERE qa.id = attempt_id
        AND qa.student_id = auth.uid()
    )
  );

-- Attempt owner can update their answers
CREATE POLICY quiz_answers_update_owner
  ON public.quiz_answers FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.quiz_attempts qa
      WHERE qa.id = attempt_id
        AND qa.student_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.quiz_attempts qa
      WHERE qa.id = attempt_id
        AND qa.student_id = auth.uid()
    )
  );

-- ============================================================
-- notifications policies
-- ============================================================

-- Users can only see their own notifications
CREATE POLICY notifications_select_own
  ON public.notifications FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- Users can update their own notifications (mark as read)
CREATE POLICY notifications_update_own
  ON public.notifications FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Users can delete their own notifications
CREATE POLICY notifications_delete_own
  ON public.notifications FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());
