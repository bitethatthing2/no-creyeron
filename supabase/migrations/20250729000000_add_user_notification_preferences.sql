-- Create user notification preferences table
CREATE TABLE IF NOT EXISTS user_notification_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Wolfpack notification preferences
  likes BOOLEAN DEFAULT true,
  wolfpack_comments BOOLEAN DEFAULT true,
  follows BOOLEAN DEFAULT true,
  mentions BOOLEAN DEFAULT true,
  new_wolfpack_videos BOOLEAN DEFAULT true,
  
  -- General notification preferences
  push_notifications BOOLEAN DEFAULT true,
  email_notifications BOOLEAN DEFAULT false,
  in_app_notifications BOOLEAN DEFAULT true,
  
  -- Notification frequency settings
  digest_frequency TEXT DEFAULT 'never' CHECK (digest_frequency IN ('immediate', 'daily', 'weekly', 'never')),
  quiet_hours_start TIME DEFAULT '22:00:00',
  quiet_hours_end TIME DEFAULT '08:00:00',
  quiet_hours_enabled BOOLEAN DEFAULT false,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create unique index on user_id
CREATE UNIQUE INDEX IF NOT EXISTS user_notification_preferences_user_id_idx 
ON user_notification_preferences(user_id);

-- Create function to automatically create preferences for new users
CREATE OR REPLACE FUNCTION create_user_notification_preferences()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.user_notification_preferences (user_id)
  VALUES (NEW.id)
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to auto-create preferences on user creation
DROP TRIGGER IF EXISTS on_auth_user_created_notification_preferences ON auth.users;
CREATE TRIGGER on_auth_user_created_notification_preferences
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION create_user_notification_preferences();

-- Enable RLS
ALTER TABLE user_notification_preferences ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view their own notification preferences"
  ON user_notification_preferences
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own notification preferences"
  ON user_notification_preferences
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can insert their own notification preferences"
  ON user_notification_preferences
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Create function to get user notification preferences
CREATE OR REPLACE FUNCTION get_user_notification_preferences(user_uuid UUID)
RETURNS TABLE (
  likes BOOLEAN,
  wolfpack_comments BOOLEAN,
  follows BOOLEAN,
  mentions BOOLEAN,
  new_wolfpack_videos BOOLEAN,
  push_notifications BOOLEAN,
  email_notifications BOOLEAN,
  in_app_notifications BOOLEAN,
  digest_frequency TEXT,
  quiet_hours_start TIME,
  quiet_hours_end TIME,
  quiet_hours_enabled BOOLEAN
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.likes,
    p.wolfpack_comments,
    p.follows,
    p.mentions,
    p.new_wolfpack_videos,
    p.push_notifications,
    p.email_notifications,
    p.in_app_notifications,
    p.digest_frequency,
    p.quiet_hours_start,
    p.quiet_hours_end,
    p.quiet_hours_enabled
  FROM user_notification_preferences p
  WHERE p.user_id = user_uuid;
  
  -- If no preferences found, return defaults
  IF NOT FOUND THEN
    RETURN QUERY
    SELECT 
      true::BOOLEAN,  -- likes
      true::BOOLEAN,  -- wolfpack_comments
      true::BOOLEAN,  -- follows
      true::BOOLEAN,  -- mentions
      true::BOOLEAN,  -- new_wolfpack_videos
      true::BOOLEAN,  -- push_notifications
      false::BOOLEAN, -- email_notifications
      true::BOOLEAN,  -- in_app_notifications
      'never'::TEXT,  -- digest_frequency
      '22:00:00'::TIME, -- quiet_hours_start
      '08:00:00'::TIME, -- quiet_hours_end
      false::BOOLEAN  -- quiet_hours_enabled
    ;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to update notification preferences
CREATE OR REPLACE FUNCTION update_user_notification_preferences(
  user_uuid UUID,
  new_likes BOOLEAN DEFAULT NULL,
  new_wolfpack_comments BOOLEAN DEFAULT NULL,
  new_follows BOOLEAN DEFAULT NULL,
  new_mentions BOOLEAN DEFAULT NULL,
  new_new_wolfpack_videos BOOLEAN DEFAULT NULL,
  new_push_notifications BOOLEAN DEFAULT NULL,
  new_email_notifications BOOLEAN DEFAULT NULL,
  new_in_app_notifications BOOLEAN DEFAULT NULL,
  new_digest_frequency TEXT DEFAULT NULL,
  new_quiet_hours_start TIME DEFAULT NULL,
  new_quiet_hours_end TIME DEFAULT NULL,
  new_quiet_hours_enabled BOOLEAN DEFAULT NULL
)
RETURNS BOOLEAN AS $$
DECLARE
  preferences_exist BOOLEAN;
BEGIN
  -- Check if user can update preferences (RLS will handle this)
  IF auth.uid() != user_uuid THEN
    RAISE EXCEPTION 'Unauthorized: Cannot update another user''s preferences';
  END IF;
  
  -- Check if preferences exist
  SELECT EXISTS(
    SELECT 1 FROM user_notification_preferences 
    WHERE user_id = user_uuid
  ) INTO preferences_exist;
  
  IF NOT preferences_exist THEN
    -- Create new preferences record
    INSERT INTO user_notification_preferences (
      user_id,
      likes,
      wolfpack_comments,
      follows,
      mentions,
      new_wolfpack_videos,
      push_notifications,
      email_notifications,
      in_app_notifications,
      digest_frequency,
      quiet_hours_start,
      quiet_hours_end,
      quiet_hours_enabled
    ) VALUES (
      user_uuid,
      COALESCE(new_likes, true),
      COALESCE(new_wolfpack_comments, true),
      COALESCE(new_follows, true),
      COALESCE(new_mentions, true),
      COALESCE(new_new_wolfpack_videos, true),
      COALESCE(new_push_notifications, true),
      COALESCE(new_email_notifications, false),
      COALESCE(new_in_app_notifications, true),
      COALESCE(new_digest_frequency, 'never'),
      COALESCE(new_quiet_hours_start, '22:00:00'::TIME),
      COALESCE(new_quiet_hours_end, '08:00:00'::TIME),
      COALESCE(new_quiet_hours_enabled, false)
    );
  ELSE
    -- Update existing preferences (only update non-null values)
    UPDATE user_notification_preferences SET
      likes = COALESCE(new_likes, likes),
      wolfpack_comments = COALESCE(new_wolfpack_comments, wolfpack_comments),
      follows = COALESCE(new_follows, follows),
      mentions = COALESCE(new_mentions, mentions),
      new_wolfpack_videos = COALESCE(new_new_wolfpack_videos, new_wolfpack_videos),
      push_notifications = COALESCE(new_push_notifications, push_notifications),
      email_notifications = COALESCE(new_email_notifications, email_notifications),
      in_app_notifications = COALESCE(new_in_app_notifications, in_app_notifications),
      digest_frequency = COALESCE(new_digest_frequency, digest_frequency),
      quiet_hours_start = COALESCE(new_quiet_hours_start, quiet_hours_start),
      quiet_hours_end = COALESCE(new_quiet_hours_end, quiet_hours_end),
      quiet_hours_enabled = COALESCE(new_quiet_hours_enabled, quiet_hours_enabled),
      updated_at = NOW()
    WHERE user_id = user_uuid;
  END IF;
  
  RETURN true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant necessary permissions
GRANT SELECT, INSERT, UPDATE ON user_notification_preferences TO authenticated;
GRANT EXECUTE ON FUNCTION get_user_notification_preferences(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION update_user_notification_preferences(UUID, BOOLEAN, BOOLEAN, BOOLEAN, BOOLEAN, BOOLEAN, BOOLEAN, BOOLEAN, BOOLEAN, TEXT, TIME, TIME, BOOLEAN) TO authenticated;