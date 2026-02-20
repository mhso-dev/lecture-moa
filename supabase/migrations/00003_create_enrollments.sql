-- Migration: 00003_create_enrollments
-- Description: Create course_enrollments table

CREATE TABLE public.course_enrollments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id UUID NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  enrolled_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'dropped', 'completed')),
  progress_percent INTEGER NOT NULL DEFAULT 0 CHECK (progress_percent >= 0 AND progress_percent <= 100),
  UNIQUE(course_id, student_id)
);

COMMENT ON TABLE public.course_enrollments IS 'Student enrollments in courses';
COMMENT ON COLUMN public.course_enrollments.progress_percent IS 'Course completion progress (0-100)';
