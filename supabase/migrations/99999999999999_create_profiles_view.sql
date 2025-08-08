-- Create profiles view for backward compatibility
-- This allows existing queries using 'profiles' table to work with the 'users' table

CREATE OR REPLACE VIEW profiles AS
SELECT 
  id,
  auth_id,
  email,
  first_name,
  last_name,
  display_name,
  username,
  avatar_url,
  profile_image_url,
  profile_pic_url,
  bio,
  wolfpack_bio,
  wolf_emoji,
  vibe_status,
  favorite_drink,
  favorite_song,
  occupation,
  instagram_handle,
  location,
  city,
  state,
  verified,
  is_vip,
  wolfpack_status,
  wolfpack_tier,
  created_at,
  updated_at,
  last_seen_at,
  is_online,
  -- Computed display name with fallback hierarchy
  COALESCE(
    display_name, 
    username,
    TRIM(CONCAT(COALESCE(first_name, ''), ' ', COALESCE(last_name, ''))),
    split_part(email, '@', 1)
  ) as computed_display_name,
  -- Profile image with fallback hierarchy
  COALESCE(
    profile_image_url,
    profile_pic_url,
    avatar_url,
    '/icons/wolf-icon.png'
  ) as computed_avatar_url
FROM users;

-- Grant appropriate permissions
GRANT SELECT ON profiles TO authenticated;
GRANT SELECT ON profiles TO anon;

-- Add comment for documentation
COMMENT ON VIEW profiles IS 'Backward compatibility view mapping to users table with computed fields for display name and avatar';
COMMENT ON COLUMN profiles.computed_display_name IS 'Computed display name with fallback: display_name -> username -> full_name -> email_prefix';
COMMENT ON COLUMN profiles.computed_avatar_url IS 'Computed avatar URL with fallback: profile_image_url -> profile_pic_url -> avatar_url -> default';