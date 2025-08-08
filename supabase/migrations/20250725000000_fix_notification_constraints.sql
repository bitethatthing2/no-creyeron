-- Fix notification constraints to allow like and comment notifications
-- and ensure proper message handling

-- Update the notifications_type_check constraint to include social activity types
ALTER TABLE "public"."wolfpack_activity_notifications" 
DROP CONSTRAINT IF EXISTS "notifications_type_check";

ALTER TABLE "public"."wolfpack_activity_notifications" 
ADD CONSTRAINT "notifications_type_check" 
CHECK ((type = ANY (ARRAY[
  'info'::text, 
  'warning'::text, 
  'error'::text, 
  'order_new'::text, 
  'order_ready'::text,
  'like'::text,
  'comment'::text,
  'follow'::text,
  'mention'::text
])));

-- Create function to generate notification message if null
CREATE OR REPLACE FUNCTION ensure_notification_message()
RETURNS TRIGGER AS $$
BEGIN
  -- If message is null or empty, generate a default message based on type
  IF NEW.message IS NULL OR trim(NEW.message) = '' THEN
    CASE NEW.type
      WHEN 'like' THEN
        NEW.message := 'Someone liked your post';
      WHEN 'comment' THEN  
        NEW.message := 'Someone commented on your post';
      WHEN 'follow' THEN
        NEW.message := 'Someone started following you';
      WHEN 'mention' THEN
        NEW.message := 'Someone mentioned you';
      WHEN 'order_new' THEN
        NEW.message := 'New order received';
      WHEN 'order_ready' THEN
        NEW.message := 'Your order is ready';
      ELSE
        NEW.message := 'You have a new notification';
    END CASE;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to ensure message is never null
DROP TRIGGER IF EXISTS ensure_notification_message_trigger ON "public"."wolfpack_activity_notifications";
CREATE TRIGGER ensure_notification_message_trigger
  BEFORE INSERT OR UPDATE ON "public"."wolfpack_activity_notifications"
  FOR EACH ROW
  EXECUTE FUNCTION ensure_notification_message();

-- Create function to automatically create notifications for likes
CREATE OR REPLACE FUNCTION create_like_notification()
RETURNS TRIGGER AS $$
DECLARE
  video_owner_id UUID;
  liker_name TEXT;
BEGIN
  -- Get the video owner and liker info
  SELECT 
    p.user_id,
    u.display_name
  INTO 
    video_owner_id,
    liker_name
  FROM wolfpack_posts p
  JOIN users u ON u.id = NEW.user_id
  WHERE p.id = NEW.video_id;
  
  -- Don't notify if user likes their own post
  IF video_owner_id != NEW.user_id THEN
    -- Create notification
    INSERT INTO wolfpack_activity_notifications (
      recipient_id,
      message,
      type,
      link,
      status,
      metadata,
      notification_type
    ) VALUES (
      video_owner_id,
      COALESCE(liker_name, 'Someone') || ' liked your post',
      'info',
      '/wolfpack/feed',
      'unread',
      jsonb_build_object(
        'video_id', NEW.video_id,
        'liker_id', NEW.user_id,
        'liker_name', liker_name
      ),
      'like'
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create function to automatically create notifications for wolfpack_comments
CREATE OR REPLACE FUNCTION create_comment_notification()
RETURNS TRIGGER AS $$
DECLARE
  video_owner_id UUID;
  commenter_name TEXT;
BEGIN
  -- Get the video owner and commenter info
  SELECT 
    p.user_id,
    u.display_name
  INTO 
    video_owner_id,
    commenter_name
  FROM wolfpack_posts p
  JOIN users u ON u.id = NEW.user_id
  WHERE p.id = NEW.video_id;
  
  -- Don't notify if user wolfpack_comments on their own post
  IF video_owner_id != NEW.user_id THEN
    -- Create notification
    INSERT INTO wolfpack_activity_notifications (
      recipient_id,
      message,
      type,
      link,
      status,
      metadata,
      notification_type
    ) VALUES (
      video_owner_id,
      COALESCE(commenter_name, 'Someone') || ' commented on your post',
      'info',
      '/wolfpack/feed',
      'unread',
      jsonb_build_object(
        'video_id', NEW.video_id,
        'comment_id', NEW.id,
        'commenter_id', NEW.user_id,
        'commenter_name', commenter_name,
        'comment_preview', LEFT(NEW.content, 50)
      ),
      'comment'
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for automatic notifications
DROP TRIGGER IF EXISTS create_like_notification_trigger ON "public"."wolfpack_post_likes";
CREATE TRIGGER create_like_notification_trigger
  AFTER INSERT ON "public"."wolfpack_post_likes"
  FOR EACH ROW
  EXECUTE FUNCTION create_like_notification();

DROP TRIGGER IF EXISTS create_comment_notification_trigger ON "public"."wolfpack_comments";  
CREATE TRIGGER create_comment_notification_trigger
  AFTER INSERT ON "public"."wolfpack_comments"
  FOR EACH ROW
  EXECUTE FUNCTION create_comment_notification();