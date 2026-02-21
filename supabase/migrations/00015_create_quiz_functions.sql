-- Migration: 00015_create_quiz_functions
-- Description: Add UNIQUE constraint for quiz_answers upsert and create
--              PL/pgSQL functions for quiz attempt lifecycle (start, grade, duplicate)

-- ============================================================================
-- 1. UNIQUE constraint for quiz_answers auto-save upsert
-- ============================================================================
-- Required for ON CONFLICT (attempt_id, question_id) DO UPDATE pattern
-- used by the auto-save feature (REQ-BE-005-021).
-- Using DO $$ block to handle the case where the constraint already exists.

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'uq_quiz_answers_attempt_question'
      AND conrelid = 'public.quiz_answers'::regclass
  ) THEN
    ALTER TABLE public.quiz_answers
      ADD CONSTRAINT uq_quiz_answers_attempt_question
      UNIQUE (attempt_id, question_id);
  END IF;
END $$;


-- ============================================================================
-- 2. start_quiz_attempt(p_quiz_id UUID)
-- ============================================================================
-- Validates quiz state, checks reattempt rules, resumes in-progress attempts,
-- or creates a new attempt.
--
-- Error codes:
--   P0002 - Quiz not found
--   P0003 - Quiz is not published
--   P0004 - Quiz deadline has passed
--   P0005 - Reattempt not allowed
--
-- REQ-BE-005-002, REQ-BE-005-003

CREATE OR REPLACE FUNCTION public.start_quiz_attempt(p_quiz_id UUID)
RETURNS quiz_attempts
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_quiz quizzes%ROWTYPE;
  v_existing_attempt quiz_attempts%ROWTYPE;
  v_new_attempt quiz_attempts%ROWTYPE;
  v_user_id UUID := auth.uid();
BEGIN
  -- 1. Validate quiz exists
  SELECT * INTO v_quiz FROM quizzes WHERE id = p_quiz_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Quiz not found' USING ERRCODE = 'P0002';
  END IF;

  -- 2. Validate quiz is published
  IF v_quiz.status != 'published' THEN
    RAISE EXCEPTION 'Quiz is not published' USING ERRCODE = 'P0003';
  END IF;

  -- 3. Validate deadline has not passed
  IF v_quiz.due_date IS NOT NULL AND v_quiz.due_date < NOW() THEN
    RAISE EXCEPTION 'Quiz deadline has passed' USING ERRCODE = 'P0004';
  END IF;

  -- 4. Check reattempt policy
  IF NOT v_quiz.allow_reattempt THEN
    SELECT * INTO v_existing_attempt
    FROM quiz_attempts
    WHERE quiz_id = p_quiz_id
      AND student_id = v_user_id
      AND status IN ('submitted', 'graded');
    IF FOUND THEN
      RAISE EXCEPTION 'Reattempt not allowed for this quiz' USING ERRCODE = 'P0005';
    END IF;
  END IF;

  -- 5. Resume existing in_progress attempt if one exists
  SELECT * INTO v_existing_attempt
  FROM quiz_attempts
  WHERE quiz_id = p_quiz_id
    AND student_id = v_user_id
    AND status = 'in_progress';
  IF FOUND THEN
    RETURN v_existing_attempt;
  END IF;

  -- 6. Create new attempt
  INSERT INTO quiz_attempts (quiz_id, student_id, status, started_at)
  VALUES (p_quiz_id, v_user_id, 'in_progress', NOW())
  RETURNING * INTO v_new_attempt;

  RETURN v_new_attempt;
END;
$$;

COMMENT ON FUNCTION public.start_quiz_attempt IS
  'Start or resume a quiz attempt. Validates quiz status, deadline, and reattempt rules.';


-- ============================================================================
-- 3. submit_and_grade_quiz(p_attempt_id UUID)
-- ============================================================================
-- Validates attempt ownership and status, grades each answer by question type,
-- calculates total score, and updates the attempt to graded status.
--
-- Grading logic per question_type:
--   multiple_choice   - exact string match of answer vs correct_answer
--   true_false        - case-insensitive comparison (LOWER)
--   short_answer      - case-insensitive trimmed comparison (LOWER + TRIM)
--   fill_in_the_blank - case-insensitive trimmed comparison (LOWER + TRIM)
--
-- Error codes:
--   P0002 - Attempt not found
--   P0006 - Not authorized (attempt belongs to another user)
--   P0007 - Attempt already submitted/graded
--
-- REQ-BE-005-004, REQ-BE-005-005

CREATE OR REPLACE FUNCTION public.submit_and_grade_quiz(p_attempt_id UUID)
RETURNS quiz_attempts
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_attempt quiz_attempts%ROWTYPE;
  v_answer RECORD;
  v_question quiz_questions%ROWTYPE;
  v_is_correct BOOLEAN;
  v_points_earned INTEGER;
  v_total_score INTEGER := 0;
  v_total_points INTEGER := 0;
  v_user_id UUID := auth.uid();
BEGIN
  -- 1. Validate attempt exists
  SELECT * INTO v_attempt FROM quiz_attempts WHERE id = p_attempt_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Attempt not found' USING ERRCODE = 'P0002';
  END IF;

  -- 2. Validate ownership
  IF v_attempt.student_id != v_user_id THEN
    RAISE EXCEPTION 'Not authorized' USING ERRCODE = 'P0006';
  END IF;

  -- 3. Validate status is in_progress
  IF v_attempt.status != 'in_progress' THEN
    RAISE EXCEPTION 'Attempt already submitted' USING ERRCODE = 'P0007';
  END IF;

  -- 4. Grade each answer
  FOR v_answer IN
    SELECT qa.id AS answer_id, qa.question_id, qa.answer
    FROM quiz_answers qa
    WHERE qa.attempt_id = p_attempt_id
  LOOP
    -- Fetch the corresponding question
    SELECT * INTO v_question
    FROM quiz_questions
    WHERE id = v_answer.question_id;

    -- Skip if question not found (defensive)
    IF NOT FOUND THEN
      CONTINUE;
    END IF;

    -- Initialize grading result
    v_is_correct := FALSE;
    v_points_earned := 0;

    -- Grade based on question type
    CASE v_question.question_type
      WHEN 'multiple_choice' THEN
        -- Exact match for selected option identifier
        v_is_correct := (v_answer.answer = v_question.correct_answer);

      WHEN 'true_false' THEN
        -- Case-insensitive boolean comparison
        v_is_correct := (LOWER(v_answer.answer) = LOWER(v_question.correct_answer));

      WHEN 'short_answer' THEN
        -- Case-insensitive trimmed comparison
        v_is_correct := (LOWER(TRIM(v_answer.answer)) = LOWER(TRIM(v_question.correct_answer)));

      WHEN 'fill_in_the_blank' THEN
        -- Case-insensitive trimmed comparison
        v_is_correct := (LOWER(TRIM(v_answer.answer)) = LOWER(TRIM(v_question.correct_answer)));

      ELSE
        -- Unknown question type: mark incorrect
        v_is_correct := FALSE;
    END CASE;

    -- Award points if correct
    IF v_is_correct THEN
      v_points_earned := v_question.points;
    END IF;

    -- Update the answer record
    UPDATE quiz_answers
    SET is_correct = v_is_correct,
        points_earned = v_points_earned
    WHERE id = v_answer.answer_id;

    -- Accumulate score
    v_total_score := v_total_score + v_points_earned;
  END LOOP;

  -- 5. Calculate total possible points from all questions in this quiz
  SELECT COALESCE(SUM(points), 0) INTO v_total_points
  FROM quiz_questions
  WHERE quiz_id = v_attempt.quiz_id;

  -- 6. Update attempt with graded results
  UPDATE quiz_attempts
  SET score = v_total_score,
      total_points = v_total_points,
      status = 'graded',
      submitted_at = NOW()
  WHERE id = p_attempt_id
  RETURNING * INTO v_attempt;

  RETURN v_attempt;
END;
$$;

COMMENT ON FUNCTION public.submit_and_grade_quiz IS
  'Submit and grade a quiz attempt. Grades each answer by question type and updates the attempt.';


-- ============================================================================
-- 4. duplicate_quiz(p_quiz_id UUID)
-- ============================================================================
-- Copies a quiz and all its questions. The new quiz gets draft status
-- and " (Copy)" appended to the title. Only the quiz creator can duplicate.
--
-- Error codes:
--   P0002 - Quiz not found
--   P0006 - Not authorized (not the quiz creator)
--
-- REQ-BE-005-006

CREATE OR REPLACE FUNCTION public.duplicate_quiz(p_quiz_id UUID)
RETURNS quizzes
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_original quizzes%ROWTYPE;
  v_new_quiz quizzes%ROWTYPE;
  v_user_id UUID := auth.uid();
BEGIN
  -- 1. Validate quiz exists
  SELECT * INTO v_original FROM quizzes WHERE id = p_quiz_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Quiz not found' USING ERRCODE = 'P0002';
  END IF;

  -- 2. Validate ownership (only creator can duplicate)
  IF v_original.created_by != v_user_id THEN
    RAISE EXCEPTION 'Not authorized to duplicate this quiz' USING ERRCODE = 'P0006';
  END IF;

  -- 3. Copy quiz record with new id, draft status, and " (Copy)" suffix
  INSERT INTO quizzes (
    course_id, created_by, title, description,
    time_limit_minutes, passing_score, allow_reattempt,
    shuffle_questions, show_answers_after_submit,
    focus_loss_warning, status, is_ai_generated,
    source_material_id
  )
  VALUES (
    v_original.course_id, v_user_id,
    v_original.title || ' (Copy)', v_original.description,
    v_original.time_limit_minutes, v_original.passing_score,
    v_original.allow_reattempt, v_original.shuffle_questions,
    v_original.show_answers_after_submit, v_original.focus_loss_warning,
    'draft', v_original.is_ai_generated, v_original.source_material_id
  )
  RETURNING * INTO v_new_quiz;

  -- 4. Copy all questions (new ids generated by DEFAULT, new quiz_id reference)
  INSERT INTO quiz_questions (
    quiz_id, question_type, content, options,
    correct_answer, explanation, points, order_index
  )
  SELECT
    v_new_quiz.id, question_type, content, options,
    correct_answer, explanation, points, order_index
  FROM quiz_questions
  WHERE quiz_id = p_quiz_id
  ORDER BY order_index;

  RETURN v_new_quiz;
END;
$$;

COMMENT ON FUNCTION public.duplicate_quiz IS
  'Duplicate a quiz and all its questions. Creates a draft copy with " (Copy)" title suffix.';
