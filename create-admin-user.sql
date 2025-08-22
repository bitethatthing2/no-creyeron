-- Create admin user profile if missing
INSERT INTO users (
    auth_id,
    email,
    role,
    wolfpack_status,
    account_status,
    created_at,
    updated_at
) 
SELECT 
    '5a76f108-464b-490b-a4c8-2e6b337f895e',
    'admin@nocreyeon.com',
    'admin',
    'active',
    'active',
    NOW(),
    NOW()
WHERE NOT EXISTS (
    SELECT 1 FROM users 
    WHERE auth_id = '5a76f108-464b-490b-a4c8-2e6b337f895e'
);