-- Migration: 00010_create_indexes
-- Description: Create performance indexes for all tables

-- courses indexes
CREATE INDEX idx_courses_instructor_id ON public.courses(instructor_id);
CREATE INDEX idx_courses_status ON public.courses(status);
CREATE INDEX idx_courses_category ON public.courses(category);

-- course_enrollments indexes
CREATE INDEX idx_course_enrollments_course_id ON public.course_enrollments(course_id);
CREATE INDEX idx_course_enrollments_student_id ON public.course_enrollments(student_id);

-- materials indexes
CREATE INDEX idx_materials_course_id_status ON public.materials(course_id, status);
CREATE INDEX idx_materials_course_id_position ON public.materials(course_id, position);

-- questions indexes
CREATE INDEX idx_questions_material_id ON public.questions(material_id);
CREATE INDEX idx_questions_course_id ON public.questions(course_id);
CREATE INDEX idx_questions_author_id ON public.questions(author_id);
CREATE INDEX idx_questions_status ON public.questions(status);

-- answers indexes
CREATE INDEX idx_answers_question_id ON public.answers(question_id);
CREATE INDEX idx_answers_author_id ON public.answers(author_id);

-- votes indexes
CREATE INDEX idx_votes_target ON public.votes(target_type, target_id);

-- teams indexes
CREATE INDEX idx_teams_course_id ON public.teams(course_id);

-- team_members indexes
CREATE INDEX idx_team_members_team_id ON public.team_members(team_id);
CREATE INDEX idx_team_members_user_id ON public.team_members(user_id);

-- memos indexes
CREATE INDEX idx_memos_author_id ON public.memos(author_id);
CREATE INDEX idx_memos_material_id ON public.memos(material_id);
CREATE INDEX idx_memos_team_id ON public.memos(team_id);
CREATE INDEX idx_memos_visibility ON public.memos(visibility);

-- quizzes indexes
CREATE INDEX idx_quizzes_course_id ON public.quizzes(course_id);
CREATE INDEX idx_quizzes_status ON public.quizzes(status);

-- quiz_attempts indexes
CREATE INDEX idx_quiz_attempts_quiz_id ON public.quiz_attempts(quiz_id);
CREATE INDEX idx_quiz_attempts_student_id ON public.quiz_attempts(student_id);

-- quiz_answers indexes
CREATE INDEX idx_quiz_answers_attempt_id ON public.quiz_answers(attempt_id);
CREATE INDEX idx_quiz_answers_question_id ON public.quiz_answers(question_id);

-- notifications indexes
CREATE INDEX idx_notifications_user_id_is_read ON public.notifications(user_id, is_read);
CREATE INDEX idx_notifications_user_id_created_at ON public.notifications(user_id, created_at DESC);
