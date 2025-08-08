-- Remove records with example.com URLs
DELETE FROM "public"."wolfpack_videos" 
WHERE video_url LIKE '%example.com%' 
   OR thumbnail_url LIKE '%example.com%';

-- Update any placeholder thumbnail URLs to null
UPDATE "public"."wolfpack_videos" 
SET thumbnail_url = NULL 
WHERE thumbnail_url LIKE '%placeholder%';