-- Create function to handle new user registration
-- This triggers when a user signs up via Supabase Auth and creates their profile in the users table

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  user_role TEXT := 'user';
  display_name_value TEXT;
  first_name_value TEXT;
  last_name_value TEXT;
BEGIN
  -- Extract display name from metadata
  display_name_value := COALESCE(
    NEW.raw_user_meta_data->>'display_name',
    NEW.raw_user_meta_data->>'full_name',
    NEW.raw_user_meta_data->>'name',
    split_part(NEW.email, '@', 1)
  );

  -- Split display name into first and last name
  first_name_value := COALESCE(
    NEW.raw_user_meta_data->>'first_name',
    split_part(display_name_value, ' ', 1)
  );
  
  last_name_value := COALESCE(
    NEW.raw_user_meta_data->>'last_name',
    CASE 
      WHEN array_length(string_to_array(display_name_value, ' '), 1) > 1 
      THEN array_to_string(string_to_array(display_name_value, ' ')[2:], ' ')
      ELSE ''
    END
  );

  -- Determine user role based on email
  IF NEW.email = 'gthabarber1@gmail.com' THEN
    user_role := 'admin';
  ELSIF NEW.raw_app_meta_data->>'role' IS NOT NULL THEN
    user_role := NEW.raw_app_meta_data->>'role';
  END IF;

  -- Insert user profile into users table
  INSERT INTO public.users (
    auth_id,
    email,
    first_name,
    last_name,
    display_name,
    role,
    is_active,
    created_at,
    updated_at
  ) VALUES (
    NEW.id,
    NEW.email,
    first_name_value,
    last_name_value,
    display_name_value,
    user_role,
    true,
    NOW(),
    NOW()
  );

  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  -- Log the error but don't fail the user creation
  RAISE WARNING 'Error creating user profile for %: %', NEW.email, SQLERRM;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger that fires when a new user is created in auth.users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Grant necessary permissions
GRANT EXECUTE ON FUNCTION public.handle_new_user() TO service_role;

-- Add comment for documentation
COMMENT ON FUNCTION public.handle_new_user() IS 'Creates a user profile in public.users when a new user signs up via Supabase Auth';