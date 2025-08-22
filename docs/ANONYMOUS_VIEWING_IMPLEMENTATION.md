# Anonymous Viewing with Protected Interactions

## Overview
This implementation provides a seamless user experience where:
- ✅ **Anyone can view** the feed without logging in
- ✅ **Video stats** (views, likes, content_comments) are visible to all
- ✅ **User profiles** show basic info publicly
- 🔒 **Liking** requires authentication
- 🔒 **Commenting** requires authentication  
- 🔒 **Posting** requires authentication
- 🔒 **Following** requires authentication
- ✅ **Sharing** can be done without auth

## New Components Created

### 1. `InteractionButton` Component
Located: `/components/auth/InteractionButton.tsx`

**Purpose**: Handles interactions that may require authentication with smooth UX.

**Features**:
- Directly redirects unauthenticated users to `/login` page
- Stores current path for post-login redirect
- Seamless authentication flow
- Optimistic updates for better UX

**Usage**:
```tsx
<InteractionButton
  onInteract={handleLike}
  requiresAuth={true}
  className="flex items-center space-x-2"
>
  <Heart className="w-5 h-5" />
  Like
</InteractionButton>
```

**Behavior**: When a non-authenticated user clicks this button, they are immediately redirected to `/login`. After successful login, they return to their original page.

### 2. `AuthGate` Component
Located: `/components/auth/AuthGate.tsx`

**Purpose**: Wraps content that requires authentication with fallback UI.

**Features**:
- Shows fallback UI for anonymous users
- Customizable auth prompts
- Loading states
- Easy to implement

**Usage**:
```tsx
<AuthGate message="Sign in to create posts">
  <CreatePostForm />
</AuthGate>
```

### 3. `useProtectedAction` Hook
Located: `/hooks/useProtectedAction.ts`

**Purpose**: Programmatically handle protected actions.

**Usage**:
```tsx
const { executeAction } = useProtectedAction();

const handleAction = () => {
  executeAction(
    async () => {
      // Your protected action
      await likePost(postId);
    },
    { 
      requiresAuth: true 
    }
  );
};
```

### 4. `VideoInteractionButtons` Component
Located: `/components/wolfpack/feed/VideoInteractionButtons.tsx`

**Purpose**: TikTok-style interaction buttons with authentication handling.

**Features**:
- Like, comment, share, and more options
- Proper authentication flow
- Optimistic updates
- Consistent styling

### 5. Anonymous-Friendly Feed Pattern

**Purpose**: Feed implementations that work for both anonymous and authenticated users.

**Note**: The specific `AnonymousFriendlyFeed` component has been removed as it was inconsistent with the project architecture. Use existing feed components with proper authentication handling instead.

### 6. `WolfpackFeedServiceEnhanced` Service
Located: `/lib/services/wolfpack/feed-enhanced.ts`

**Purpose**: Backend service layer that handles both anonymous and authenticated requests.

**Features**:
- `fetchPublicFeed()` - No auth required
- `fetchAuthenticatedFeed()` - Includes user-specific data
- `fetchFeed()` - Smart dispatcher
- Like/share/follow functionality

## Implementation Steps

### 1. Update Your Existing Feed Component

Replace your current feed component with the new pattern:

```tsx
// Use existing feed components with proper authentication handling
import { TikTokStyleFeed } from '@/components/wolfpack/feed/TikTokStyleFeed';
import { WolfpackService } from '@/lib/services/wolfpack';
import { useAuth } from '@/contexts/AuthContext';

export default function WolfpackFeedPage() {
  const { user } = useAuth();
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadFeed();
  }, [user]);

  const loadFeed = async () => {
    try {
      const result = await WolfpackService.feed.fetchFeedItems({
        userId: user?.id,
        limit: 20
      });
      if (result.success) {
        setVideos(result.data);
      }
    } catch (error) {
      console.error('Failed to load feed:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div>Loading...</div>;

  return (
    <TikTokStyleFeed 
      content_posts={videos}
      currentUser={user}
      onLike={handleLike}
      onComment={handleComment}
      onShare={handleShare}
      onFollow={handleFollow}
    />
  );
}
```

### 2. Update Your Database RLS Policies

Ensure your Row Level Security policies allow anonymous SELECT operations:

```sql
-- Allow anonymous users to view posts
CREATE POLICY "Posts are viewable by everyone" ON content_posts
  FOR SELECT USING (true);

-- Allow anonymous users to view public user data
CREATE POLICY "User profiles are viewable by everyone" ON users
  FOR SELECT USING (true);

-- Protect write operations
CREATE POLICY "Only authenticated users can like" ON wolfpack_post_likes
  FOR ALL USING (auth.uid() IS NOT NULL);

CREATE POLICY "Only authenticated users can comment" ON content_comments
  FOR ALL USING (auth.uid() IS NOT NULL);
```

### 3. Update Your Existing Components

Replace direct interaction buttons with the new `InteractionButton`:

```tsx
// Old way
<button onClick={handleLike}>
  <Heart /> Like
</button>

// New way
<InteractionButton
  onInteract={handleLike}
  requiresAuth={true}
  authMessage="Sign in to like posts!"
>
  <Heart /> Like
</InteractionButton>
```

### 4. Wrap Protected Features

Use `AuthGate` for features that require authentication:

```tsx
// Protected post creation
<AuthGate message="Sign in to share your content!">
  <PostCreator />
</AuthGate>

// Protected messaging
<AuthGate message="Sign in to send messages!">
  <MessageThread />
</AuthGate>
```

## Benefits

1. **Better SEO**: Anonymous users can view content, improving search engine indexing
2. **Lower Barrier to Entry**: Users can explore before committing to sign up
3. **Smooth Conversion**: Clear, contextual prompts encourage sign-ups
4. **Better UX**: No jarring redirects or blocked content
5. **Social Proof**: View counts and engagement visible to everyone
6. **Viral Potential**: Easy sharing without authentication

## Database Changes Required

You may need to create these tables if they don't exist:

```sql
-- User follows table
CREATE TABLE user_follows (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  follower_id UUID REFERENCES users(id) ON DELETE CASCADE,
  following_id UUID REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(follower_id, following_id)
);

-- Shares tracking (optional)
CREATE TABLE wolfpack_shares (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  video_id UUID REFERENCES content_posts(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  shared_at TIMESTAMPTZ DEFAULT NOW(),
  share_type TEXT DEFAULT 'link' -- 'link', 'social', etc.
);
```

## Migration Path

1. **Phase 1**: Deploy the new components alongside existing ones
2. **Phase 2**: Update one page at a time to use the new pattern
3. **Phase 3**: Remove old authentication-blocking components
4. **Phase 4**: Update RLS policies to allow anonymous viewing
5. **Phase 5**: Monitor analytics for conversion improvements

Your authentication system is already excellent - these components just enhance it with a better anonymous user experience while maintaining all security measures!