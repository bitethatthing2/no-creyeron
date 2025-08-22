-- Fix content_posts RLS policies for deletion
-- This adds proper DELETE policy and fixes UPDATE policy for admins

-- Drop existing UPDATE policy if it exists
-- Make sure you are running this on PostgreSQL with RLS enabled
DROP POLICY IF EXISTS "Users can update their own content_posts" ON content_posts;

-- Create new UPDATE policy that allows:
-- 1. Users to update their own videos
-- 2. Admins to update any video (for soft delete)
CREATE POLICY "Users can update their own content_posts" ON content_posts
FOR UPDATE TO authenticated
USING (
  auth.uid() = user_id 
  OR 
  EXISTS (
    SELECT 1 FROM users 
    WHERE users.auth_id = auth.uid() 
    AND users.role = 'admin'
  )
)
WITH CHECK (
  auth.uid() = user_id 
  OR 
  EXISTS (
    SELECT 1 FROM users 
    WHERE users.auth_id = auth.uid() 
    AND users.role = 'admin'
  )
);

-- Add DELETE policy for hard deletion (if needed in future)
-- Allows users to delete their own videos or admins to delete any
CREATE POLICY "Users can delete their own content_posts" ON content_posts
FOR DELETE TO authenticated
USING (
  auth.uid() = user_id 
  OR 
  EXISTS (
    SELECT 1 FROM users 
    WHERE users.auth_id = auth.uid() 
    AND users.role = 'admin'
  )
);

-- Verify the policies
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies 
WHERE tablename = 'content_posts'
ORDER BY policyname;