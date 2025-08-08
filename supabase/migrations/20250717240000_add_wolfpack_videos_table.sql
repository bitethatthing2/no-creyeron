-- Create wolfpack_videos table
CREATE TABLE IF NOT EXISTS "public"."wolfpack_videos" (
    "id" uuid NOT NULL DEFAULT gen_random_uuid(),
    "user_id" uuid NOT NULL,
    "title" text,
    "description" text,
    "video_url" text,
    "thumbnail_url" text,
    "duration" integer,
    "view_count" integer DEFAULT 0,
    "like_count" integer DEFAULT 0,
    "is_featured" boolean DEFAULT false,
    "is_active" boolean DEFAULT true,
    "created_at" timestamp with time zone DEFAULT now(),
    "updated_at" timestamp with time zone DEFAULT now()
);

-- Enable RLS
ALTER TABLE "public"."wolfpack_videos" ENABLE ROW LEVEL SECURITY;

-- Create indexes
CREATE INDEX IF NOT EXISTS "idx_wolfpack_videos_user_id" ON "public"."wolfpack_videos" USING btree ("user_id");
CREATE INDEX IF NOT EXISTS "idx_wolfpack_videos_created_at" ON "public"."wolfpack_videos" USING btree ("created_at" DESC);
CREATE INDEX IF NOT EXISTS "idx_wolfpack_videos_active" ON "public"."wolfpack_videos" USING btree ("is_active");

-- Add primary key
ALTER TABLE "public"."wolfpack_videos" ADD CONSTRAINT "wolfpack_videos_pkey" PRIMARY KEY ("id");

-- Add foreign key constraint
ALTER TABLE "public"."wolfpack_videos" ADD CONSTRAINT "wolfpack_videos_user_id_fkey" 
FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE;

-- Add updated_at trigger
CREATE TRIGGER update_wolfpack_videos_updated_at 
    BEFORE UPDATE ON "public"."wolfpack_videos" 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Create RLS policies
CREATE POLICY "Everyone can view active wolfpack wolfpack_videos"
    ON "public"."wolfpack_videos"
    FOR SELECT
    TO public
    USING (is_active = true);

CREATE POLICY "Users can insert their own wolfpack wolfpack_videos"
    ON "public"."wolfpack_videos"
    FOR INSERT
    TO public
    WITH CHECK (user_id IN (SELECT id FROM users WHERE auth_id = auth.uid()));

CREATE POLICY "Users can update their own wolfpack wolfpack_videos"
    ON "public"."wolfpack_videos"
    FOR UPDATE
    TO public
    USING (user_id IN (SELECT id FROM users WHERE auth_id = auth.uid()));

-- Grant permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE "public"."wolfpack_videos" TO "anon";
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE "public"."wolfpack_videos" TO "authenticated";
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE "public"."wolfpack_videos" TO "service_role";

-- Insert sample data
INSERT INTO "public"."wolfpack_videos" (user_id, title, description, video_url, thumbnail_url, duration, view_count, like_count)
SELECT 
    u.id,
    'Sample Video 1',
    'First sample video for testing',
    '/sample-video-1.mp4',
    '/sample-video-1-thumb.jpg',
    30,
    0,
    0
FROM "public"."users" u
WHERE u.email = 'test@example.com'
LIMIT 1;

INSERT INTO "public"."wolfpack_videos" (user_id, title, description, video_url, thumbnail_url, duration, view_count, like_count)
SELECT 
    u.id,
    'Sample Video 2',
    'Second sample video for testing',
    '/sample-video-2.mp4',
    '/sample-video-2-thumb.jpg',
    45,
    0,
    0
FROM "public"."users" u
WHERE u.email = 'test@example.com'
LIMIT 1;