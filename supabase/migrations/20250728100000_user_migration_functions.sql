-- User Migration Functions for Auth System
-- These functions help migrate existing users to the new auth system

-- Function to check if a user needs migration
CREATE OR REPLACE FUNCTION migrate_user_to_auth(p_email TEXT)
RETURNS JSON AS $$
DECLARE
  v_user_record RECORD;
  v_result JSON;
BEGIN
  -- Find user by email
  SELECT * INTO v_user_record 
  FROM public.users 
  WHERE email = p_email;
  
  -- Check if user exists
  IF NOT FOUND THEN
    RETURN JSON_BUILD_OBJECT(
      'success', false,
      'message', 'User not found with provided email'
    );
  END IF;
  
  -- Check if user already has auth_id
  IF v_user_record.auth_id IS NOT NULL THEN
    RETURN JSON_BUILD_OBJECT(
      'success', false,
      'message', 'User already migrated to auth system'
    );
  END IF;
  
  -- User needs migration
  RETURN JSON_BUILD_OBJECT(
    'success', true,
    'user_id', v_user_record.id,
    'message', 'User eligible for migration'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to link existing user to auth
CREATE OR REPLACE FUNCTION link_user_to_auth(
  p_user_id UUID,
  p_auth_id UUID
)
RETURNS JSON AS $$
DECLARE
  v_updated_count INTEGER;
BEGIN
  -- Update the user record to link auth_id
  UPDATE public.users 
  SET 
    auth_id = p_auth_id,
    updated_at = NOW()
  WHERE id = p_user_id;
  
  GET DIAGNOSTICS v_updated_count = ROW_COUNT;
  
  IF v_updated_count = 0 THEN
    RETURN JSON_BUILD_OBJECT(
      'success', false,
      'message', 'User not found or update failed'
    );
  END IF;
  
  RETURN JSON_BUILD_OBJECT(
    'success', true,
    'message', 'User successfully linked to auth system'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to create user profile from auth signup
CREATE OR REPLACE FUNCTION handle_new_user_signup()
RETURNS TRIGGER AS $$
BEGIN
  -- Insert new user profile when auth user is created
  INSERT INTO public.users (
    auth_id,
    email,
    display_name,
    first_name,
    last_name,
    created_at,
    updated_at
  ) VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'display_name', NEW.email),
    NEW.raw_user_meta_data->>'first_name',
    NEW.raw_user_meta_data->>'last_name',
    NOW(),
    NOW()
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for new user signups (only if not exists)
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user_signup();

-- Function to get user profile by auth ID
CREATE OR REPLACE FUNCTION get_user_profile_by_auth_id(p_auth_id UUID)
RETURNS JSON AS $$
DECLARE
  v_user_record RECORD;
BEGIN
  SELECT * INTO v_user_record 
  FROM public.users 
  WHERE auth_id = p_auth_id;
  
  IF NOT FOUND THEN
    RETURN JSON_BUILD_OBJECT(
      'success', false,
      'message', 'User profile not found'
    );
  END IF;
  
  RETURN JSON_BUILD_OBJECT(
    'success', true,
    'user', ROW_TO_JSON(v_user_record)
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check auth consistency
CREATE OR REPLACE FUNCTION check_auth_consistency()
RETURNS TABLE(
  user_id UUID,
  email TEXT,
  auth_id UUID,
  has_auth_record BOOLEAN,
  needs_migration BOOLEAN
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    u.id as user_id,
    u.email,
    u.auth_id,
    (au.id IS NOT NULL) as has_auth_record,
    (u.auth_id IS NULL) as needs_migration
  FROM public.users u
  LEFT JOIN auth.users au ON u.auth_id = au.id
  ORDER BY u.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION migrate_user_to_auth(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION link_user_to_auth(UUID, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_user_profile_by_auth_id(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION check_auth_consistency() TO authenticated;

-- wolfpack_comments for documentation
COMMENT ON FUNCTION migrate_user_to_auth(TEXT) IS 'Checks if a user needs migration to the auth system';
COMMENT ON FUNCTION link_user_to_auth(UUID, UUID) IS 'Links existing user profile to new auth account';
COMMENT ON FUNCTION handle_new_user_signup() IS 'Creates user profile when new auth user signs up';
COMMENT ON FUNCTION get_user_profile_by_auth_id(UUID) IS 'Gets user profile by auth ID';
COMMENT ON FUNCTION check_auth_consistency() IS 'Checks auth consistency across all users';