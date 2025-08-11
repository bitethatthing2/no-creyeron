# 🗄️ Wolfpack Database Schema & Frontend Sync

This document ensures your frontend code stays perfectly synchronized with the Supabase database schema.

## 📋 Schema Overview

### Core Tables

| Table | Purpose | Key Columns |
|-------|---------|-------------|
| `wolfpack_post_likes` | Post likes/hearts | `video_id`, `user_id` (unique together) |
| `wolfpack_comments` | wolfpack_comments & replies | `video_id`, `parent_comment_id`, `content` |
| `wolfpack_videos` | wolfpack_posts/wolfpack_videos | `id`, `user_id`, `video_url` |
| `users` | User profiles | `id`, `first_name`, `last_name`, `avatar_url` |

### Key RPC Functions

| Function | Purpose | Parameters |
|----------|---------|------------|
| `user_liked_video` | Check if user liked post | `p_video_id: uuid` |

---

## 🔧 Critical Schema Details

### `wolfpack_post_likes` Table
```sql
CREATE TABLE wolfpack_post_likes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  video_id uuid NOT NULL REFERENCES wolfpack_videos(id),
  user_id uuid NOT NULL REFERENCES users(id),
  created_at timestamptz DEFAULT now(),
  UNIQUE(video_id, user_id)  -- 🔑 User can only like once
);
```

**Frontend Usage:**
```typescript
// ✅ Correct table name
await supabase.from('wolfpack_post_likes')

// ✅ Correct column names  
.eq('video_id', postId)     // Not video_id!
.eq('user_id',conversationid)

// ✅ Handle unique constraint (error code 23505)
if (error?.code === '23505') {
  console.log('User already liked this post')
}
```

### `wolfpack_comments` Table
```sql
CREATE TABLE wolfpack_comments(
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  video_id uuid REFERENCES wolfpack_videos(id),
  user_id uuid NOT NULL REFERENCES users(id),
  parent_comment_id uuid REFERENCES wolfpack_comments(id), -- For replies
  content text NOT NULL,
  like_count integer DEFAULT 0,
  is_pinned boolean DEFAULT false,
  is_edited boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
```

**Frontend Usage:**
```typescript
// ✅ Get top-level wolfpack_comments
await supabase
  .from('wolfpack_comments')
  .select(`
    *,
    user:users!user_id(
      id, first_name, last_name, avatar_url
    )
  `)
  .eq('video_id', postId)           // ✅ Correct column
  .is('parent_comment_id', null)   // ✅ Top-level only

// ✅ Get replies to a comment
await supabase
  .from('wolfpack_comments')
  .select('*, user:users!user_id(*)')
  .eq('parent_comment_id', commentId)
```

---

## 🎯 Frontend Implementation Guide

### 1. Use Generated Types

**Always import and use the generated database types:**

```typescript
import { Database } from '@/types/database.types'

type PostLike = Database['public']['Tables']['wolfpack_post_likes']['Row']
type Comment = Database['public']['Tables']['wolfpack_comments']['Row']
```

### 2. Use Typed Database Functions

**Import from the database layer:**

```typescript
import { 
  togglePostLike, 
  checkIfUserLikedPost, 
  getLikeCount 
} from '@/lib/database/likes'

import { 
  getwolfpack_commentsForPost,
  createComment,
  deleteComment 
} from '@/lib/database/wolfpack_comments'
```

### 3. Use React Hooks

**Import standardized hooks:**

```typescript
import { usewolfpack_comments } from '@/hooks/usewolfpack_comments'
import { useLikes } from '@/hooks/useLikes'
import { usewolfpack_posts } from '@/hooks/usewolfpack_posts'

function VideoCard({ postId }: { postId: string }) {
  const { wolfpack_comments, addComment } = usewolfpack_comments(postId)
  const { liked, likeCount, toggleLike } = useLikes(postId)
  
  return (
    <div>
      <button onClick={toggleLike}>
        {liked ? '❤️' : '🤍'} {likeCount}
      </button>
      {/* wolfpack_comments UI */}
    </div>
  )
}
```

### 4. Handle RPC Functions Correctly

**Use the correct parameter names:**

```typescript
// ✅ Correct RPC usage
const { data } = await supabase
  .rpc('user_liked_video', { 
    p_video_id: postId  // ✅ Parameter name with p_ prefix
  })

// ❌ Wrong parameter name
const { data } = await supabase
  .rpc('user_liked_video', { 
    video_id: postId    // ❌ Missing p_ prefix
  })
```

---

## 🚨 Common Mistakes & Fixes

### 1. Wrong Table Names

```typescript
// ❌ Wrong table name
await supabase.from('wolfpack_post_likes')

// ✅ Correct table name  
await supabase.from('wolfpack_post_likes')
```

### 2. Wrong Column Names

```typescript
// ❌ Wrong column name
.eq('video_id', postId)

// ✅ Correct column name
.eq('video_id', postId)
```

### 3. Not Handling Unique Constraints

```typescript
// ❌ Not handling duplicate likes
const { error } = await supabase
  .from('wolfpack_post_likes')
  .insert({ video_id, user_id })

// ✅ Handle unique constraint properly
const { error } = await supabase
  .from('wolfpack_post_likes')
  .insert({ video_id, user_id })

if (error?.code === '23505') {
  console.log('User already liked this post')
} else if (error) {
  throw error
}
```

### 4. Not Using Proper Relations

```typescript
// ❌ Missing user data
const { data } = await supabase
  .from('wolfpack_comments')
  .select('*')

// ✅ Include user relation
const { data } = await supabase
  .from('wolfpack_comments')
  .select(`
    *,
    user:users!user_id(
      id,
      first_name,
      last_name,
      avatar_url
    )
  `)
```

---

## ✅ Validation Checklist

Run these commands to ensure sync:

```bash
# Generate latest types
npm run types:generate

# Validate schema sync
npm run db:check

# Full sync validation
npm run db:sync
```

### Manual Schema Validation

```typescript
// Test critical operations
async function validateSchema() {
  // 1. Test likes table
  const { data: likes } = await supabase
    .from('wolfpack_post_likes')
    .select('id, video_id, user_id, created_at')
    .limit(1)
  
  // 2. Test wolfpack_comments table  
  const { data: wolfpack_comments } = await supabase
    .from('wolfpack_comments')
    .select('id, video_id, user_id, content, parent_comment_id')
    .limit(1)
    
  // 3. Test RPC function
  const { data: liked } = await supabase
    .rpc('user_liked_video', { p_video_id: 'test-uuid' })
    
  console.log('✅ Schema validation passed')
}
```

---

## 🔄 Migration Guidelines

### When Schema Changes

1. **Update Database First**
   ```sql
   -- Add new column
   ALTER TABLE wolfpack_comments
   ADD COLUMN is_featured boolean DEFAULT false;
   ```

2. **Regenerate Types**
   ```bash
   npm run types:generate
   ```

3. **Update Frontend Code**
   ```typescript
   // Update interfaces to include new fields
   const { data } = await supabase
     .from('wolfpack_comments')
     .select('*, is_featured')  // Include new column
   ```

4. **Validate Sync**
   ```bash
   npm run db:check
   ```

### When Adding New Tables

1. **Create table with proper RLS**
2. **Add to validation script**
3. **Create typed functions**
4. **Create React hooks**
5. **Update documentation**

---

## 🛡️ Security Best Practices

### Row Level Security (RLS)

Your schema includes these RLS policies:

```sql
-- Users can only delete their own likes
CREATE POLICY "Users can delete own likes" ON wolfpack_post_likes
  FOR DELETE USING (auth.uid() = user_id);

-- Users can only update their own wolfpack_comments  
CREATE POLICY "Users can update own wolfpack_comments" ON wolfpack_comments
  FOR UPDATE USING (auth.uid() = user_id);
```

**Frontend Implementation:**

```typescript
// ✅ RLS will automatically filter
const { error } = await supabase
  .from('wolfpack_post_likes')
  .delete()
  .eq('video_id', postId)
  // No need to add .eq('user_id',conversationid) - RLS handles this

// ✅ For extra safety, still include user check
const { error } = await supabase
  .from('wolfpack_comments')
  .update({ content: newContent })
  .eq('id', commentId)
  .eq('user_id',conversationid)  // Double-check ownership
```

---

## 📊 Performance Optimization

### Indexes

Your schema should have these indexes:

```sql
-- For likes queries
CREATE INDEX idx_wolfpack_post_likes_video_id ON wolfpack_post_likes(video_id);
CREATE INDEX idx_wolfpack_post_likes_user_id ON wolfpack_post_likes(user_id);

-- For wolfpack_comments queries  
CREATE INDEX idx_wolfpack_comments_video_id ON wolfpack_comments(video_id);
CREATE INDEX idx_wolfpack_comments_parent_comment_id ON wolfpack_comments(parent_comment_id);
```

### Frontend Optimization

```typescript
// ✅ Use pagination for large result sets
const { data } = await supabase
  .from('wolfpack_comments')
  .select('*')
  .eq('video_id', postId)
  .range(0, 19)  // Limit to 20 wolfpack_comments
  
// ✅ Use count queries efficiently
const { count } = await supabase
  .from('wolfpack_post_likes')
  .select('*', { count: 'exact', head: true })
  .eq('video_id', postId)
```

---

## 🎉 Success Metrics

Your frontend is properly synced when:

- ✅ All TypeScript types compile without errors
- ✅ Database operations use correct table/column names
- ✅ Unique constraints are handled properly
- ✅ RLS policies work as expected
- ✅ Real-time subscriptions receive updates
- ✅ No duplicate data in the database
- ✅ Performance is optimal with proper indexing

Run `npm run db:sync` regularly to maintain perfect synchronization! 🚀