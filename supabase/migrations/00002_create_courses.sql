-- Migration: 00002_create_courses
-- Description: Create courses table

CREATE TABLE public.courses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  instructor_id UUID NOT NULL REFERENCES public.profiles(id),
  title TEXT NOT NULL,
  description TEXT,
  cover_image_url TEXT,
  category TEXT CHECK (category IN ('programming', 'design', 'business', 'science', 'language', 'other')),
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'archived')),
  visibility TEXT NOT NULL DEFAULT 'public' CHECK (visibility IN ('public', 'invite_only')),
  invite_code TEXT UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Apply updated_at trigger
CREATE TRIGGER courses_set_updated_at
  BEFORE UPDATE ON public.courses
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

COMMENT ON TABLE public.courses IS 'Courses created by instructors';
COMMENT ON COLUMN public.courses.status IS 'Course lifecycle: draft -> published -> archived';
COMMENT ON COLUMN public.courses.visibility IS 'Access control: public or invite_only';
