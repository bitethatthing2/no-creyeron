# 🔄 Supabase Frontend Sync System

This guide explains how to keep your frontend perfectly synchronized with your Supabase database to prevent duplicates and ensure data consistency.

## 🎯 Quick Start

### 1. Generate Latest Types
```bash
npm run types:generate
```

### 2. Check Database Sync
```bash
npm run db:check
```

### 3. Use Typed Functions
```typescript
import { usewolfpack_comments } from '@/hooks/usewolfpack_comments'
import { useLikes } from '@/hooks/useLikes'
import { usewolfpack_posts } from '@/hooks/usewolfpack_posts'
```

## 📋 Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [Type Safety System](#type-safety-system)
3. [Database Helper Functions](#database-helper-functions)
4. [React Hooks](#react-hooks)
5. [Real-time Sync](#real-time-sync)
6. [Migration Guide](#migration-guide)
7. [Best Practices](#best-practices)
8. [Troubleshooting](#troubleshooting)

## 🏗️ Architecture Overview

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   Components    │    │   React Hooks    │    │ Database Layer  │
│                 │────▶│                  │────▶│                 │
│ Videowolfpack_comments   │    │ usewolfpack_comments      │    │ wolfpack_comments.ts     │
│ LikeButton      │    │ useLikes         │    │ likes.ts        │
│ PostFeed        │    │ usewolfpack_posts         │    │ wolfpack_posts.ts        │
└─────────────────┘    └──────────────────┘    └─────────────────┘
         │                       │                       │
         └───────────────────────┼───────────────────────┘
                                 │
                    ┌──────────────────┐
                    │ Typed Client     │
                    │ /lib/supabase/   │
                    │ client.ts        │
                    └──────────────────┘
                                 │
                    ┌──────────────────┐
                    │ Generated Types  │
                    │ /types/          │
                    │ database.types.ts│
                    └──────────────────┘
```

## 🛡️ Type Safety System

### Automatic Type Generation

Your `package.json` includes scripts that automatically generate TypeScript types:

```json
{
  "scripts": {
    "types:generate": "npx supabase gen types typescript --project-id tvnpgbjypnezoasbhbwx > types/database.types.ts",
    "prebuild": "npm run types:generate",
    "predev": "npm run types:generate"
  }
}
```

### Typed Supabase Client

The client in `/lib/supabase/client.ts` is now fully typed:

```typescript
import { Database } from '@/types/database.types'

const supabaseClient = createBrowserClient<Database>(
  supabaseUrl,
  supabaseAnonKey
)
```

## 🗄️ Database Helper Functions

### wolfpack_comments (`/lib/database/wolfpack_comments.ts`)

```typescript
// ✅ Correct table name and columns
await supabase
  .from('wolfpack_comments')
  .select('*, user:users!user_id(*)')
  .eq('video_id', postId) // ✅ video_id, not video_id
```

### Likes (`/lib/database/likes.ts`)

```typescript
// ✅ Correct table name
await supabase
  .from('wolfpack_post_likes') // ✅ Not wolfpack_post_likes
  .select('*')
  .eq('video_id', postId)
```

### wolfpack_posts (`/lib/database/wolfpack_posts.ts`)

```typescript
// ✅ Typed operations
const post: WolfpackVideo = await createPost({
  title: "My Video",
  video_url: "https://...",
  // TypeScript ensures all required fields
})
```

## ⚛️ React Hooks

### usewolfpack_comments Hook

```typescript
function Mywolfpack_commentsComponent({ postId }: { postId: string }) {
  const {
    wolfpack_comments,
    loading,
    error,
    addComment,
    editComment,
    removeComment,
    commentCount
  } = usewolfpack_comments(postId)

  const handleAddComment = async (content: string) => {
    try {
      await addComment(content)
      // wolfpack_comments automatically updated!
    } catch (error) {
      // Handle error
    }
  }

  return (
    <div>
      {wolfpack_comments.map(comment => (
        <div key={comment.id}>
          {comment.content}
          {comment.user?.display_name}
        </div>
      ))}
    </div>
  )
}
```

### useLikes Hook

```typescript
function LikeButton({ postId }: { postId: string }) {
  const {
    liked,
    likeCount,
    loading,
    toggleLike,
    recentLikers
  } = useLikes(postId)

  return (
    <button 
      onClick={toggleLike}
      disabled={loading}
    >
      {liked ? '❤️' : '🤍'} {likeCount}
    </button>
  )
}
```

### usewolfpack_posts Hook

```typescript
function FeedComponent() {
  const {
    wolfpack_posts,
    loading,
    hasMore,
    loadMore,
    createNewPost
  } = useFeedwolfpack_posts(20)

  return (
    <div>
      {wolfpack_posts.map(post => (
        <VideoCard key={post.id} post={post} />
      ))}
      {hasMore && (
        <button onClick={loadMore}>Load More</button>
      )}
    </div>
  )
}
```

## 🔄 Real-time Sync

### Real-time wolfpack_comments

```typescript
import { useRealtimewolfpack_comments } from '@/hooks/useRealtimeSync'

function wolfpack_commentsSection({ postId }: { postId: string }) {
  const { wolfpack_comments, addComment } = usewolfpack_comments(postId)

  // Automatically sync new wolfpack_comments in real-time
  useRealtimewolfpack_comments(
    postId,
    (newComment) => {
      // Real-time comment appears instantly
      console.log('New comment received:', newComment)
    }
  )

  return (
    // Component renders with real-time updates
    <div>{/* ... */}</div>
  )
}
```

### Real-time Likes

```typescript
import { useRealtimeLikes } from '@/hooks/useRealtimeSync'

function LikeCounter({ postId }: { postId: string }) {
  const { liked, likeCount } = useLikes(postId)

  // Automatically sync like changes
  useRealtimeLikes(
    postId,
    (liked, newCount) => {
      console.log('Like count updated:', newCount)
    }
  )

  return <span>{likeCount} likes</span>
}
```

## 🔄 Migration Guide

### From Old System to New System

#### 1. Replace Direct Supabase Calls

❌ **Old Way:**
```typescript
// Risky: Direct supabase calls without typing
const { data } = await supabase
  .from('wolfpack_comments')
  .select('*')
  .eq('video_id', postId) // ❌ Wrong column name!
```

✅ **New Way:**
```typescript
// Safe: Typed function with correct schema
import { getwolfpack_commentsForPost } from '@/lib/database/wolfpack_comments'

const wolfpack_comments = await getwolfpack_commentsForPost(postId) // ✅ Typed & correct
```

#### 2. Replace Custom Hooks

❌ **Old Way:**
```typescript
// Custom implementation with potential inconsistencies
const [wolfpack_comments, setwolfpack_comments] = useState([])
const [loading, setLoading] = useState(true)

useEffect(() => {
  // Manual fetching logic
}, [])
```

✅ **New Way:**
```typescript
// Standardized hook with proper error handling
const { wolfpack_comments, loading, addComment } = usewolfpack_comments(postId)
```

#### 3. Replace Manual Real-time Setup

❌ **Old Way:**
```typescript
// Manual subscription management
useEffect(() => {
  const subscription = supabase
    .channel('wolfpack_comments')
    .on('postgres_changes', ...)
    .subscribe()
  
  return () => supabase.removeChannel(subscription)
}, [])
```

✅ **New Way:**
```typescript
// Automatic real-time sync
useRealtimewolfpack_comments(postId, onNewComment)
```

## 🎯 Best Practices

### 1. Always Use TypeScript Types

```typescript
// ✅ Use generated types
type Comment = Database['public']['Tables']['wolfpack_comments']['Row']

// ❌ Don't define custom interfaces that might drift
interface Comment { /* ... */ }
```

### 2. Use Database Helper Functions

```typescript
// ✅ Use helper functions
import { createComment } from '@/lib/database/wolfpack_comments'
await createComment(postId, content)

// ❌ Don't make direct calls
await supabase.from('wolfpack_comments').insert({ /* ... */ })
```

### 3. Handle Errors Properly

```typescript
try {
  await addComment(content)
  toast.success('Comment added!')
} catch (error) {
  console.error('Comment error:', error)
  toast.error('Failed to add comment')
}
```

### 4. Use Optimistic Updates

The hooks automatically handle optimistic updates:

```typescript
// When you call toggleLike(), the UI updates immediately
// Then syncs with the server
const { toggleLike } = useLikes(postId)
await toggleLike() // UI updates instantly, then confirms with server
```

## 🛠️ Validation & Testing

### Check Database Sync

```bash
# Validate that frontend matches database
npm run db:check
```

This script verifies:
- ✅ All required tables exist
- ✅ Column names match your code
- ✅ RPC functions are accessible
- ✅ TypeScript types are up to date

### Update Types Before Development

```bash
# Always run before coding
npm run types:generate
npm run db:check
```

### Pre-deployment Checklist

```bash
# Run this before every deployment
npm run db:sync  # Generates types + validates sync
npm run type-check  # Validates TypeScript
npm run lint  # Code quality check
```

## 🚨 Troubleshooting

### Common Issues & Solutions

#### 1. "Table 'wolfpack_comments' does not exist"

**Solution:** Check your migrations
```bash
npx supabase status
npx supabase db push
```

#### 2. "Column 'video_id' does not exist"

**Solution:** Use correct column names
- ✅ `video_id` (not `video_id`)
- ✅ `wolfpack_post_likes` (not `wolfpack_post_likes`)

#### 3. TypeScript Errors

**Solution:** Regenerate types
```bash
npm run types:generate
```

#### 4. Real-time Not Working

**Solution:** Check subscriptions
```typescript
// Make sure you're using the hooks correctly
useRealtimewolfpack_comments(postId, onNewComment) // ✅

// Not creating manual subscriptions
const subscription = supabase.channel(...) // ❌
```

#### 5. Duplicate Data

**Solution:** Use the validation script
```bash
npm run db:check
```

The script will identify schema mismatches that cause duplicates.

## 📊 Performance Tips

### 1. Use Pagination

```typescript
const { wolfpack_posts, loadMore, hasMore } = useFeedwolfpack_posts(20) // Load 20 at a time
```

### 2. Optimize Real-time Subscriptions

```typescript
// Only subscribe when component is visible
useRealtimewolfpack_comments(
  postId,
  onNewComment,
  undefined,
  undefined,
  isVisible // enabled flag
)
```

### 3. Cache Queries

The hooks automatically cache data and avoid unnecessary refetches.

## 🎉 Success Metrics

You'll know the sync system is working when:

- ✅ **No TypeScript errors** in database operations
- ✅ **No duplicate data** in your database
- ✅ **Real-time updates** work seamlessly
- ✅ **Consistent data** across all components
- ✅ **Fast development** with autocomplete and type safety

## 🔗 Related Files

- `/lib/supabase/client.ts` - Typed Supabase client
- `/lib/database/*.ts` - Database helper functions
- `/hooks/use*.ts` - React hooks for data fetching
- `/hooks/useRealtimeSync.ts` - Real-time synchronization
- `/types/database.types.ts` - Generated TypeScript types
- `/scripts/check-database-sync.js` - Validation script

---

**Remember:** Always run `npm run db:sync` before development to ensure your frontend stays in perfect sync with Supabase! 🚀