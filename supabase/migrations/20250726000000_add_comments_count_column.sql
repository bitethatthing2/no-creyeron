-- Add missing wolfpack_comments_count column to wolfpack_videos table
-- This column is expected by the frontend code but was missing from the schema

-- Add the wolfpack_comments_count column
ALTER TABLE "public"."wolfpack_videos" 
ADD COLUMN IF NOT EXISTS "wolfpack_comments_count" integer DEFAULT 0;

-- Create index for performance
CREATE INDEX IF NOT EXISTS "idx_wolfpack_videos_wolfpack_comments_count" 
ON "public"."wolfpack_videos" USING btree ("wolfpack_comments_count");

-- Create a function to update wolfpack_comments_count when wolfpack_comments are added/deleted
CREATE OR REPLACE FUNCTION update_video_wolfpack_comments_count()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        -- Increment count when comment is added
        UPDATE wolfpack_videos 
        SET wolfpack_comments_count = COALESCE(wolfpack_comments_count, 0) + 1
        WHERE id = NEW.video_id;
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        -- Decrement count when comment is deleted
        UPDATE wolfpack_videos 
        SET wolfpack_comments_count = GREATEST(COALESCE(wolfpack_comments_count, 0) - 1, 0)
        WHERE id = OLD.video_id;
        RETURN OLD;
    ELSIF TG_OP = 'UPDATE' THEN
        -- Handle soft delete (is_deleted flag)
        IF OLD.is_deleted = FALSE AND NEW.is_deleted = TRUE THEN
            -- Comment was soft deleted
            UPDATE wolfpack_videos 
            SET wolfpack_comments_count = GREATEST(COALESCE(wolfpack_comments_count, 0) - 1, 0)
            WHERE id = NEW.video_id;
        ELSIF OLD.is_deleted = TRUE AND NEW.is_deleted = FALSE THEN
            -- Comment was restored
            UPDATE wolfpack_videos 
            SET wolfpack_comments_count = COALESCE(wolfpack_comments_count, 0) + 1
            WHERE id = NEW.video_id;
        END IF;
        RETURN NEW;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Create triggers to maintain wolfpack_comments_count
DROP TRIGGER IF EXISTS trigger_update_wolfpack_comments_count_insert ON wolfpack_comments;
CREATE TRIGGER trigger_update_wolfpack_comments_count_insert
    AFTER INSERT ON wolfpack_comments
    FOR EACH ROW
    EXECUTE FUNCTION update_video_wolfpack_comments_count();

DROP TRIGGER IF EXISTS trigger_update_wolfpack_comments_count_delete ON wolfpack_comments;
CREATE TRIGGER trigger_update_wolfpack_comments_count_delete
    AFTER DELETE ON wolfpack_comments
    FOR EACH ROW
    EXECUTE FUNCTION update_video_wolfpack_comments_count();

DROP TRIGGER IF EXISTS trigger_update_wolfpack_comments_count_update ON wolfpack_comments;
CREATE TRIGGER trigger_update_wolfpack_comments_count_update
    AFTER UPDATE ON wolfpack_comments
    FOR EACH ROW
    EXECUTE FUNCTION update_video_wolfpack_comments_count();

-- Initialize wolfpack_comments_count for existing wolfpack_videos
UPDATE wolfpack_videos 
SET wolfpack_comments_count = (
    SELECT COUNT(*)
    FROM wolfpack_comments
    WHERE wolfpack_comments.video_id = wolfpack_videos.id 
    AND NOT wolfpack_comments.is_deleted
)
WHERE wolfpack_comments_count IS NULL OR wolfpack_comments_count = 0;

-- Refresh schema cache
NOTIFY pgrst, 'reload schema';