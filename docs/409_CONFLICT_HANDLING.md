# 🚨 409 Conflict Error Handling Guide

## The Problem

When users try to like a post they've already liked, Supabase returns a **409 Conflict** error due to the unique constraint on `(video_id, user_id)` in the `wolfpack_post_likes` table.

### Schema Details
```sql
-- Unique constraint that causes 409 errors
CONSTRAINT wolfpack__video_id_user_id_key 
UNIQUE (video_id, user_id)
```

## ✅ **Fixed Implementation**

### 1. Enhanced Error Handling in `togglePostLike()`

```typescript
// lib/database/likes.ts
if (insertError) {
  const errorMessage = insertError.message?.toLowerCase() || ''
  const isUniqueConstraintError = 
    insertError.code === '23505' ||                    // PostgreSQL unique violation
    errorMessage.includes('409') ||                    // HTTP 409 Conflict  
    errorMessage.includes('duplicate') ||              // Duplicate key
    errorMessage.includes('unique') ||                 // Unique constraint
    errorMessage.includes('wolfpack__video_id_user_id_key') // Specific constraint

  if (isUniqueConstraintError) {
    console.log('User already liked this post (409 Conflict handled)')
    liked = true  // Treat as successful like
  } else {
    throw new Error(`Failed to add like: ${insertError.message}`)
  }
}
```

### 2. Updated Service Layer

```typescript
// lib/services/wolfpack-social.service.ts
async toggleLike(videoId: string,conversationid: string) {
  try {
    const result = await togglePostLike(videoId);
    return { success: true, liked: result.liked };
  } catch (error) {
    const errorMessage = error?.message?.toLowerCase() || ''
    if (errorMessage.includes('409') || errorMessage.includes('duplicate')) {
      console.log('Handling 409 Conflict - user already liked')
      return { success: true, liked: true };
    }
    return { success: false, liked: false };
  }
}
```

## 🔄 **Alternative Approaches**

### Option 1: Upsert Pattern
```typescript
// Use upsert to avoid conflicts entirely
const { error } = await supabase
  .from('wolfpack_post_likes')
  .upsert(
    { video_id: postId, user_id: user.id },
    { onConflict: 'video_id,user_id', ignoreDuplicates: false }
  )
```

### Option 2: RPC Function (Recommended)
```sql
-- Create in Supabase SQL Editor
CREATE OR REPLACE FUNCTION toggle_post_like(p_video_id uuid, p_user_id uuid)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  like_exists boolean;
  like_count_result integer;
BEGIN
  SELECT EXISTS(
    SELECT 1 FROM wolfpack_post_likes 
    WHERE video_id = p_video_id AND user_id = p_user_id
  ) INTO like_exists;
  
  IF like_exists THEN
    DELETE FROM wolfpack_post_likes 
    WHERE video_id = p_video_id AND user_id = p_user_id;
    liked := false;
  ELSE
    INSERT INTO wolfpack_post_likes (video_id, user_id) 
    VALUES (p_video_id, p_user_id)
    ON CONFLICT (video_id, user_id) DO NOTHING;
    liked := true;
  END IF;
  
  SELECT COUNT(*) INTO like_count_result
  FROM wolfpack_post_likes WHERE video_id = p_video_id;
  
  RETURN json_build_object('liked', liked, 'like_count', like_count_result);
END;
$$;
```

## 🧪 **Testing 409 Handling**

### Manual Test
```typescript
// This should handle 409 gracefully
const testLike = async () => {
  const postId = 'some-post-id'
  
  // Like once
  const result1 = await togglePostLike(postId)
  console.log('First like:', result1) // { liked: true, likeCount: 1 }
  
  // Try to like again (should handle 409)
  const result2 = await togglePostLike(postId) 
  console.log('Second like:', result2) // { liked: false, likeCount: 0 } (unlike)
  
  // Like again
  const result3 = await togglePostLike(postId)
  console.log('Third like:', result3) // { liked: true, likeCount: 1 }
}
```

### React Component Test
```typescript
function LikeButton({ postId }: { postId: string }) {
  const { liked, likeCount, toggleLike } = useLikes(postId)
  
  const handleLike = async () => {
    try {
      await toggleLike() // Should handle 409 internally
      // UI updates automatically via hook
    } catch (error) {
      console.error('Like failed:', error)
      // Show error toast
    }
  }
  
  return (
    <button onClick={handleLike}>
      {liked ? '❤️' : '🤍'} {likeCount}
    </button>
  )
}
```

## 🛡️ **Error Types to Handle**

| Error Type | Code | Message Contains | Action |
|------------|------|------------------|--------|
| PostgreSQL Unique | `23505` | `duplicate key` | Treat as already liked |
| HTTP Conflict | - | `409` | Treat as already liked |
| Supabase Unique | - | `unique constraint` | Treat as already liked |
| Constraint Name | - | `wolfpack__video_id_user_id_key` | Treat as already liked |

## 📊 **Monitoring & Debugging**

### Console Logs
```typescript
// Look for these in browser console
✅ "User already liked this post (409 Conflict handled)"
✅ "Handling 409 Conflict - user already liked"
❌ "Error toggling like: [actual error]"
```

### Network Tab
- **409 responses**: Should be caught and handled gracefully
- **Successful requests**: Should return proper like state
- **No endless retry loops**: UI should not spam requests

## 🎯 **Best Practices**

1. **Always handle 409 Conflicts** - Don't let them crash the UI
2. **Use optimistic updates** - Update UI immediately, handle errors later
3. **Provide user feedback** - Show loading states and error messages
4. **Consider race conditions** - Multiple rapid clicks should be debounced
5. **Log for debugging** - But don't spam console in production

## ✅ **Success Indicators**

Your 409 handling is working when:
- ✅ Users can rapid-click like buttons without errors
- ✅ Like counts are accurate after conflicts
- ✅ No 409 errors appear in user-facing error messages
- ✅ Console shows proper conflict handling logs
- ✅ UI remains responsive during conflicts

Run `npm run db:check` to validate your 409 conflict handling is properly implemented! 🚀