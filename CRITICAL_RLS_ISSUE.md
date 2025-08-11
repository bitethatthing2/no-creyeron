# 🚨 CRITICAL: Infinite Recursion in RLS Policies

**Date:** August 10, 2025  
**Severity:** HIGH  
**Component:** Messaging System  
**Table:** `wolfpack_conversation_participants`

---

## Issue Description

The messaging system is experiencing a **500 Internal Server Error** due to infinite recursion in RLS (Row Level Security) policies for the `wolfpack_conversation_participants` table.

### Error Details
```
Failed to load resource: the server responded with a status of 500 (Internal Server Error)
details: "infinite recursion detected in policy for relation \"wolfpack_conversation_participants\""
error: "Failed to fetch messages"
```

### Affected Endpoints
- `/api/messages/conversation/[conversationId]` 
- All messaging-related queries involving conversation participants

---

## Root Cause

The RLS policies on `wolfpack_conversation_participants` are likely referencing each other or have circular dependencies causing infinite recursion when PostgreSQL tries to evaluate them.

Common causes:
1. Policy on `wolfpack_conversation_participants` references `wolfpack_conversations`
2. Policy on `wolfpack_conversations` references back to `wolfpack_conversation_participants`
3. Using `auth.uid()` instead of `(SELECT auth.uid())` in policies

---

## Immediate Fix Required (Backend Team)

### 1. Check Current Policies
```sql
-- View all policies on the affected table
SELECT * FROM pg_policies 
WHERE tablename = 'wolfpack_conversation_participants';

-- View all policies on related tables
SELECT * FROM pg_policies 
WHERE tablename IN ('wolfpack_conversations', 'wolfpack_messages');
```

### 2. Fix the Recursion
```sql
-- Drop problematic policies
DROP POLICY IF EXISTS "Users can view their conversations" ON wolfpack_conversation_participants;
DROP POLICY IF EXISTS "Users can view conversation participants" ON wolfpack_conversation_participants;

-- Create simplified, non-recursive policy
CREATE POLICY "Users can view their own participation"
ON wolfpack_conversation_participants
FOR SELECT
USING (
  user_id IN (
    SELECT id FROM users 
    WHERE auth_id = (SELECT auth.uid())
  )
);

-- Alternative: Use EXISTS pattern to avoid recursion
CREATE POLICY "Users can view participants in their conversations"
ON wolfpack_conversation_participants
FOR SELECT
USING (
  EXISTS (
    SELECT 1 
    FROM wolfpack_conversation_participants cp
    WHERE cp.conversation_id = wolfpack_conversation_participants.conversation_id
    AND cp.user_id IN (
      SELECT id FROM users WHERE auth_id = (SELECT auth.uid())
    )
  )
);
```

### 3. Verify Related Tables
```sql
-- Fix wolfpack_conversations policy if needed
DROP POLICY IF EXISTS "Users can view their conversations" ON wolfpack_conversations;

CREATE POLICY "Users can view their conversations"
ON wolfpack_conversations
FOR SELECT
USING (
  id IN (
    SELECT conversation_id 
    FROM wolfpack_conversation_participants
    WHERE user_id IN (
      SELECT id FROM users WHERE auth_id = (SELECT auth.uid())
    )
  )
);
```

---

## Frontend Workaround (Temporary)

While waiting for backend fix, the frontend is using RPC functions that bypass the problematic RLS:

```typescript
// Using safe RPC function instead of direct query
const { data: conversationResult, error } = await supabase
  .rpc('find_or_create_direct_conversation', {
    other_user_id: otherUser.id
  });
```

---

## Testing After Fix

1. **Test Direct Messages:**
   - Login as `mrobles0824@gmail.com`
   - Navigate to `/messages`
   - Send message to another user
   - Verify no 500 errors

2. **Check Console:**
   - No "infinite recursion" errors
   - Messages load properly
   - Conversation participants visible

3. **Database Query Test:**
```sql
-- This should work without recursion error
SELECT * FROM wolfpack_conversation_participants
WHERE user_id IN (
  SELECT id FROM users WHERE email = 'mrobles0824@gmail.com'
);
```

---

## Prevention

1. **Always use `(SELECT auth.uid())` instead of `auth.uid()` in policies**
2. **Avoid circular references between table policies**
3. **Use EXISTS patterns for complex relationships**
4. **Test policies in staging before production**
5. **Consider using RPC functions for complex permission logic**

---

## Status

⚠️ **AWAITING BACKEND FIX**

The frontend code is correctly calling the API, but the database RLS policies need to be fixed to resolve this issue.

**Frontend API Endpoint:** `/app/api/messages/conversation/[userId]/route.ts` (Line 83-94)  
**Affected Database Tables:** `wolfpack_conversation_participants`, `wolfpack_conversations`, `wolfpack_messages`

---

*This is a backend database issue that requires Supabase dashboard access to fix.*