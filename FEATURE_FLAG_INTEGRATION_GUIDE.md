# Feature Flag Integration Guide 🎛️

## 🎯 Complete Integration Overview

Your new feature flag system perfectly complements the new user fixes we just implemented. Here's how everything works together:

## 📁 New Files Created

### 1. **Feature Flags Service**
- **File**: `lib/services/feature-flags.service.ts`
- **Purpose**: Centralized service with caching and error handling
- **Features**: Single/multiple flag checks, admin controls, caching

### 2. **React Hooks**
- **File**: `hooks/useFeatureFlag.ts`
- **Purpose**: Easy React integration with loading states
- **Hooks**: `useFeatureFlag`, `useMultipleFeatureFlags`, `useAuthenticatedFeature`

### 3. **Updated Components**
- **PostCreator**: Now checks `wolfpack_video_upload` before allowing uploads
- **Videowolfpack_comments**: Checks `wolfpack_comments` and `wolfpack_post_likes` features

## 🚀 How to Use Feature Flags in Your App

### Basic Feature Check
```typescript
import { useFeatureFlag } from '@/lib/hooks/useFeatureFlag';
import { FEATURE_FLAGS } from '@/lib/services/feature-flags.service';

function MyComponent() {
  const { enabled, loading, error } = useFeatureFlag(FEATURE_FLAGS.WOLFPACK_VIDEO_UPLOAD);
  
  if (loading) return <div>Checking permissions...</div>;
  if (!enabled) return <div>Feature not available</div>;
  
  return <VideoUploadButton />;
}
```

### Multiple Features
```typescript
import { useMultipleFeatureFlags } from '@/lib/hooks/useFeatureFlag';

function SocialComponent() {
  const { features, loading } = useMultipleFeatureFlags([
    FEATURE_FLAGS.wolfpack_comments,
    FEATURE_FLAGS.WOLFPACK_POST_LIKES,
    FEATURE_FLAGS.WOLFPACK_FOLLOWING
  ]);
  
  if (loading) return <div>Loading...</div>;
  
  return (
    <div>
      {features[FEATURE_FLAGS.wolfpack_comments]?.enabled && <wolfpack_commentsSection />}
      {features[FEATURE_FLAGS.WOLFPACK_POST_LIKES]?.enabled && <LikeButton />}
      {features[FEATURE_FLAGS.WOLFPACK_FOLLOWING]?.enabled && <FollowButton />}
    </div>
  );
}
```

### Authentication + Feature Check
```typescript
import { useAuthenticatedFeature } from '@/lib/hooks/useFeatureFlag';

function PostCreator() {
  const { hasAccess, loading, error, user } = useAuthenticatedFeature(
    FEATURE_FLAGS.WOLFPACK_VIDEO_UPLOAD
  );
  
  if (loading) return <div>Checking access...</div>;
  if (!hasAccess) return <div>Please sign in and verify permissions</div>;
  
  return <FullPostCreatorInterface />;
}
```

### Simple Boolean Check
```typescript
import { useFeatureAccess } from '@/lib/hooks/useFeatureFlag';

function MenuItem() {
  const canUpload = useFeatureAccess(FEATURE_FLAGS.WOLFPACK_VIDEO_UPLOAD);
  
  return (
    <nav>
      <Link href="/feed">Feed</Link>
      {canUpload && <Link href="/create">Create Post</Link>}
      <Link href="/profile">Profile</Link>
    </nav>
  );
}
```

## 🛠️ Available Feature Flags

### Video System
- `WOLFPACK_VIDEO_UPLOAD` - Upload wolfpack_videos/photos
- `WOLFPACK_FOR_YOU_ALGORITHM` - Personalized feed

### Social Features  
- `WOLFPACK_FOLLOWING` - Follow/unfollow users
- `WOLFPACK_DM_SYSTEM` - Direct messaging
- `WOLFPACK_CHAT_ROOMS` - Chat rooms
- `wolfpack_comments` - Comment on posts
- `WOLFPACK_POST_LIKES` - Like posts/wolfpack_comments

### Role-Specific Features
- `DJ_BROADCAST_SYSTEM` - DJ broadcasting tools
- `DJ_EVENT_MANAGEMENT` - Event creation/management  
- `DJ_DASHBOARD` - DJ control panel
- `BARTENDER_ORDER_MANAGEMENT` - Order management
- `ADMIN_MODERATION_TOOLS` - Content moderation
- `ADMIN_ANALYTICS_DASHBOARD` - Analytics

### Location Features
- `LOCATION_BASED_CONTENT` - Location-aware content
- `LOCATION_VERIFICATION` - Location verification

## 🔧 Admin Controls

### Toggle Features for Testing
```typescript
import { useFeatureFlagAdmin } from '@/lib/hooks/useFeatureFlag';

function AdminPanel() {
  const { flags, toggleFeature, loading } = useFeatureFlagAdmin();
  
  const handleToggle = async (flagName: string, enabled: boolean) => {
    const result = await toggleFeature(flagName, enabled);
    if (result.success) {
      toast.success(`${flagName} ${enabled ? 'enabled' : 'disabled'}`);
    }
  };
  
  return (
    <div>
      {flags.map(flag => (
        <div key={flag.flag_name}>
          <span>{flag.flag_name}</span>
          <switch 
            checked={flag.is_enabled}
            onChange={(e) => handleToggle(flag.flag_name, e.target.checked)}
          />
        </div>
      ))}
    </div>
  );
}
```

### Direct API Usage (Advanced)
```typescript
import { featureFlagsService } from '@/lib/services/feature-flags.service';

// Check feature programmatically
const result = await featureFlagsService.checkFeatureAccess(
  'wolfpack_video_upload', 
 conversationid
);

// Toggle feature (admin only)
await featureFlagsService.toggleFeatureForTesting(
  'wolfpack_video_upload', 
  false
);
```

## 🔄 Integration with New User Fixes

The feature flag system works seamlessly with our new user fixes:

### 1. **Profile Creation Flow**
```typescript
// When new users sign up:
// 1. Database trigger creates user profile
// 2. Feature flags check user role/permissions  
// 3. Features are enabled/disabled based on user status
// 4. Frontend gets immediate access without page refresh
```

### 2. **Post Creation Flow**
```typescript
function PostCreator() {
  // 1. Check if user can upload (feature flag + auth)
  const { hasAccess, user } = useAuthenticatedFeature(FEATURE_FLAGS.WOLFPACK_VIDEO_UPLOAD);
  
  // 2. Handle new users (from our previous fix)
  const handlePost = async () => {
    let userDbId = user?.id || await getUserIdFromAuth();
    // ... rest of posting logic
  };
  
  if (!hasAccess) return <FeatureDisabledMessage />;
  return <PostCreatorInterface />;
}
```

### 3. **Comment System Flow**
```typescript
function wolfpack_comments() {
  // Check if wolfpack_comments are enabled
  const { enabled: wolfpack_commentsEnabled } = useFeatureFlag(FEATURE_FLAGS.wolfpack_comments);
  
  // Handle new user commenting (from our previous fix)
  const handleComment = async () => {
    let userDbId = user?.id || await getUserIdFromAuth();
    // ... rest of comment logic
  };
  
  if (!wolfpack_commentsEnabled) return <div>wolfpack_comments temporarily disabled</div>;
  return <CommentInterface />;
}
```

## 📊 Performance Optimizations

### 1. **Caching Strategy**
- Feature flag results cached for 5 minutes
- Automatic cache invalidation when features are toggled
- User-specific caching prevents cross-user contamination

### 2. **Batch Loading**
```typescript
// Good: Load multiple features at once
const { features } = useMultipleFeatureFlags([
  'feature1', 'feature2', 'feature3'
]);

// Avoid: Multiple individual calls
const feature1 = useFeatureFlag('feature1');
const feature2 = useFeatureFlag('feature2');
const feature3 = useFeatureFlag('feature3');
```

### 3. **Conditional Loading**
```typescript
// Only check features when user is authenticated
const { hasAccess } = useAuthenticatedFeature('feature_name');
```

## 🧪 Testing Scenarios

### A/B Testing
```typescript
// Enable feature for 50% of users
await supabase.rpc('toggle_feature_for_testing', {
  p_flag_name: 'wolfpack_new_ui',
  p_enabled: true  // Enable for specific user roles/criteria
});
```

### Gradual Rollout
```typescript
// 1. Enable for admins first
// 2. Enable for VIPs
// 3. Enable for all users
// Each step can be controlled via the dashboard
```

### Feature Kill Switch
```typescript
// Instantly disable problematic features
await featureFlagsService.toggleFeatureForTesting('problematic_feature', false);
// All users immediately lose access
```

## 🔍 Debugging & Monitoring

### Check Cache Status
```typescript
const cacheStats = featureFlagsService.getCacheStats();
console.log('Cache size:', cacheStats.size);
console.log('Cached keys:', cacheStats.keys);
```

### Clear Cache
```typescript
// Clear specific feature cache
featureFlagsService.clearFeatureCache('wolfpack_video_upload');

// Clear all cache
featureFlagsService.clearAllCache();
```

### Error Handling
```typescript
const { enabled, error } = useFeatureFlag('some_feature');
if (error) {
  console.error('Feature check failed:', error);
  // Graceful degradation - features default to disabled
}
```

## 🚀 Next Steps

1. **Deploy the RLS fixes** (from previous migrations)
2. **Test new user flow** with feature flags
3. **Start using feature flags** for new features
4. **Create admin dashboard** for feature management
5. **Monitor performance** and cache hit rates

## 🎯 Best Practices

### 1. **Always Create Flags First**
```typescript
// 1. Create feature flag in database
// 2. Build the feature
// 3. Test with flag disabled/enabled
// 4. Gradually roll out
```

### 2. **Use TypeScript Constants**
```typescript
// Use FEATURE_FLAGS constants for type safety
import { FEATURE_FLAGS } from '@/lib/services/feature-flags.service';
const { enabled } = useFeatureFlag(FEATURE_FLAGS.WOLFPACK_VIDEO_UPLOAD);
```

### 3. **Graceful Degradation**
```typescript
// Always provide fallbacks when features are disabled
if (!videoUploadEnabled) {
  return <div>Video uploads temporarily unavailable</div>;
}
```

### 4. **Loading States**
```typescript
// Handle loading states properly
const { enabled, loading } = useFeatureFlag('feature_name');
if (loading) return <Spinner />;
```

Your feature flag system is now fully integrated with the new user fixes! 🎉

New users can sign up and immediately access features based on their permissions, with proper fallbacks and error handling throughout the entire flow.