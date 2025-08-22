-- Fix RLS Policies to Use Database User IDs Consistently
-- This migration fixes the inconsistency where some policies expect user_id to be auth.uid()
-- while the frontend uses database user IDs from the users table

-- First, create a helper function to get database user ID from auth ID
CREATE OR REPLACE FUNCTION get_user_id_from_auth()
RETURNS uuid AS $$
BEGIN
  RETURN (
    SELECT id 
    FROM public.users 
    WHERE auth_id = auth.uid()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION get_user_id_from_auth() TO authenticated;

-- ===================================
-- Fix content_posts policies
-- ===================================

-- Drop inconsistent policies first
DROP POLICY IF EXISTS "Users can insert their own content_posts" ON content_posts;
DROP POLICY IF EXISTS "Users can update their own content_posts" ON content_posts;
DROP POLICY IF EXISTS "Users can view all content_posts" ON content_posts;

-- Create consistent policies that work with database user IDs
CREATE POLICY "content_posts_insert_policy" ON content_posts
FOR INSERT TO authenticated
WITH CHECK (user_id = get_user_id_from_auth());

CREATE POLICY "content_posts_update_policy" ON content_posts  
FOR UPDATE TO authenticated
USING (user_id = get_user_id_from_auth())
WITH CHECK (user_id = get_user_id_from_auth());

CREATE POLICY "content_posts_select_policy" ON content_posts
FOR SELECT TO authenticated
USING (true); -- Allow viewing all content_posts

-- ===================================
-- Fix content_commentspolicies  
-- ===================================

-- Drop inconsistent policies
DROP POLICY IF EXISTS "Users can create content_comments" ON content_comments;
DROP POLICY IF EXISTS "Users can update their own content_comments" ON content_comments;
DROP POLICY IF EXISTS "Users can soft delete their own content_comments" ON content_comments;
DROP POLICY IF EXISTS "Users can update own content_comments" ON content_comments;
DROP POLICY IF EXISTS "Users can delete own content_comments" ON content_comments;

-- Create consistent policies that work with database user IDs
CREATE POLICY "content_comments_insert_policy" ON content_comments
FOR INSERT TO authenticated
WITH CHECK (user_id = get_user_id_from_auth() AND NOT is_deleted);

CREATE POLICY "content_comments_update_policy" ON content_comments
FOR UPDATE TO authenticated  
USING (user_id = get_user_id_from_auth())
WITH CHECK (user_id = get_user_id_from_auth());

CREATE POLICY "content_comments_delete_policy" ON content_comments
FOR DELETE TO authenticated
USING (user_id = get_user_id_from_auth());

-- Keep the existing select policy (it's correct)
-- "Users can view all non-deleted content_comments" using (NOT is_deleted)

-- ===================================
-- Fix wolfpack_post_likes policies
-- ===================================

-- Drop and recreate likes policies
DROP POLICY IF EXISTS "Users can create their own likes" ON wolfpack_post_likes;
DROP POLICY IF EXISTS "Users can delete their own likes" ON wolfpack_post_likes;

CREATE POLICY "wolfpack_post_likes_insert_policy" ON wolfpack_post_likes
FOR INSERT TO authenticated
WITH CHECK (user_id = get_user_id_from_auth());

CREATE POLICY "wolfpack_post_likes_delete_policy" ON wolfpack_post_likes
FOR DELETE TO authenticated  
USING (user_id = get_user_id_from_auth());

-- ===================================
-- Fix social_follows policies
-- ===================================

-- Drop and recreate follows policies
DROP POLICY IF EXISTS "Users can create their own follows" ON social_follows;
DROP POLICY IF EXISTS "Users can delete their own follows" ON social_follows;

CREATE POLICY "social_follows_insert_policy" ON social_follows
FOR INSERT TO authenticated
WITH CHECK (follower_id = get_user_id_from_auth());

CREATE POLICY "social_follows_delete_policy" ON social_follows
FOR DELETE TO authenticated
USING (follower_id = get_user_id_from_auth());

-- ===================================
-- Fix wolfpack_comment_reactions policies
-- ===================================

-- Drop and recreate comment reactions policies  
DROP POLICY IF EXISTS "Users can create their own reactions" ON wolfpack_comment_reactions;
DROP POLICY IF EXISTS "Users can delete their own reactions" ON wolfpack_comment_reactions;

CREATE POLICY "wolfpack_comment_reactions_insert_policy" ON wolfpack_comment_reactions
FOR INSERT TO authenticated
WITH CHECK (user_id = get_user_id_from_auth());

CREATE POLICY "wolfpack_comment_reactions_delete_policy" ON wolfpack_comment_reactions
FOR DELETE TO authenticated
USING (user_id = get_user_id_from_auth());

-- ===================================
-- Ensure all social tables have RLS enabled
-- ===================================

ALTER TABLE content_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE content_commentsENABLE ROW LEVEL SECURITY;
ALTER TABLE wolfpack_post_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE social_follows ENABLE ROW LEVEL SECURITY;
ALTER TABLE wolfpack_comment_reactions ENABLE ROW LEVEL SECURITY;

-- Add comment for documentation
COMMENT ON FUNCTION get_user_id_from_auth() IS 'Helper function to get database user ID from auth.uid() for RLS policies. Ensures consistency between frontend database user IDs and RLS policy enforcement.';