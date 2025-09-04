# Messages Page Edge Function Fix

## The Problem
The messages inbox page (`app/(main)/messages/page.tsx`) is making direct Supabase queries to `chat_participants` and `chat_conversations` tables, which triggers the RLS infinite recursion error.

## The Solution
The page should use the MESSAGE_HANDLER edge function instead of direct queries.

## What Needs to Change

### Current (Broken) Approach:
```typescript
// Direct query causing RLS recursion
const { data: participantRecords } = await supabase
  .from('chat_participants')
  .select('conversation_id, last_read_at, notification_settings')
  .eq('user_id', currentUser.id)
```

### Fixed Approach:
```typescript
// Use MESSAGE_HANDLER edge function
const response = await messageHandlerService.getConversations();
const conversations = response.conversations || [];
```

## Files to Update:
1. `app/(main)/messages/page.tsx` - Replace direct queries with edge function calls
2. Import `messageHandlerService` from `@/lib/services/message-handler.service`

## Benefits:
- Avoids RLS recursion issues
- Automatic push notifications
- Better performance
- Consistent with other messaging components