-- Remove problematic example.com video records that are causing loading errors
-- These wolfpack_videos are trying to load from https://example.com/video1.mp4, etc.

-- Delete any wolfpack_videos records with example.com URLs
DELETE FROM public.wolfpack_videos 
WHERE video_url LIKE '%example.com%';

-- Also clean up any other placeholder or test URLs that might cause issues
DELETE FROM public.wolfpack_videos 
WHERE video_url LIKE '%placeholder%' 
   OR video_url LIKE '%test%' 
   OR video_url LIKE '%demo%'
   OR video_url LIKE '%localhost%'
   OR video_url LIKE '%127.0.0.1%';

-- Update any remaining problematic URLs to null (will show as images instead)
UPDATE public.wolfpack_videos 
SET video_url = null 
WHERE video_url IS NOT NULL 
  AND (video_url NOT LIKE 'http%' OR video_url LIKE '%.mp4' AND video_url NOT LIKE '%supabase%');

-- Clean up any broken thumbnail URLs as well
UPDATE public.wolfpack_videos 
SET thumbnail_url = null 
WHERE thumbnail_url LIKE '%example.com%' 
   OR thumbnail_url LIKE '%placeholder%' 
   OR thumbnail_url LIKE '%test%' 
   OR thumbnail_url LIKE '%demo%';