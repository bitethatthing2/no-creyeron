-- Fix missing user profile for auth_id 5a76f108-464b-490b-a4c8-2e6b337f895e
-- This creates a user profile with the necessary fields

-- First check if user already exists
DO $$
BEGIN
    -- Check if user with this auth_id exists
    IF NOT EXISTS (
        SELECT 1 FROM users 
        WHERE auth_id = '5a76f108-464b-490b-a4c8-2e6b337f895e'
    ) THEN
        -- Create the user profile
        INSERT INTO users (
            auth_id,
            email,
            role,
            wolfpack_status,
            account_status,
            created_at,
            updated_at
        ) VALUES (
            '5a76f108-464b-490b-a4c8-2e6b337f895e',
            'user@example.com', -- Update this with actual email if known
            'admin', -- Set as admin based on your testing needs
            'active', -- Set as active for wolfpack
            'active',
            NOW(),
            NOW()
        );
        
        RAISE NOTICE 'User profile created successfully';
    ELSE
        RAISE NOTICE 'User profile already exists';
    END IF;
END $$;

-- Verify the user was created
SELECT 
    id,
    auth_id,
    email,
    role,
    wolfpack_status,
    account_status
FROM users 
WHERE auth_id = '5a76f108-464b-490b-a4c8-2e6b337f895e';