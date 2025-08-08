-- Fix wolfpack_post_likes RLS policies by removing duplicates and creating clean ones

-- Remove all existing policies to avoid conflicts
DROP POLICY IF EXISTS "Anyone can view likes" ON wolfpack_post_likes;
DROP POLICY IF EXISTS "Users can like posts" ON wolfpack_post_likes;
DROP POLICY IF EXISTS "Users can remove own likes" ON wolfpack_post_likes;
DROP POLICY IF EXISTS "wolfpack_post_likes_select_consolidated" ON wolfpack_post_likes;
DROP POLICY IF EXISTS "wolfpack_post_likes_insert_consolidated" ON wolfpack_post_likes;
DROP POLICY IF EXISTS "wolfpack_post_likes_delete_consolidated" ON wolfpack_post_likes;
DROP POLICY IF EXISTS "anyone_can_view_likes" ON wolfpack_post_likes;
DROP POLICY IF EXISTS "consolidated_view_likes" ON wolfpack_post_likes;
DROP POLICY IF EXISTS "wolfpack_members_view_likes" ON wolfpack_post_likes;
DROP POLICY IF EXISTS "wolfpack_post_likes_select_policy" ON wolfpack_post_likes;
DROP POLICY IF EXISTS "Users can delete own likes" ON wolfpack_post_likes;
DROP POLICY IF EXISTS "users_can_unlike" ON wolfpack_post_likes;
DROP POLICY IF EXISTS "Users can insert own likes" ON wolfpack_post_likes;
DROP POLICY IF EXISTS "authenticated_users_can_like" ON wolfpack_post_likes;
DROP POLICY IF EXISTS "Users can update own likes" ON wolfpack_post_likes;

-- Create clean, simple policies
CREATE POLICY "wolfpack_post_likes_select" ON wolfpack_post_likes
  FOR SELECT USING (true);

CREATE POLICY "wolfpack_post_likes_insert" ON wolfpack_post_likes
  FOR INSERT WITH CHECK (
    user_id IN (
      SELECT id FROM public.users WHERE auth_id = auth.uid()
    )
  );

CREATE POLICY "wolfpack_post_likes_delete" ON wolfpack_post_likes
  FOR DELETE USING (
    user_id IN (
      SELECT id FROM public.users WHERE auth_id = auth.uid()
    )
  );

-- Ensure the table has RLS enabled
ALTER TABLE wolfpack_post_likes ENABLE ROW LEVEL SECURITY;

-- Grant necessary permissions
GRANT SELECT, INSERT, DELETE ON TABLE wolfpack_post_likes TO anon;
GRANT SELECT, INSERT, DELETE ON TABLE wolfpack_post_likes TO authenticated;
GRANT ALL ON TABLE wolfpack_post_likes TO service_role;