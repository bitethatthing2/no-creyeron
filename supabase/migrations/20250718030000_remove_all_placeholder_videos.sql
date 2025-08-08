-- Remove all placeholder, sample, and broken video URLs
UPDATE "public"."wolfpack_videos" 
SET video_url = NULL, thumbnail_url = NULL 
WHERE video_url LIKE '%placeholder%' 
   OR video_url LIKE '%sample%' 
   OR video_url LIKE '%test%' 
   OR video_url LIKE '%demo%' 
   OR video_url LIKE '%example.com%'
   OR video_url LIKE '/sample-video%'
   OR video_url = '/sample-video-1.mp4'
   OR video_url = '/sample-video-2.mp4'
   OR thumbnail_url LIKE '%placeholder%'
   OR thumbnail_url LIKE '%sample%'
   OR thumbnail_url LIKE '%test%'
   OR thumbnail_url LIKE '%demo%'
   OR thumbnail_url LIKE '%example.com%';

-- Also remove any records that have broken storage URLs
UPDATE "public"."wolfpack_videos" 
SET video_url = NULL, thumbnail_url = NULL 
WHERE video_url LIKE '%/storage/v1/object/public/wolfpack_videos/placeholder%'
   OR thumbnail_url LIKE '%/storage/v1/object/public/wolfpack_videos/placeholder%';

-- Delete any completely empty records (no video, no thumbnail, no title)
DELETE FROM "public"."wolfpack_videos" 
WHERE video_url IS NULL 
  AND thumbnail_url IS NULL 
  AND (title IS NULL OR title = '');