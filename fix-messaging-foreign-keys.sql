-- Fix messaging system to properly reference users table instead of auth.users
-- This fixes the 500 error in conversation API

-- First, drop existing foreign key constraints
ALTER TABLE chat_participants 
DROP CONSTRAINT IF EXISTS chat_participants_user_id_fkey;

ALTER TABLE chat_messages 
DROP CONSTRAINT IF EXISTS chat_messages_conversation_id_fkey;

-- Recreate foreign keys to reference the public.users table instead of auth.users
ALTER TABLE chat_participants 
ADD CONSTRAINT chat_participants_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;

ALTER TABLE chat_messages 
ADD CONSTRAINT chat_messages_conversation_id_fkey 
FOREIGN KEY (conversation_id) REFERENCES users(id) ON DELETE CASCADE;

-- Update RLS policies to work with the correct user mapping
-- Drop existing policies
DROP POLICY IF EXISTS "Users can view conversations they participate in" ON chat_conversations;
DROP POLICY IF EXISTS "Users can update conversations they participate in" ON chat_conversations;
DROP POLICY IF EXISTS "Users can view participants in their conversations" ON chat_participants;
DROP POLICY IF EXISTS "Users can join conversations" ON chat_participants;
DROP POLICY IF EXISTS "Users can update their own participation" ON chat_participants;
DROP POLICY IF EXISTS "Users can view messages in their conversations" ON chat_messages;
DROP POLICY IF EXISTS "Users can create messages in their conversations" ON chat_messages;
DROP POLICY IF EXISTS "Users can update their own messages" ON chat_messages;

-- Create new policies that properly map auth.uid() to users.id
CREATE POLICY "Users can view conversations they participate in" ON chat_conversations
  FOR SELECT USING (
    id IN (
      SELECT conversation_id FROM chat_participants 
      WHERE user_id IN (
        SELECT id FROM users WHERE auth_id = auth.uid()
      ) AND is_active = TRUE
    )
  );

CREATE POLICY "Users can update conversations they participate in" ON chat_conversations
  FOR UPDATE USING (
    id IN (
      SELECT conversation_id FROM chat_participants 
      WHERE user_id IN (
        SELECT id FROM users WHERE auth_id = auth.uid()
      ) AND is_active = TRUE
    )
  );

-- Policy to allow creating conversations
CREATE POLICY "Users can create conversations" ON chat_conversations
  FOR INSERT WITH CHECK (TRUE);

-- RLS Policies for conversation participants
CREATE POLICY "Users can view participants in their conversations" ON chat_participants
  FOR SELECT USING (
    conversation_id IN (
      SELECT conversation_id FROM chat_participants 
      WHERE user_id IN (
        SELECT id FROM users WHERE auth_id = auth.uid()
      ) AND is_active = TRUE
    ) OR user_id IN (
      SELECT id FROM users WHERE auth_id = auth.uid()
    )
  );

CREATE POLICY "Users can join conversations" ON chat_participants
  FOR INSERT WITH CHECK (
    user_id IN (
      SELECT id FROM users WHERE auth_id = auth.uid()
    )
  );

CREATE POLICY "Users can update their own participation" ON chat_participants
  FOR UPDATE USING (
    user_id IN (
      SELECT id FROM users WHERE auth_id = auth.uid()
    )
  ) WITH CHECK (
    user_id IN (
      SELECT id FROM users WHERE auth_id = auth.uid()
    )
  );

-- RLS Policies for messages
CREATE POLICY "Users can view messages in their conversations" ON chat_messages
  FOR SELECT USING (
    conversation_id IN (
      SELECT conversation_id FROM chat_participants 
      WHERE user_id IN (
        SELECT id FROM users WHERE auth_id = auth.uid()
      ) AND is_active = TRUE
    ) AND NOT is_deleted
  );

CREATE POLICY "Users can create messages in their conversations" ON chat_messages
  FOR INSERT WITH CHECK (
    conversation_id IN (
      SELECT id FROM users WHERE auth_id = auth.uid()
    ) AND
    conversation_id IN (
      SELECT conversation_id FROM chat_participants 
      WHERE user_id IN (
        SELECT id FROM users WHERE auth_id = auth.uid()
      ) AND is_active = TRUE
    )
  );

CREATE POLICY "Users can update their own messages" ON chat_messages
  FOR UPDATE USING (
    conversation_id IN (
      SELECT id FROM users WHERE auth_id = auth.uid()
    )
  ) WITH CHECK (
    conversation_id IN (
      SELECT id FROM users WHERE auth_id = auth.uid()
    )
  );

-- Update the helper functions to work with the correct user table
DROP FUNCTION IF EXISTS get_or_create_conversation(UUID, UUID);
CREATE OR REPLACE FUNCTION get_or_create_conversation(user1_id UUID, user2_id UUID)
RETURNS UUID AS $$
DECLARE
  conv_id UUID;
BEGIN
  -- Check if conversation already exists between these users
  SELECT c.id INTO conv_id
  FROM chat_conversations c
  WHERE c.id IN (
    SELECT p1.conversation_id
    FROM chat_participants p1
    JOIN chat_participants p2 ON p1.conversation_id = p2.conversation_id
    WHERE p1.user_id = user1_id AND p2.user_id = user2_id
    AND p1.is_active = TRUE AND p2.is_active = TRUE
  )
  LIMIT 1;

  -- If no conversation exists, create one
  IF conv_id IS NULL THEN
    INSERT INTO chat_conversations DEFAULT VALUES RETURNING id INTO conv_id;
    
    -- Add both participants
    INSERT INTO chat_participants (conversation_id, user_id) 
    VALUES (conv_id, user1_id), (conv_id, user2_id);
  END IF;

  RETURN conv_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Update get_user_conversations function to work with users table
DROP FUNCTION IF EXISTS get_user_conversations(UUID);
CREATE OR REPLACE FUNCTION get_user_conversations(user_uuid UUID)
RETURNS TABLE (
  conversation_id UUID,
  other_user_id UUID,
  other_username VARCHAR,
  other_display_name TEXT,
  other_avatar_url TEXT,
  last_message TEXT,
  last_message_at TIMESTAMP WITH TIME ZONE,
  unread_count BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    c.id as conversation_id,
    other_participant.user_id as other_user_id,
    u.username as other_username,
    u.display_name as other_display_name,
    COALESCE(u.avatar_url, u.profile_image_url) as other_avatar_url,
    last_msg.content as last_message,
    c.last_message_at,
    (
      SELECT COUNT(*)
      FROM chat_messages m
      WHERE m.conversation_id = c.id 
      AND m.created_at > current_participant.last_read_at
      AND m.conversation_id != user_uuid
      AND NOT m.is_deleted
    ) as unread_count
  FROM chat_conversations c
  JOIN chat_participants current_participant 
    ON c.id = current_participant.conversation_id AND current_participant.user_id = user_uuid
  JOIN chat_participants other_participant 
    ON c.id = other_participant.conversation_id AND other_participant.user_id != user_uuid
  JOIN users u ON other_participant.user_id = u.id
  LEFT JOIN LATERAL (
    SELECT content
    FROM chat_messages 
    WHERE conversation_id = c.id AND NOT is_deleted
    ORDER BY created_at DESC 
    LIMIT 1
  ) last_msg ON true
  WHERE current_participant.is_active = TRUE AND other_participant.is_active = TRUE
  ORDER BY c.last_message_at DESC;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

-- Grant updated permissions
GRANT EXECUTE ON FUNCTION get_or_create_conversation(UUID, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_user_conversations(UUID) TO authenticated;