-- ULTRA-SIMPLIFY ROLE SYSTEM: Admin and User Only
-- This script removes all complexity: no VIP, no DJ, no Bartender
-- Just admin (full access) and user (wolfpack member)

-- Step 1: Update users table role constraint to only allow admin/user
ALTER TABLE users DROP CONSTRAINT IF EXISTS users_role_check;
ALTER TABLE users ADD CONSTRAINT users_role_check CHECK (role IN ('admin', 'user'));

-- Step 2: Update all existing non-admin users to 'user' role
UPDATE users 
SET role = 'user' 
WHERE role NOT IN ('admin') 
  OR role IS NULL;

-- Step 3: Remove VIP system complexity - keep is_vip for backwards compatibility but simplify
UPDATE users 
SET 
  wolfpack_tier = 'basic',
  updated_at = NOW()
WHERE wolfpack_tier NOT IN ('basic', 'premium');

-- Step 4: Simplify all feature flags to only use admin/user roles
UPDATE feature_flags
SET 
  enabled_for_roles = ARRAY(
    SELECT UNNEST(enabled_for_roles)
    INTERSECT 
    SELECT * FROM (VALUES ('admin'), ('user')) AS valid_roles(role)
  ),
  updated_at = NOW()
WHERE enabled_for_roles IS NOT NULL;

-- Step 5: Update RLS policies for ultra-simple role system
-- Video upload policy: admin or active wolfpack user
DROP POLICY IF EXISTS "can_upload_videos_policy" ON content_posts;
CREATE POLICY "can_upload_videos_policy" ON content_posts
FOR INSERT TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM users 
    WHERE users.auth_id = auth.uid() 
    AND (
      users.role = 'admin' 
      OR users.wolfpack_status = 'active'
    )
  )
);

-- Step 6: Update video deletion/update policies
DROP POLICY IF EXISTS "Users can update their own content_posts" ON content_posts;
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

DROP POLICY IF EXISTS "Users can delete their own content_posts" ON content_posts;
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

-- Step 7: Update helper functions for simplified system
CREATE OR REPLACE FUNCTION is_admin_user()
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM users 
    WHERE auth_id = auth.uid() 
    AND role = 'admin'
  );
END;
$$;

CREATE OR REPLACE FUNCTION can_upload_videos()
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM users 
    WHERE auth_id = auth.uid() 
    AND (
      role = 'admin' 
      OR wolfpack_status = 'active'
    )
  );
END;
$$;

-- Step 8: Show final simplified state
SELECT 'ROLE DISTRIBUTION' as info;
SELECT 
  role,
  COUNT(*) as user_count,
  COUNT(*) FILTER (WHERE wolfpack_status = 'active') as active_wolfpack
FROM users 
WHERE role IS NOT NULL
GROUP BY role
ORDER BY role;

SELECT 'FEATURE FLAGS' as info;
SELECT 
  flag_name,
  globally_enabled,
  enabled_for_roles
FROM feature_flags
ORDER BY flag_name;

SELECT 'SIMPLIFIED SYSTEM READY' as status;
SELECT 'Only admin and user roles remain' as message;
SELECT 'Wolfpack membership controlled by wolfpack_status field' as note;