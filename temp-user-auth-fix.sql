-- Temporary fix: Create auth accounts for existing users and link them
-- This is a one-time migration to fix the auth_id mapping issue

-- First, let's see the current state
SELECT 
    id,
    email,
    auth_id,
    first_name,
    last_name,
    CASE WHEN auth_id IS NULL THEN 'NEEDS_AUTH' ELSE 'HAS_AUTH' END as status
FROM users
WHERE auth_id IS NULL
LIMIT 20;

-- For production use, you'll need to:
-- 1. Have each user sign up through the app's normal signup flow
-- 2. Their email will match their existing record
-- 3. The trigger will automatically link them

-- OR manually create auth accounts (requires service role access):
-- This would be done programmatically, not in SQL:
/*
For each user without auth_id:
1. CREATE auth user with supabase.auth.admin.createUser()
2. UPDATE users SET auth_id = new_auth_id WHERE id = user_id
*/

-- Alternative: For testing, you can manually create test accounts
-- by having users sign up with their existing emails