-- Migration: 00004_create_materials
-- Description: Create materials table for course content

CREATE TABLE public.materials (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id UUID NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  content TEXT NOT NULL DEFAULT '',
  excerpt TEXT,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published')),
  position INTEGER NOT NULL DEFAULT 0,
  tags TEXT[] DEFAULT '{}',
  read_time_minutes INTEGER DEFAULT 0,
  version INTEGER DEFAULT 1,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Apply updated_at trigger
CREATE TRIGGER materials_set_updated_at
  BEFORE UPDATE ON public.materials
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

COMMENT ON TABLE public.materials IS 'Course learning materials (Markdown content)';
COMMENT ON COLUMN public.materials.position IS 'Sort order within a course';
COMMENT ON COLUMN public.materials.tags IS 'Array of tags for categorization';
