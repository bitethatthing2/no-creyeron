-- Check current feature flag enabled roles
SELECT 
  flag_name,
  globally_enabled,
  enabled_for_roles,
  updated_at
FROM feature_flags
WHERE enabled_for_roles IS NOT NULL
ORDER BY flag_name;

-- Check if any feature flags have invalid roles (vip, dj)
SELECT 
  flag_name,
  enabled_for_roles,
  CASE 
    WHEN enabled_for_roles::text LIKE '%vip%' THEN 'Has VIP role'
    WHEN enabled_for_roles::text LIKE '%dj%' THEN 'Has DJ role'
    ELSE 'OK'
  END as issue
FROM feature_flags
WHERE enabled_for_roles IS NOT NULL
  AND (enabled_for_roles::text LIKE '%vip%' OR enabled_for_roles::text LIKE '%dj%');

-- Update feature flags to remove invalid roles (vip, dj)
-- First, show what will be changed
SELECT 
  flag_name,
  enabled_for_roles AS old_roles,
  ARRAY(
    SELECT UNNEST(enabled_for_roles)
    EXCEPT 
    SELECT * FROM (VALUES ('vip'), ('dj')) AS invalid_roles(role)
  ) AS new_roles
FROM feature_flags
WHERE enabled_for_roles && ARRAY['vip', 'dj'];

-- Update the flags to remove vip and dj roles
UPDATE feature_flags
SET 
  enabled_for_roles = ARRAY(
    SELECT UNNEST(enabled_for_roles)
    EXCEPT 
    SELECT * FROM (VALUES ('vip'), ('dj')) AS invalid_roles(role)
  ),
  updated_at = NOW()
WHERE enabled_for_roles && ARRAY['vip', 'dj']
RETURNING flag_name, enabled_for_roles;

-- Show final state
SELECT 
  flag_name,
  globally_enabled,
  enabled_for_roles,
  description
FROM feature_flags
ORDER BY flag_name;