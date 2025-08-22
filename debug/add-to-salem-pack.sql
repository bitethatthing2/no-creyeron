-- Add mkahler599@gmail.com to Salem wolfpack
-- Find Salem location ID and update user

-- First, let's see what locations exist
SELECT id, name, city FROM locations WHERE city ILIKE '%salem%' OR name ILIKE '%salem%';

-- Update user to be in Salem wolfpack
UPDATE users 
SET 
  location_id = (SELECT id FROM locations WHERE city ILIKE '%salem%' OR name ILIKE '%salem%' LIMIT 1),
  is_wolfpack_member = true,
  wolfpack_status = 'active',
  wolfpack_joined_at = NOW()
WHERE auth_id = '5a76f108-464b-490b-a4c8-2e6b337f895e';

-- Verify the update
SELECT 
  email, 
  location_id, 
  is_wolfpack_member, 
  wolfpack_status,
  wolfpack_joined_at
FROM users 
WHERE auth_id = '5a76f108-464b-490b-a4c8-2e6b337f895e';