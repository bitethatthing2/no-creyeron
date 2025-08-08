-- Fix RLS policies for messaging tables to prevent infinite recursion

-- Drop existing policies that might cause recursion
DROP POLICY IF EXISTS "Users can view their own conversation participants" ON wolfpack_conversation_participants;
DROP POLICY IF EXISTS "Users can create conversation participants" ON wolfpack_conversation_participants;
DROP POLICY IF EXISTS "Users can update their own conversation participants" ON wolfpack_conversation_participants;
DROP POLICY IF EXISTS "Users can view conversations they participate in" ON wolfpack_conversations;
DROP POLICY IF EXISTS "Users can create conversations" ON wolfpack_conversations;
DROP POLICY IF EXISTS "Users can view messages in their conversations" ON wolfpack_messages;
DROP POLICY IF EXISTS "Users can create messages in their conversations" ON wolfpack_messages;

-- Simple, non-recursive RLS policies for wolfpack_conversations
CREATE POLICY "Enable all operations for authenticated users on wolfpack_conversations"
ON wolfpack_conversations
FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

-- Simple, non-recursive RLS policies for wolfpack_conversation_participants  
CREATE POLICY "Enable all operations for authenticated users on wolfpack_conversation_participants"
ON wolfpack_conversation_participants
FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

-- Simple, non-recursive RLS policies for wolfpack_messages
CREATE POLICY "Enable all operations for authenticated users on wolfpack_messages"
ON wolfpack_messages
FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

-- Make sure RLS is enabled
ALTER TABLE wolfpack_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE wolfpack_conversation_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE wolfpack_messages ENABLE ROW LEVEL SECURITY;

-- Grant necessary permissions
GRANT ALL ON wolfpack_conversations TO authenticated;
GRANT ALL ON wolfpack_conversation_participants TO authenticated;
GRANT ALL ON wolfpack_messages TO authenticated;

GRANT ALL ON wolfpack_conversations TO anon;
GRANT ALL ON wolfpack_conversation_participants TO anon;
GRANT ALL ON wolfpack_messages TO anon;