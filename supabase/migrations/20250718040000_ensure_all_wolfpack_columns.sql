-- Ensure all required columns exist in content_posts table
ALTER TABLE "public"."content_posts" 
ADD COLUMN IF NOT EXISTS "description" text,
ADD COLUMN IF NOT EXISTS "duration" integer,
ADD COLUMN IF NOT EXISTS "view_count" integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS "like_count" integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS "is_featured" boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS "is_active" boolean DEFAULT true,
ADD COLUMN IF NOT EXISTS "created_at" timestamp with time zone DEFAULT now(),
ADD COLUMN IF NOT EXISTS "updated_at" timestamp with time zone DEFAULT now();

-- Refresh schema cache multiple times to ensure it takes effect
NOTIFY pgrst, 'reload schema';
NOTIFY pgrst, 'reload config';

-- Force schema cache refresh
SELECT 1;