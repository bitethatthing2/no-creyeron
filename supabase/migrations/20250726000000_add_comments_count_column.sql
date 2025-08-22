-- Add missing content_comments_count column to content_posts table
-- This column is expected by the frontend code but was missing from the schema

-- Add the content_comments_count column
ALTER TABLE "public"."content_posts" 
ADD COLUMN IF NOT EXISTS "content_comments_count" integer DEFAULT 0;

-- Create index for performance
CREATE INDEX IF NOT EXISTS "idx_content_posts_content_comments_count" 
ON "public"."content_posts" USING btree ("content_comments_count");

-- Create a function to update content_comments_count when content_comments are added/deleted
CREATE OR REPLACE FUNCTION update_video_content_comments_count()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        -- Increment count when comment is added
        UPDATE content_posts 
        SET content_comments_count = COALESCE(content_comments_count, 0) + 1
        WHERE id = NEW.video_id;
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        -- Decrement count when comment is deleted
        UPDATE content_posts 
        SET content_comments_count = GREATEST(COALESCE(content_comments_count, 0) - 1, 0)
        WHERE id = OLD.video_id;
        RETURN OLD;
    ELSIF TG_OP = 'UPDATE' THEN
        -- Handle soft delete (is_deleted flag)
        IF OLD.is_deleted = FALSE AND NEW.is_deleted = TRUE THEN
            -- Comment was soft deleted
            UPDATE content_posts 
            SET content_comments_count = GREATEST(COALESCE(content_comments_count, 0) - 1, 0)
            WHERE id = NEW.video_id;
        ELSIF OLD.is_deleted = TRUE AND NEW.is_deleted = FALSE THEN
            -- Comment was restored
            UPDATE content_posts 
            SET content_comments_count = COALESCE(content_comments_count, 0) + 1
            WHERE id = NEW.video_id;
        END IF;
        RETURN NEW;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Create triggers to maintain content_comments_count
DROP TRIGGER IF EXISTS trigger_update_content_comments_count_insert ON content_comments;
CREATE TRIGGER trigger_update_content_comments_count_insert
    AFTER INSERT ON content_comments
    FOR EACH ROW
    EXECUTE FUNCTION update_video_content_comments_count();

DROP TRIGGER IF EXISTS trigger_update_content_comments_count_delete ON content_comments;
CREATE TRIGGER trigger_update_content_comments_count_delete
    AFTER DELETE ON content_comments
    FOR EACH ROW
    EXECUTE FUNCTION update_video_content_comments_count();

DROP TRIGGER IF EXISTS trigger_update_content_comments_count_update ON content_comments;
CREATE TRIGGER trigger_update_content_comments_count_update
    AFTER UPDATE ON content_comments
    FOR EACH ROW
    EXECUTE FUNCTION update_video_content_comments_count();

-- Initialize content_comments_count for existing content_posts
UPDATE content_posts 
SET content_comments_count = (
    SELECT COUNT(*)
    FROM content_comments
    WHERE content_comments.video_id = content_posts.id 
    AND NOT content_comments.is_deleted
)
WHERE content_comments_count IS NULL OR content_comments_count = 0;

-- Refresh schema cache
NOTIFY pgrst, 'reload schema';