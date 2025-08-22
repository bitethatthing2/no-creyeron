-- Note: RLS is already enabled on storage tables by Supabase

-- Create or update the wolfpack-media bucket
INSERT INTO storage.buckets (id, name, public) 
VALUES ('wolfpack-media', 'wolfpack-media', false) 
ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "wolfpack_media_upload" ON storage.objects;
DROP POLICY IF EXISTS "wolfpack_media_read" ON storage.objects;
DROP POLICY IF EXISTS "wolfpack_media_delete" ON storage.objects;

-- Create policy for authenticated users to upload to wolfpack-media bucket
CREATE POLICY "wolfpack_media_upload" ON storage.objects
FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'wolfpack-media');

-- Create policy for authenticated users to read from wolfpack-media bucket
CREATE POLICY "wolfpack_media_read" ON storage.objects
FOR SELECT TO authenticated
USING (bucket_id = 'wolfpack-media');

-- Create policy for authenticated users to delete their own files
CREATE POLICY "wolfpack_media_delete" ON storage.objects
FOR DELETE TO authenticated
USING (bucket_id = 'wolfpack-media' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Create policy for authenticated users to update their own files
CREATE POLICY "wolfpack_media_update" ON storage.objects
FOR UPDATE TO authenticated
USING (bucket_id = 'wolfpack-media' AND auth.uid()::text = (storage.foldername(name))[1]);