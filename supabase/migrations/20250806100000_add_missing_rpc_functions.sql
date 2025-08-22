-- Add missing RPC functions for video likes

-- Function to decrement video likes (used by frontend)
CREATE OR REPLACE FUNCTION decrement_video_likes(video_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE content_posts 
  SET like_count = GREATEST(0, like_count - 1)
  WHERE id = video_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to increment video likes (used by frontend)  
CREATE OR REPLACE FUNCTION increment_video_likes(video_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE content_posts 
  SET like_count = like_count + 1
  WHERE id = video_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant permissions
GRANT EXECUTE ON FUNCTION decrement_video_likes(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION decrement_video_likes(UUID) TO anon;
GRANT EXECUTE ON FUNCTION increment_video_likes(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION increment_video_likes(UUID) TO anon;