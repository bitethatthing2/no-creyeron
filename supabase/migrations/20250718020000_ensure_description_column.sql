-- Ensure description column exists in content_posts table
ALTER TABLE "public"."content_posts" 
ADD COLUMN IF NOT EXISTS "description" text;

-- Refresh schema cache
NOTIFY pgrst, 'reload schema';