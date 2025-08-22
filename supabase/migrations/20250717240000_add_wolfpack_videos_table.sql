-- Create content_posts table
CREATE TABLE IF NOT EXISTS "public"."content_posts" (
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
ALTER TABLE "public"."content_posts" ENABLE ROW LEVEL SECURITY;

-- Create indexes
CREATE INDEX IF NOT EXISTS "idx_content_posts_user_id" ON "public"."content_posts" USING btree ("user_id");
CREATE INDEX IF NOT EXISTS "idx_content_posts_created_at" ON "public"."content_posts" USING btree ("created_at" DESC);
CREATE INDEX IF NOT EXISTS "idx_content_posts_active" ON "public"."content_posts" USING btree ("is_active");

-- Add primary key
ALTER TABLE "public"."content_posts" ADD CONSTRAINT "content_posts_pkey" PRIMARY KEY ("id");

-- Add foreign key constraint
ALTER TABLE "public"."content_posts" ADD CONSTRAINT "content_posts_user_id_fkey" 
FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE;

-- Add updated_at trigger
CREATE TRIGGER update_content_posts_updated_at 
    BEFORE UPDATE ON "public"."content_posts" 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Create RLS policies
CREATE POLICY "Everyone can view active wolfpack content_posts"
    ON "public"."content_posts"
    FOR SELECT
    TO public
    USING (is_active = true);

CREATE POLICY "Users can insert their own wolfpack content_posts"
    ON "public"."content_posts"
    FOR INSERT
    TO public
    WITH CHECK (user_id IN (SELECT id FROM users WHERE auth_id = auth.uid()));

CREATE POLICY "Users can update their own wolfpack content_posts"
    ON "public"."content_posts"
    FOR UPDATE
    TO public
    USING (user_id IN (SELECT id FROM users WHERE auth_id = auth.uid()));

-- Grant permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE "public"."content_posts" TO "anon";
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE "public"."content_posts" TO "authenticated";
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE "public"."content_posts" TO "service_role";

-- Insert sample data
INSERT INTO "public"."content_posts" (user_id, title, description, video_url, thumbnail_url, duration, view_count, like_count)
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

INSERT INTO "public"."content_posts" (user_id, title, description, video_url, thumbnail_url, duration, view_count, like_count)
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