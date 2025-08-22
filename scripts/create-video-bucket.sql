-- Create a public bucket for menu videos
INSERT INTO storage.buckets (id, name, public, avif_autodetection, allowed_mime_types)
VALUES (
  'menu-videos',
  'menu-videos',
  true,
  false,
  ARRAY['video/mp4', 'video/webm', 'video/ogg']
);

-- Set up RLS policies for public read access
CREATE POLICY "Public Access" ON storage.objects 
FOR SELECT TO public 
USING (bucket_id = 'menu-videos');

-- Allow authenticated users to upload
CREATE POLICY "Authenticated users can upload" ON storage.objects 
FOR INSERT TO authenticated 
WITH CHECK (bucket_id = 'menu-videos');

-- Allow authenticated users to update
CREATE POLICY "Authenticated users can update" ON storage.objects 
FOR UPDATE TO authenticated 
USING (bucket_id = 'menu-videos');

-- Allow authenticated users to delete
CREATE POLICY "Authenticated users can delete" ON storage.objects 
FOR DELETE TO authenticated 
USING (bucket_id = 'menu-videos');