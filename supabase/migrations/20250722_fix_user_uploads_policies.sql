-- Fix user-uploads storage policies to be more permissive initially

-- Drop existing policies
DROP POLICY IF EXISTS "user_uploads_auth_insert" ON storage.objects;
DROP POLICY IF EXISTS "user_uploads_auth_update" ON storage.objects;
DROP POLICY IF EXISTS "user_uploads_auth_delete" ON storage.objects;

-- Allow authenticated users to upload to user-uploads bucket (simplified)
CREATE POLICY "user_uploads_auth_insert" ON storage.objects
FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'user-uploads');

-- Allow users to update files in user-uploads bucket (simplified)
CREATE POLICY "user_uploads_auth_update" ON storage.objects
FOR UPDATE TO authenticated
USING (bucket_id = 'user-uploads');

-- Allow users to delete files in user-uploads bucket (simplified)
CREATE POLICY "user_uploads_auth_delete" ON storage.objects
FOR DELETE TO authenticated
USING (bucket_id = 'user-uploads');