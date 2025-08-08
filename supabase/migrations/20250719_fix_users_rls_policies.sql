-- Fix RLS policies for users table to allow proper authentication

-- Drop existing restrictive policies
DROP POLICY IF EXISTS "Users can view their own profile" ON public.users;
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.users;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.users;

-- Create new policies that allow users to see all profiles (for social features)
-- but only edit their own

-- Allow everyone to view all user profiles (needed for social features, following, etc)
CREATE POLICY "Everyone can view user profiles" 
ON public.users
FOR SELECT
TO public
USING (true);

-- Allow users to insert their own profile during signup
CREATE POLICY "Users can create their own profile" 
ON public.users
FOR INSERT
TO public
WITH CHECK (auth_id = auth.uid());

-- Allow users to update only their own profile
CREATE POLICY "Users can update their own profile" 
ON public.users
FOR UPDATE
TO public
USING (auth_id = auth.uid())
WITH CHECK (auth_id = auth.uid());

-- Prevent users from deleting profiles (admin only)
CREATE POLICY "Only admins can delete profiles" 
ON public.users
FOR DELETE
TO public
USING (
  EXISTS (
    SELECT 1 FROM public.users 
    WHERE auth_id = auth.uid() 
    AND role = 'admin'
  )
);

-- Add a helper function to get user by auth_id
CREATE OR REPLACE FUNCTION public.get_user_by_auth_id(auth_uuid UUID)
RETURNS TABLE (
  id UUID,
  auth_id UUID,
  email TEXT,
  first_name TEXT,
  last_name TEXT,
  display_name TEXT,
  avatar_url TEXT,
  role TEXT,
  is_active BOOLEAN,
  created_at TIMESTAMP WITH TIME ZONE,
  updated_at TIMESTAMP WITH TIME ZONE
)
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    u.id,
    u.auth_id,
    u.email,
    u.first_name,
    u.last_name,
    u.display_name,
    u.avatar_url,
    u.role,
    u.is_active,
    u.created_at,
    u.updated_at
  FROM public.users u
  WHERE u.auth_id = auth_uuid
  LIMIT 1;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.get_user_by_auth_id(UUID) TO authenticated;

-- Add index for better performance
CREATE INDEX IF NOT EXISTS idx_users_role ON public.users(role);
CREATE INDEX IF NOT EXISTS idx_users_is_active ON public.users(is_active);

-- Ensure the auth.users foreign key constraint exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'users_auth_id_fkey'
    AND table_name = 'users'
  ) THEN
    ALTER TABLE public.users 
    ADD CONSTRAINT users_auth_id_fkey 
    FOREIGN KEY (auth_id) 
    REFERENCES auth.users(id) 
    ON DELETE CASCADE;
  END IF;
END $$;