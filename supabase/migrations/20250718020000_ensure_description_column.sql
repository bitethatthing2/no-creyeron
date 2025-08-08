-- Ensure description column exists in wolfpack_videos table
ALTER TABLE "public"."wolfpack_videos" 
ADD COLUMN IF NOT EXISTS "description" text;

-- Refresh schema cache
NOTIFY pgrst, 'reload schema';