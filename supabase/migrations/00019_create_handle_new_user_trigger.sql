-- Migration: 00019_create_handle_new_user_trigger
-- Description: Create trigger to auto-create profiles row on auth.users insert,
--              and backfill existing users who have no profile row.
--
-- Root Cause Fix: Without this trigger, new signups leave public.profiles empty,
-- causing get_user_role() to return NULL and RLS policies that check
-- get_user_role() = 'instructor' to deny access with a 403 error.

-- -----------------------------------------------------------------------
-- 1. Trigger function: handle_new_user
-- -----------------------------------------------------------------------
-- Runs AFTER INSERT on auth.users (via the on_auth_user_created trigger below).
-- Extracts role and display_name from raw_user_meta_data and inserts a profiles
-- row.  ON CONFLICT DO NOTHING ensures idempotency if the row already exists.
-- SECURITY DEFINER is required so the function can write to public.profiles
-- even when called from the auth schema context.
-- -----------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_role         TEXT;
  v_display_name TEXT;
BEGIN
  -- Extract role; fall back to 'student' when not provided
  v_role := COALESCE(
    NULLIF(TRIM(NEW.raw_user_meta_data->>'role'), ''),
    'student'
  );

  -- Clamp to allowed values for safety
  IF v_role NOT IN ('instructor', 'student') THEN
    v_role := 'student';
  END IF;

  -- Extract display_name; fall back to the email prefix (left of '@')
  v_display_name := COALESCE(
    NULLIF(TRIM(NEW.raw_user_meta_data->>'display_name'), ''),
    SPLIT_PART(NEW.email, '@', 1)
  );

  INSERT INTO public.profiles (id, role, display_name, created_at, updated_at)
  VALUES (NEW.id, v_role, v_display_name, now(), now())
  ON CONFLICT (id) DO NOTHING;

  RETURN NEW;
END;
$$;

COMMENT ON FUNCTION public.handle_new_user IS
  'Auto-creates a public.profiles row whenever a new auth.users record is inserted. '
  'Reads role and display_name from raw_user_meta_data; defaults to student / email prefix.';

-- -----------------------------------------------------------------------
-- 2. Trigger: on_auth_user_created
-- -----------------------------------------------------------------------
-- Attach the function to auth.users so it fires on every new signup.
-- DROP ... IF EXISTS first so the migration is safe to re-run.
-- -----------------------------------------------------------------------
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- -----------------------------------------------------------------------
-- 3. Backfill: create profiles for existing auth.users with no profile row
-- -----------------------------------------------------------------------
-- Uses the same logic as the trigger function so that historical users
-- receive a sensible role and display_name.
-- ON CONFLICT DO NOTHING makes this idempotent.
-- -----------------------------------------------------------------------
INSERT INTO public.profiles (id, role, display_name, created_at, updated_at)
SELECT
  u.id,
  CASE
    WHEN u.raw_user_meta_data->>'role' IN ('instructor', 'student')
      THEN u.raw_user_meta_data->>'role'
    ELSE 'student'
  END AS role,
  COALESCE(
    NULLIF(TRIM(u.raw_user_meta_data->>'display_name'), ''),
    SPLIT_PART(u.email, '@', 1)
  ) AS display_name,
  u.created_at,
  now()
FROM auth.users u
WHERE NOT EXISTS (
  SELECT 1 FROM public.profiles p WHERE p.id = u.id
)
ON CONFLICT (id) DO NOTHING;
