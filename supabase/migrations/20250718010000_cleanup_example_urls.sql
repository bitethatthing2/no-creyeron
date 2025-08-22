-- Remove records with example.com URLs
DELETE FROM "public"."content_posts" 
WHERE video_url LIKE '%example.com%' 
   OR thumbnail_url LIKE '%example.com%';

-- Update any placeholder thumbnail URLs to null
UPDATE "public"."content_posts" 
SET thumbnail_url = NULL 
WHERE thumbnail_url LIKE '%placeholder%';