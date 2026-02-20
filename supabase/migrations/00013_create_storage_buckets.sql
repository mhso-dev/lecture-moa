-- Migration: 00013_create_storage_buckets
-- Description: Create storage buckets for course and material images

-- Create course-images bucket (public, 5MB limit, image types only)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'course-images',
  'course-images',
  true,
  5242880, -- 5MB in bytes
  ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml']
)
ON CONFLICT (id) DO NOTHING;

-- Create material-images bucket (public, 10MB limit, image types only)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'material-images',
  'material-images',
  true,
  10485760, -- 10MB in bytes
  ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml']
)
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- RLS policies for course-images bucket
-- ============================================================

-- Anyone can read public bucket files (public bucket, but policy makes it explicit)
CREATE POLICY "course_images_select_public"
  ON storage.objects FOR SELECT
  TO public
  USING (bucket_id = 'course-images');

-- Only course instructors can upload to course-images
CREATE POLICY "course_images_insert_instructor"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'course-images'
    AND public.get_user_role() = 'instructor'
  );

-- Only course instructors can update their own uploads in course-images
CREATE POLICY "course_images_update_instructor"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'course-images'
    AND auth.uid() = owner
    AND public.get_user_role() = 'instructor'
  )
  WITH CHECK (
    bucket_id = 'course-images'
    AND auth.uid() = owner
    AND public.get_user_role() = 'instructor'
  );

-- Only course instructors can delete their own uploads from course-images
CREATE POLICY "course_images_delete_instructor"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'course-images'
    AND auth.uid() = owner
    AND public.get_user_role() = 'instructor'
  );

-- ============================================================
-- RLS policies for material-images bucket
-- ============================================================

-- Anyone can read public bucket files
CREATE POLICY "material_images_select_public"
  ON storage.objects FOR SELECT
  TO public
  USING (bucket_id = 'material-images');

-- Only course instructors can upload to material-images
CREATE POLICY "material_images_insert_instructor"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'material-images'
    AND public.get_user_role() = 'instructor'
  );

-- Only course instructors can update their own uploads in material-images
CREATE POLICY "material_images_update_instructor"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'material-images'
    AND auth.uid() = owner
    AND public.get_user_role() = 'instructor'
  )
  WITH CHECK (
    bucket_id = 'material-images'
    AND auth.uid() = owner
    AND public.get_user_role() = 'instructor'
  );

-- Only course instructors can delete their own uploads from material-images
CREATE POLICY "material_images_delete_instructor"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'material-images'
    AND auth.uid() = owner
    AND public.get_user_role() = 'instructor'
  );

COMMENT ON TABLE storage.buckets IS 'Storage buckets for course and material images';
