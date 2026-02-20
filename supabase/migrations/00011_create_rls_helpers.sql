-- Migration: 00011_create_rls_helpers
-- Description: Create RLS helper functions with SECURITY DEFINER

-- Get the role of the current authenticated user
CREATE OR REPLACE FUNCTION public.get_user_role()
RETURNS TEXT
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role FROM public.profiles WHERE id = auth.uid();
$$;

-- Check if the current user is the instructor of a given course
CREATE OR REPLACE FUNCTION public.is_course_instructor(p_course_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.courses
    WHERE id = p_course_id
      AND instructor_id = auth.uid()
  );
$$;

-- Check if the current user is actively enrolled in a given course
CREATE OR REPLACE FUNCTION public.is_course_enrolled(p_course_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.course_enrollments
    WHERE course_id = p_course_id
      AND student_id = auth.uid()
      AND status = 'active'
  );
$$;

-- Check if the current user is a member of a given team
CREATE OR REPLACE FUNCTION public.is_team_member(p_team_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.team_members
    WHERE team_id = p_team_id
      AND user_id = auth.uid()
  );
$$;

COMMENT ON FUNCTION public.get_user_role IS 'Returns the role of the authenticated user';
COMMENT ON FUNCTION public.is_course_instructor IS 'Checks if the authenticated user is the instructor of a course';
COMMENT ON FUNCTION public.is_course_enrolled IS 'Checks if the authenticated user is actively enrolled in a course';
COMMENT ON FUNCTION public.is_team_member IS 'Checks if the authenticated user is a member of a team';
