-- Fix for infinite recursion in chat_participants RLS policies
-- Run this in your Supabase SQL Editor

-- First, temporarily disable RLS to fix the policies
ALTER TABLE chat_participants DISABLE ROW LEVEL SECURITY;
ALTER TABLE chat_conversations DISABLE ROW LEVEL SECURITY;
ALTER TABLE chat_messages DISABLE ROW LEVEL SECURITY;

-- Drop existing problematic policies
DROP POLICY IF EXISTS "Users can view their own participations" ON chat_participants;
DROP POLICY IF EXISTS "Users can view participations in their conversations" ON chat_participants;
DROP POLICY IF EXISTS "Users can insert their own participations" ON chat_participants;
DROP POLICY IF EXISTS "Users can update their own participations" ON chat_participants;
DROP POLICY IF EXISTS "Users can delete their own participations" ON chat_participants;

-- Create new, non-recursive policies for chat_participants
CREATE POLICY "Users can view their own participations"
ON chat_participants FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can view other participants in shared conversations"
ON chat_participants FOR SELECT
USING (
  EXISTS (
    SELECT 1 
    FROM chat_participants cp2
    WHERE cp2.conversation_id = chat_participants.conversation_id
    AND cp2.user_id = auth.uid()
    AND cp2.is_active = true
  )
);

CREATE POLICY "Users can insert participations"
ON chat_participants FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own participations"
ON chat_participants FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can soft delete their own participations"
ON chat_participants FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (
  auth.uid() = user_id 
  AND is_active = false
);

-- Fix policies for chat_conversations
DROP POLICY IF EXISTS "Users can view conversations they participate in" ON chat_conversations;

CREATE POLICY "Users can view conversations they participate in"
ON chat_conversations FOR SELECT
USING (
  id IN (
    SELECT conversation_id 
    FROM chat_participants 
    WHERE user_id = auth.uid() 
    AND is_active = true
  )
);

-- Fix policies for chat_messages
DROP POLICY IF EXISTS "Users can view messages in their conversations" ON chat_messages;

CREATE POLICY "Users can view messages in their conversations"
ON chat_messages FOR SELECT
USING (
  conversation_id IN (
    SELECT conversation_id 
    FROM chat_participants 
    WHERE user_id = auth.uid() 
    AND is_active = true
  )
);

-- Re-enable RLS
ALTER TABLE chat_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;

-- Test query to verify no recursion
SELECT COUNT(*) FROM chat_participants WHERE user_id = auth.uid();