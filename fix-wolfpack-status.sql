-- Fix Wolfpack Status for Users
-- Run this SQL in your Supabase SQL editor

-- Option 1: Set your specific user to active wolfpack status
UPDATE users 
SET wolfpack_status = 'active' 
WHERE auth_id = '5a76f108-464b-490b-a4c8-2e6b337f895e';

-- Option 2: Set ALL users with admin role to active wolfpack status
UPDATE users 
SET wolfpack_status = 'active' 
WHERE role = 'admin';

-- Option 3: Set ALL authenticated users to active wolfpack status (if you want everyone to post)
UPDATE users 
SET wolfpack_status = 'active' 
WHERE status = 'active' AND deleted_at IS NULL;

-- Check the results
SELECT 
  id,
  email,
  role,
  wolfpack_status,
  status,
  created_at
FROM users 
WHERE auth_id = '5a76f108-464b-490b-a4c8-2e6b337f895e';