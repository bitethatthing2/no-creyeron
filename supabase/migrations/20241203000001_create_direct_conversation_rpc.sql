-- Create RPC function for creating direct conversations
-- This bypasses RLS issues by using security definer

CREATE OR REPLACE FUNCTION create_direct_conversation(p_user_id UUID)
RETURNS JSON
SECURITY DEFINER
SET search_path = public, pg_temp
LANGUAGE plpgsql
AS $$
DECLARE
    v_conversation_id UUID;
    v_current_user_id UUID;
    v_result JSON;
BEGIN
    -- Get current user
    v_current_user_id := auth.uid();
    
    -- Check if user is authenticated
    IF v_current_user_id IS NULL THEN
        RETURN JSON_BUILD_OBJECT(
            'error', 'Not authenticated',
            'code', 'UNAUTHENTICATED'
        );
    END IF;
    
    -- Check if trying to create conversation with self
    IF v_current_user_id = p_user_id THEN
        RETURN JSON_BUILD_OBJECT(
            'error', 'Cannot create conversation with yourself',
            'code', 'INVALID_USER'
        );
    END IF;
    
    -- Check if conversation already exists
    SELECT c.id INTO v_conversation_id
    FROM chat_conversations c
    JOIN chat_participants p1 ON c.id = p1.conversation_id
    JOIN chat_participants p2 ON c.id = p2.conversation_id
    WHERE c.conversation_type = 'direct'
      AND p1.user_id = v_current_user_id
      AND p2.user_id = p_user_id
      AND p1.is_active = true
      AND p2.is_active = true
    LIMIT 1;
    
    -- If conversation exists, return it
    IF v_conversation_id IS NOT NULL THEN
        SELECT JSON_BUILD_OBJECT(
            'id', c.id,
            'conversation_type', c.conversation_type,
            'created_by', c.created_by,
            'created_at', c.created_at,
            'is_active', c.is_active,
            'existing', true
        ) INTO v_result
        FROM chat_conversations c
        WHERE c.id = v_conversation_id;
        
        RETURN v_result;
    END IF;
    
    -- Create new conversation
    INSERT INTO chat_conversations (
        conversation_type,
        created_by,
        is_active
    ) VALUES (
        'direct',
        v_current_user_id,
        true
    ) RETURNING id INTO v_conversation_id;
    
    -- Add both participants
    INSERT INTO chat_participants (conversation_id, user_id, role, is_active)
    VALUES 
        (v_conversation_id, v_current_user_id, 'member', true),
        (v_conversation_id, p_user_id, 'member', true);
    
    -- Return the created conversation
    SELECT JSON_BUILD_OBJECT(
        'id', c.id,
        'conversation_type', c.conversation_type,
        'created_by', c.created_by,
        'created_at', c.created_at,
        'is_active', c.is_active,
        'existing', false
    ) INTO v_result
    FROM chat_conversations c
    WHERE c.id = v_conversation_id;
    
    RETURN v_result;
    
EXCEPTION
    WHEN OTHERS THEN
        RETURN JSON_BUILD_OBJECT(
            'error', SQLERRM,
            'code', SQLSTATE
        );
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION create_direct_conversation(UUID) TO authenticated;

-- Create basic RLS policies for chat tables if they don't exist
DO $$
BEGIN
    -- Enable RLS
    ALTER TABLE chat_conversations ENABLE ROW LEVEL SECURITY;
    ALTER TABLE chat_participants ENABLE ROW LEVEL SECURITY;
    ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;
    
    -- Chat conversations policies
    DROP POLICY IF EXISTS "Users can create conversations" ON chat_conversations;
    CREATE POLICY "Users can create conversations" ON chat_conversations
        FOR INSERT 
        WITH CHECK (created_by = auth.uid());
        
    DROP POLICY IF EXISTS "Users can view their conversations" ON chat_conversations;
    CREATE POLICY "Users can view their conversations" ON chat_conversations
        FOR SELECT 
        USING (
            id IN (
                SELECT conversation_id 
                FROM chat_participants 
                WHERE user_id = auth.uid() AND is_active = true
            )
        );
        
    DROP POLICY IF EXISTS "Users can update own conversations" ON chat_conversations;
    CREATE POLICY "Users can update own conversations" ON chat_conversations
        FOR UPDATE 
        USING (created_by = auth.uid())
        WITH CHECK (created_by = auth.uid());
    
    -- Chat participants policies
    DROP POLICY IF EXISTS "Users can join conversations" ON chat_participants;
    CREATE POLICY "Users can join conversations" ON chat_participants
        FOR INSERT 
        WITH CHECK (user_id = auth.uid());
        
    DROP POLICY IF EXISTS "Users can view conversation participants" ON chat_participants;
    CREATE POLICY "Users can view conversation participants" ON chat_participants
        FOR SELECT 
        USING (
            conversation_id IN (
                SELECT conversation_id 
                FROM chat_participants 
                WHERE user_id = auth.uid() AND is_active = true
            )
        );
        
    DROP POLICY IF EXISTS "Users can update own participation" ON chat_participants;
    CREATE POLICY "Users can update own participation" ON chat_participants
        FOR UPDATE 
        USING (user_id = auth.uid())
        WITH CHECK (user_id = auth.uid());
    
    -- Chat messages policies
    DROP POLICY IF EXISTS "Users can send messages" ON chat_messages;
    CREATE POLICY "Users can send messages" ON chat_messages
        FOR INSERT 
        WITH CHECK (
            sender_id = auth.uid() AND
            conversation_id IN (
                SELECT conversation_id 
                FROM chat_participants 
                WHERE user_id = auth.uid() AND is_active = true
            )
        );
        
    DROP POLICY IF EXISTS "Users can view messages in their conversations" ON chat_messages;
    CREATE POLICY "Users can view messages in their conversations" ON chat_messages
        FOR SELECT 
        USING (
            conversation_id IN (
                SELECT conversation_id 
                FROM chat_participants 
                WHERE user_id = auth.uid() AND is_active = true
            )
        );
        
    DROP POLICY IF EXISTS "Users can update own messages" ON chat_messages;
    CREATE POLICY "Users can update own messages" ON chat_messages
        FOR UPDATE 
        USING (sender_id = auth.uid())
        WITH CHECK (sender_id = auth.uid());

EXCEPTION
    WHEN OTHERS THEN
        -- Policies might already exist, that's okay
        NULL;
END $$;