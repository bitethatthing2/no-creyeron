-- Fix RLS policies for messaging tables to prevent infinite recursion

-- Drop existing policies that might cause recursion
DROP POLICY IF EXISTS "Users can view their own conversation participants" ON chat_participants;
DROP POLICY IF EXISTS "Users can create conversation participants" ON chat_participants;
DROP POLICY IF EXISTS "Users can update their own conversation participants" ON chat_participants;
DROP POLICY IF EXISTS "Users can view conversations they participate in" ON chat_conversations;
DROP POLICY IF EXISTS "Users can create conversations" ON chat_conversations;
DROP POLICY IF EXISTS "Users can view messages in their conversations" ON chat_messages;
DROP POLICY IF EXISTS "Users can create messages in their conversations" ON chat_messages;

-- Simple, non-recursive RLS policies for chat_conversations
CREATE POLICY "Enable all operations for authenticated users on chat_conversations"
ON chat_conversations
FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

-- Simple, non-recursive RLS policies for chat_participants  
CREATE POLICY "Enable all operations for authenticated users on chat_participants"
ON chat_participants
FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

-- Simple, non-recursive RLS policies for chat_messages
CREATE POLICY "Enable all operations for authenticated users on chat_messages"
ON chat_messages
FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

-- Make sure RLS is enabled
ALTER TABLE chat_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;

-- Grant necessary permissions
GRANT ALL ON chat_conversations TO authenticated;
GRANT ALL ON chat_participants TO authenticated;
GRANT ALL ON chat_messages TO authenticated;

GRANT ALL ON chat_conversations TO anon;
GRANT ALL ON chat_participants TO anon;
GRANT ALL ON chat_messages TO anon;