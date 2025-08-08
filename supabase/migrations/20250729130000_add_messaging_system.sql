-- Create messaging system for Wolf Pack
-- This allows users to send direct messages to each other

-- Create conversations table (for organizing messages between users)
CREATE TABLE IF NOT EXISTS wolfpack_conversations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  last_message_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create conversation participants table (many-to-many for users in conversations)
CREATE TABLE IF NOT EXISTS wolfpack_conversation_participants (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  conversation_id UUID NOT NULL REFERENCES wolfpack_conversations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  last_read_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  UNIQUE(conversation_id, user_id)
);

-- Create messages table
CREATE TABLE IF NOT EXISTS wolfpack_messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  conversation_id UUID NOT NULL REFERENCES wolfpack_conversations(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content TEXT NOT NULL CHECK (char_length(content) > 0 AND char_length(content) <= 1000),
  message_type VARCHAR(20) DEFAULT 'text' CHECK (message_type IN ('text', 'image', 'video', 'audio')),
  media_url TEXT,
  reply_to_id UUID REFERENCES wolfpack_messages(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  is_deleted BOOLEAN DEFAULT FALSE,
  is_edited BOOLEAN DEFAULT FALSE
);

-- Create indexes for performance
CREATE INDEX idx_wolfpack_conversations_updated_at ON wolfpack_conversations(updated_at DESC);
CREATE INDEX idx_wolfpack_conversation_participants_user_id ON wolfpack_conversation_participants(user_id);
CREATE INDEX idx_wolfpack_conversation_participants_conversation_id ON wolfpack_conversation_participants(conversation_id);
CREATE INDEX idx_wolfpack_messages_conversation_id ON wolfpack_messages(conversation_id);
CREATE INDEX idx_wolfpack_messages_sender_id ON wolfpack_messages(sender_id);
CREATE INDEX idx_wolfpack_messages_created_at ON wolfpack_messages(created_at DESC);

-- Enable Row Level Security
ALTER TABLE wolfpack_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE wolfpack_conversation_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE wolfpack_messages ENABLE ROW LEVEL SECURITY;

-- RLS Policies for conversations
CREATE POLICY "Users can view conversations they participate in" ON wolfpack_conversations
  FOR SELECT USING (
    id IN (
      SELECT conversation_id FROM wolfpack_conversation_participants 
      WHERE user_id = auth.uid() AND is_active = TRUE
    )
  );

CREATE POLICY "Users can update conversations they participate in" ON wolfpack_conversations
  FOR UPDATE USING (
    id IN (
      SELECT conversation_id FROM wolfpack_conversation_participants 
      WHERE user_id = auth.uid() AND is_active = TRUE
    )
  );

-- RLS Policies for conversation participants
CREATE POLICY "Users can view participants in their conversations" ON wolfpack_conversation_participants
  FOR SELECT USING (
    conversation_id IN (
      SELECT conversation_id FROM wolfpack_conversation_participants 
      WHERE user_id = auth.uid() AND is_active = TRUE
    )
  );

CREATE POLICY "Users can join conversations" ON wolfpack_conversation_participants
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own participation" ON wolfpack_conversation_participants
  FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- RLS Policies for messages
CREATE POLICY "Users can view messages in their conversations" ON wolfpack_messages
  FOR SELECT USING (
    conversation_id IN (
      SELECT conversation_id FROM wolfpack_conversation_participants 
      WHERE user_id = auth.uid() AND is_active = TRUE
    ) AND NOT is_deleted
  );

CREATE POLICY "Users can create messages in their conversations" ON wolfpack_messages
  FOR INSERT WITH CHECK (
    auth.uid() = sender_id AND
    conversation_id IN (
      SELECT conversation_id FROM wolfpack_conversation_participants 
      WHERE user_id = auth.uid() AND is_active = TRUE
    )
  );

CREATE POLICY "Users can update their own messages" ON wolfpack_messages
  FOR UPDATE USING (auth.uid() = sender_id) WITH CHECK (auth.uid() = sender_id);

-- Function to create or get a conversation between two users
CREATE OR REPLACE FUNCTION get_or_create_conversation(user1_id UUID, user2_id UUID)
RETURNS UUID AS $$
DECLARE
  conv_id UUID;
BEGIN
  -- Check if conversation already exists between these users
  SELECT c.id INTO conv_id
  FROM wolfpack_conversations c
  WHERE c.id IN (
    SELECT p1.conversation_id
    FROM wolfpack_conversation_participants p1
    JOIN wolfpack_conversation_participants p2 ON p1.conversation_id = p2.conversation_id
    WHERE p1.user_id = user1_id AND p2.user_id = user2_id
    AND p1.is_active = TRUE AND p2.is_active = TRUE
  )
  LIMIT 1;

  -- If no conversation exists, create one
  IF conv_id IS NULL THEN
    INSERT INTO wolfpack_conversations DEFAULT VALUES RETURNING id INTO conv_id;
    
    -- Add both participants
    INSERT INTO wolfpack_conversation_participants (conversation_id, user_id) 
    VALUES (conv_id, user1_id), (conv_id, user2_id);
  END IF;

  RETURN conv_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get conversation list for a user
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
      FROM wolfpack_messages m
      WHERE m.conversation_id = c.id 
      AND m.created_at > current_participant.last_read_at
      AND m.sender_id != user_uuid
      AND NOT m.is_deleted
    ) as unread_count
  FROM wolfpack_conversations c
  JOIN wolfpack_conversation_participants current_participant 
    ON c.id = current_participant.conversation_id AND current_participant.user_id = user_uuid
  JOIN wolfpack_conversation_participants other_participant 
    ON c.id = other_participant.conversation_id AND other_participant.user_id != user_uuid
  JOIN users u ON other_participant.user_id = u.auth_id
  LEFT JOIN LATERAL (
    SELECT content
    FROM wolfpack_messages 
    WHERE conversation_id = c.id AND NOT is_deleted
    ORDER BY created_at DESC 
    LIMIT 1
  ) last_msg ON true
  WHERE current_participant.is_active = TRUE AND other_participant.is_active = TRUE
  ORDER BY c.last_message_at DESC;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

-- Function to mark messages as read
CREATE OR REPLACE FUNCTION mark_messages_as_read(conv_id UUID, user_uuid UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE wolfpack_conversation_participants
  SET last_read_at = timezone('utc'::text, now())
  WHERE conversation_id = conv_id AND user_id = user_uuid;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to update conversation's last_message_at when a message is sent
CREATE OR REPLACE FUNCTION update_conversation_last_message()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE wolfpack_conversations
  SET 
    last_message_at = NEW.created_at,
    updated_at = timezone('utc'::text, now())
  WHERE id = NEW.conversation_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_conversation_on_message
  AFTER INSERT ON wolfpack_messages
  FOR EACH ROW
  EXECUTE FUNCTION update_conversation_last_message();

-- Grant permissions
GRANT SELECT, INSERT, UPDATE ON TABLE wolfpack_conversations TO authenticated;
GRANT SELECT, INSERT, UPDATE ON TABLE wolfpack_conversation_participants TO authenticated;
GRANT SELECT, INSERT, UPDATE ON TABLE wolfpack_messages TO authenticated;

GRANT EXECUTE ON FUNCTION get_or_create_conversation(UUID, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_user_conversations(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION mark_messages_as_read(UUID, UUID) TO authenticated;