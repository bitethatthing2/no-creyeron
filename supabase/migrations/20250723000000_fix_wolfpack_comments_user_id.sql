-- Fix wolfpack_commentsuser_id handling with trigger
-- This migration adds a trigger to automatically convert auth user ID to public user ID for wolfpack_comments

-- Create a trigger function to automatically convert auth user ID to public user ID for wolfpack_comments
CREATE OR REPLACE FUNCTION set_comment_user_id()
RETURNS TRIGGER AS $$
BEGIN
  -- If user_id is the auth ID, convert it to public user ID
  IF NEW.user_id IN (SELECT auth_id FROM public.users WHERE auth_id = NEW.user_id) THEN
    SELECT id INTO NEW.user_id
    FROM public.users
    WHERE auth_id = NEW.user_id;
  -- If user_id is null, set it from current auth user
  ELSIF NEW.user_id IS NULL THEN
    SELECT id INTO NEW.user_id
    FROM public.users
    WHERE auth_id = auth.uid();
  END IF;
  
  -- If still no user_id, check if we need to create a user profile
  IF NEW.user_id IS NULL AND auth.uid() IS NOT NULL THEN
    -- Get the auth user's email and create basic profile
    DECLARE
      user_email TEXT;
    BEGIN
      SELECT email INTO user_email
      FROM auth.users
      WHERE id = auth.uid();
      
      -- Create a basic user profile
      INSERT INTO public.users (auth_id, email, created_at)
      VALUES (auth.uid(), user_email, NOW())
      ON CONFLICT (auth_id) DO UPDATE SET updated_at = NOW()
      RETURNING id INTO NEW.user_id;
    EXCEPTION
      WHEN OTHERS THEN
        -- If user creation fails, try to find existing user again
        SELECT id INTO NEW.user_id
        FROM public.users
        WHERE auth_id = auth.uid();
    END;
  END IF;
  
  -- If still no user_id, raise exception
  IF NEW.user_id IS NULL THEN
    RAISE EXCEPTION 'No valid user found for comment insertion';
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create the trigger for wolfpack_comments
DROP TRIGGER IF EXISTS set_comment_user_id_trigger ON wolfpack_comments;
CREATE TRIGGER set_comment_user_id_trigger
  BEFORE INSERT ON wolfpack_comments
  FOR EACH ROW
  EXECUTE FUNCTION set_comment_user_id();

-- Update RLS policies for wolfpack_comments
DROP POLICY IF EXISTS "Anyone can view wolfpack_comments" ON wolfpack_comments;
DROP POLICY IF EXISTS "Users can create wolfpack_comments" ON wolfpack_comments;
DROP POLICY IF EXISTS "Users can update own wolfpack_comments" ON wolfpack_comments;
DROP POLICY IF EXISTS "Users can delete own wolfpack_comments" ON wolfpack_comments;

-- Create new policies
CREATE POLICY "Anyone can view wolfpack_comments"
  ON wolfpack_comments
  FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users can create wolfpack_comments"
  ON wolfpack_comments
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Users can update own wolfpack_comments"
  ON wolfpack_comments
  FOR UPDATE
  TO authenticated
  USING (user_id IN (SELECT id FROM users WHERE auth_id = auth.uid()))
  WITH CHECK (user_id IN (SELECT id FROM users WHERE auth_id = auth.uid()));

CREATE POLICY "Users can delete own wolfpack_comments"
  ON wolfpack_comments
  FOR DELETE
  TO authenticated
  USING (user_id IN (SELECT id FROM users WHERE auth_id = auth.uid()));

-- Grant necessary permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON wolfpack_commentsTO authenticated;
GRANT SELECT ON wolfpack_commentsTO anon;