-- Script to fix duplicate RLS policies causing performance warnings
-- Run this directly in Supabase SQL Editor

-- ===================================
-- 1. Fix wolfpack_post_likes policies
-- ===================================

-- Check current policies
SELECT schemaname, tablename, policyname, permissive, roles, cmd
FROM pg_policies
WHERE schemaname = 'public' AND tablename = 'wolfpack_post_likes'
ORDER BY cmd, policyname;

-- Drop duplicate SELECT policies
DROP POLICY IF EXISTS "anyone_can_view_likes" ON wolfpack_post_likes;
DROP POLICY IF EXISTS "consolidated_view_likes" ON wolfpack_post_likes;
DROP POLICY IF EXISTS "wolfpack_members_view_likes" ON wolfpack_post_likes;
DROP POLICY IF EXISTS "wolfpack_post_likes_select_policy" ON wolfpack_post_likes;

-- Drop duplicate INSERT policies  
DROP POLICY IF EXISTS "Users can insert own likes" ON wolfpack_post_likes;
DROP POLICY IF EXISTS "authenticated_users_can_like" ON wolfpack_post_likes;

-- Drop duplicate DELETE policies
DROP POLICY IF EXISTS "Users can delete own likes" ON wolfpack_post_likes;
DROP POLICY IF EXISTS "users_can_unlike" ON wolfpack_post_likes;

-- Create single consolidated policies
CREATE POLICY "wolfpack_post_likes_select_consolidated" ON wolfpack_post_likes
FOR SELECT 
USING (true); -- Allow all users to view likes for public feed

CREATE POLICY "wolfpack_post_likes_insert_consolidated" ON wolfpack_post_likes
FOR INSERT TO authenticated
WITH CHECK (user_id IN (
    SELECT id FROM public.users WHERE auth_id = auth.uid()
));

CREATE POLICY "wolfpack_post_likes_delete_consolidated" ON wolfpack_post_likes
FOR DELETE TO authenticated
USING (user_id IN (
    SELECT id FROM public.users WHERE auth_id = auth.uid()
));

-- ===================================
-- 2. Fix food_drink_categories policies
-- ===================================

-- Check current policies
SELECT schemaname, tablename, policyname, permissive, roles, cmd
FROM pg_policies
WHERE schemaname = 'public' AND tablename = 'food_drink_categories'
ORDER BY cmd, policyname;

-- Drop duplicate policies
DROP POLICY IF EXISTS "public_can_view_active_categories" ON food_drink_categories;
DROP POLICY IF EXISTS "staff_can_view_all_categories" ON food_drink_categories;

-- Create single consolidated policy
CREATE POLICY "food_drink_categories_select_consolidated" ON food_drink_categories
FOR SELECT TO authenticated
USING (
    is_active = true OR 
    EXISTS (
        SELECT 1 FROM public.users 
        WHERE auth_id = auth.uid() 
        AND role IN ('admin', 'bartender', 'staff')
    )
);

-- ===================================
-- 3. Fix food_drink_items policies
-- ===================================

-- Check current policies
SELECT schemaname, tablename, policyname, permissive, roles, cmd
FROM pg_policies
WHERE schemaname = 'public' AND tablename = 'food_drink_items'
ORDER BY cmd, policyname;

-- Drop duplicate policies
DROP POLICY IF EXISTS "public_can_view_available_items" ON food_drink_items;
DROP POLICY IF EXISTS "staff_can_view_all_items" ON food_drink_items;

-- Create single consolidated policy
CREATE POLICY "food_drink_items_select_consolidated" ON food_drink_items
FOR SELECT TO authenticated
USING (
    is_available = true OR 
    EXISTS (
        SELECT 1 FROM public.users 
        WHERE auth_id = auth.uid() 
        AND role IN ('admin', 'bartender', 'staff')
    )
);

-- ===================================
-- 4. Fix wolfpack_videos policies
-- ===================================

-- Check current policies
SELECT schemaname, tablename, policyname, permissive, roles, cmd
FROM pg_policies
WHERE schemaname = 'public' AND tablename = 'wolfpack_videos'
ORDER BY cmd, policyname;

-- Drop duplicate policies
DROP POLICY IF EXISTS "anyone_can_view_active_wolfpack_videos" ON wolfpack_videos;
DROP POLICY IF EXISTS "wolfpack_members_view_wolfpack_videos" ON wolfpack_videos;

-- Create single consolidated policy (keep existing good policy if it exists)
DO $$
BEGIN
    -- Only create if no good policy exists
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE schemaname = 'public' 
        AND tablename = 'wolfpack_videos' 
        AND policyname = 'wolfpack_videos_select_policy'
    ) THEN
        CREATE POLICY "wolfpack_videos_select_consolidated" ON wolfpack_videos
        FOR SELECT TO authenticated
        USING (
            is_active = true AND 
            (
                is_published = true OR
                user_id IN (
                    SELECT id FROM public.users WHERE auth_id = auth.uid()
                ) OR
                EXISTS (
                    SELECT 1 FROM public.users 
                    WHERE auth_id = auth.uid() 
                    AND role IN ('admin', 'wolf_den_admin')
                )
            )
        );
    END IF;
END $$;

-- ===================================
-- Verify the fixes
-- ===================================

-- Check all policies are now consolidated
SELECT 
    schemaname,
    tablename,
    COUNT(*) as policy_count,
    string_agg(policyname, ', ') as policies
FROM pg_policies
WHERE schemaname = 'public' 
AND tablename IN ('wolfpack_post_likes', 'food_drink_categories', 'food_drink_items', 'wolfpack_videos')
AND cmd = 'SELECT'
GROUP BY schemaname, tablename
ORDER BY tablename;

-- Add performance indexes if they don't exist
CREATE INDEX IF NOT EXISTS idx_users_auth_id_role ON public.users(auth_id, role);
CREATE INDEX IF NOT EXISTS idx_food_drink_categories_active ON food_drink_categories(is_active);
CREATE INDEX IF NOT EXISTS idx_food_drink_items_available ON food_drink_items(is_available);
CREATE INDEX IF NOT EXISTS idx_wolfpack_videos_active_published ON wolfpack_videos(is_active, is_published);
CREATE INDEX IF NOT EXISTS idx_wolfpack_post_likes_user_id ON wolfpack_post_likes(user_id);