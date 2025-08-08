-- Consolidate Duplicate RLS Policies
-- This migration fixes multiple permissive policies that cause performance warnings
-- by consolidating them into single, optimized policies per table/role/action

-- ===================================
-- 1. Fix wolfpack_post_likes policies
-- ===================================

-- Drop all existing duplicate policies
DROP POLICY IF EXISTS "anyone_can_view_likes" ON wolfpack_post_likes;
DROP POLICY IF EXISTS "consolidated_view_likes" ON wolfpack_post_likes;
DROP POLICY IF EXISTS "wolfpack_members_view_likes" ON wolfpack_post_likes;
DROP POLICY IF EXISTS "wolfpack_post_likes_select_policy" ON wolfpack_post_likes;
DROP POLICY IF EXISTS "Users can delete own likes" ON wolfpack_post_likes;
DROP POLICY IF EXISTS "users_can_unlike" ON wolfpack_post_likes;
DROP POLICY IF EXISTS "Users can insert own likes" ON wolfpack_post_likes;
DROP POLICY IF EXISTS "authenticated_users_can_like" ON wolfpack_post_likes;
DROP POLICY IF EXISTS "Users can update own likes" ON wolfpack_post_likes;

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

-- Drop duplicate policies
DROP POLICY IF EXISTS "anyone_can_view_active_wolfpack_videos" ON wolfpack_videos;
DROP POLICY IF EXISTS "wolfpack_members_view_wolfpack_videos" ON wolfpack_videos;

-- Create single consolidated policy
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

-- ===================================
-- Performance optimizations
-- ===================================

-- Add indexes to support the consolidated policies efficiently
CREATE INDEX IF NOT EXISTS idx_users_auth_id_role ON public.users(auth_id, role);
CREATE INDEX IF NOT EXISTS idx_food_drink_categories_active ON food_drink_categories(is_active);
CREATE INDEX IF NOT EXISTS idx_food_drink_items_available ON food_drink_items(is_available);
CREATE INDEX IF NOT EXISTS idx_wolfpack_videos_active_published ON wolfpack_videos(is_active, is_published);
CREATE INDEX IF NOT EXISTS idx_wolfpack_post_likes_user_id ON wolfpack_post_likes(user_id);

-- Add wolfpack_comments for documentation
COMMENT ON POLICY "wolfpack_post_likes_select_consolidated" ON wolfpack_post_likes IS 'Consolidated policy for viewing likes - allows all users to see public like counts';
COMMENT ON POLICY "food_drink_categories_select_consolidated" ON food_drink_categories IS 'Consolidated policy - public sees active categories, staff sees all';
COMMENT ON POLICY "food_drink_items_select_consolidated" ON food_drink_items IS 'Consolidated policy - public sees available items, staff sees all';
COMMENT ON POLICY "wolfpack_videos_select_consolidated" ON wolfpack_videos IS 'Consolidated policy - active published wolfpack_videos visible to all, owners and admins see their own';