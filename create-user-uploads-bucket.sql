-- Create user-uploads storage bucket for profile images
DO $$
BEGIN
  -- Check if bucket exists
  IF NOT EXISTS (SELECT 1 FROM storage.buckets WHERE id = 'user-uploads') THEN
    INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types) 
    VALUES (
      'user-uploads', 
      'user-uploads', 
      true,
      5242880, -- 5MB limit for profile images
      ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp']::text[]
    );
  END IF;
END $$;

-- Drop existing policies
DROP POLICY IF EXISTS "user_uploads_public_read" ON storage.objects;
DROP POLICY IF EXISTS "user_uploads_auth_insert" ON storage.objects;
DROP POLICY IF EXISTS "user_uploads_auth_update" ON storage.objects;
DROP POLICY IF EXISTS "user_uploads_auth_delete" ON storage.objects;

-- Create storage policies for user-uploads bucket

-- Anyone can view public profile images
CREATE POLICY "user_uploads_public_read" ON storage.objects
FOR SELECT TO anon, authenticated
USING (bucket_id = 'user-uploads');

-- Authenticated users can upload to user-uploads bucket
CREATE POLICY "user_uploads_auth_insert" ON storage.objects
FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'user-uploads');

-- Users can update their own uploads
CREATE POLICY "user_uploads_auth_update" ON storage.objects
FOR UPDATE TO authenticated
USING (
  bucket_id = 'user-uploads' 
  AND (storage.foldername(name))[1] = 'avatars' -- For profile avatars folder
);

-- Users can delete their own uploads
CREATE POLICY "user_uploads_auth_delete" ON storage.objects
FOR DELETE TO authenticated
USING (
  bucket_id = 'user-uploads' 
  AND (storage.foldername(name))[1] = 'avatars' -- For profile avatars folder
);