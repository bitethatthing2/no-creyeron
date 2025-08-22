-- Emergency fix for remote database fetch_notifications function
-- This fixes the "columnn.status does not exist" error

-- Drop the broken function first
DROP FUNCTION IF EXISTS public.fetch_notifications(uuid, integer, integer) CASCADE;
DROP FUNCTION IF EXISTS public.fetch_notifications(integer, integer) CASCADE;

-- Create the correct function that uses the actual wolfpack_activity_notifications schema
CREATE OR REPLACE FUNCTION public.fetch_notifications(
    p_limit INTEGER DEFAULT 50,
    p_offset INTEGER DEFAULT 0
)
RETURNS TABLE (
    id UUID,
    recipient_id UUID,
    type TEXT,
    title TEXT,
    message TEXT,
    link TEXT,
    read BOOLEAN,
    data JSONB,
    created_at TIMESTAMP WITH TIME ZONE,
    updated_at TIMESTAMP WITH TIME ZONE
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        n.id,
        n.recipient_id,
        n.type,
        n.message as title,
        n.message,
        n.link,
        (n.status = 'read') as read,  -- This is the key fix - use status column, not read column
        n.metadata as data,
        n.created_at,
        n.updated_at
    FROM public.wolfpack_activity_notifications n
    WHERE n.recipient_id = (
        SELECT u.id FROM public.users u WHERE u.auth_id = auth.uid()
    )
    ORDER BY n.created_at DESC
    LIMIT p_limit
    OFFSET p_offset;
END;
$$;

-- Create 3-parameter version for backward compatibility  
CREATE OR REPLACE FUNCTION public.fetch_notifications(
    p_user_id UUID,
    p_limit INTEGER DEFAULT 50,
    p_offset INTEGER DEFAULT 0
)
RETURNS TABLE (
    id UUID,
    recipient_id UUID,
    type TEXT,
    title TEXT,
    message TEXT,
    link TEXT,
    read BOOLEAN,
    data JSONB,
    created_at TIMESTAMP WITH TIME ZONE,
    updated_at TIMESTAMP WITH TIME ZONE
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        n.id,
        n.recipient_id,
        n.type,
        n.message as title,
        n.message,
        n.link,
        (n.status = 'read') as read,  -- This is the key fix - use status column, not read column
        n.metadata as data,
        n.created_at,
        n.updated_at
    FROM public.wolfpack_activity_notifications n
    WHERE n.recipient_id = (
        SELECT u.id FROM public.users u WHERE u.auth_id = COALESCE(p_user_id, auth.uid())
    )
    ORDER BY n.created_at DESC
    LIMIT p_limit
    OFFSET p_offset;
END;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION public.fetch_notifications(INTEGER, INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION public.fetch_notifications(UUID, INTEGER, INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION public.fetch_notifications(INTEGER, INTEGER) TO anon;
GRANT EXECUTE ON FUNCTION public.fetch_notifications(UUID, INTEGER, INTEGER) TO anon;