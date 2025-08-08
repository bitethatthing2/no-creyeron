-- Add missing wolfpack columns to users table
ALTER TABLE public.users 
ADD COLUMN IF NOT EXISTS wolfpack_status TEXT DEFAULT 'inactive',
ADD COLUMN IF NOT EXISTS is_wolfpack_member BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS wolfpack_tier BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS location_permissions_granted BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS location_id UUID;

-- Update the test user to be a wolfpack member
UPDATE public.users 
SET 
    wolfpack_status = 'active',
    is_wolfpack_member = true,
    wolfpack_tier = true,
    location_permissions_granted = true
WHERE auth_id = '12345678-1234-5678-9012-123456789012';

-- Add check constraint for wolfpack_status
ALTER TABLE public.users 
ADD CONSTRAINT users_wolfpack_status_check 
CHECK (wolfpack_status IN ('active', 'inactive', 'pending', 'banned'));