# Database Types Usage Guide

## Overview
This guide explains how to properly use database types throughout the application.

## Type Files

### Core Type Files
- `/types/database.types.ts` - Auto-generated Supabase types (DO NOT EDIT)
- `/types/database-models.ts` - Clean type exports from database.types.ts
- `/types/index.ts` - Central export point for all types
- `/types/features/wolfpack-interfaces.ts` - Interface types for Wolfpack features

## How to Import Types

### Recommended Import Pattern
```typescript
// Import from central index for all database types
import type { 
  User,
  UserProfile,
  WolfpackVideo,
  WolfpackComment,
  UserWithProfile,
  FeedItem 
} from '@/types';

// Or import directly from database-models
import type { User, WolfpackVideo } from '@/types/database-models';
```

### Service Layer Types
```typescript
// Services extend base types with computed fields
import type { WolfpackVideo, WolfpackComment } from '@/lib/services/unified-wolfpack.service';
```

## Type Definitions

### User Types
```typescript
// Core user from users table
interface User {
  id: string;
  email: string;
  first_name?: string;
  last_name?: string;
  role: 'user' | 'admin';
  auth_id?: string;
  phone?: string;
  profile_image_url?: string;
  account_status: 'active' | 'inactive' | 'suspended' | 'deleted';
  created_at: string;
  updated_at: string;
}

// User with all related data
interface UserWithProfile extends User {
  profile?: UserProfile;      // from user_profiles table
  membership?: WolfpackMembership;  // from memberships table
  location?: UserLocation;    // from user_locations table
  activity?: UserActivityStatus;  // from user_activity_status table
}
```

### Content Types
```typescript
// Video content
interface WolfpackVideo {
  id: string;
  user_id: string;
  video_url?: string;
  thumbnail_url?: string;
  caption?: string;
  likes_count: number;
  comments_count: number;
  views_count: number;
  // ... other fields
}

// Post content
interface WolfpackPost {
  id: string;
  user_id: string;
  content?: string;
  media_url?: string;
  media_type?: 'image' | 'video' | 'text';
  // ... other fields
}

// Combined content type for feeds
type WolfpackContent = 
  | (WolfpackVideo & { content_type: 'video' })
  | (WolfpackPost & { content_type: 'post' });
```

### Feed Types
```typescript
interface FeedItem {
  content: WolfpackContent;  // Either video or post
  user: UserWithProfile;     // Full user data
  user_liked?: boolean;       // Computed field
  user_saved?: boolean;       // Computed field
}
```

## Database Operations

### Insert Types
```typescript
import type { UserInsert, WolfpackVideoInsert } from '@/types';

const newUser: UserInsert = {
  email: 'user@example.com',
  role: 'user',
  account_status: 'active'
  // Optional fields can be omitted
};

const newVideo: WolfpackVideoInsert = {
  user_id: 'uuid',
  caption: 'My video',
  // Required fields must be provided
};
```

### Update Types
```typescript
import type { UserUpdate, WolfpackVideoUpdate } from '@/types';

const userUpdate: UserUpdate = {
  first_name: 'John',
  last_name: 'Doe'
  // Only include fields to update
};
```

## Service Layer Extensions

Services may extend base types with additional computed fields:

```typescript
// In services, videos might include user data
interface EnrichedVideo extends WolfpackVideo {
  user?: Partial<User>;  // User who created the video
  user_liked?: boolean;  // Did current user like this?
}
```

## Best Practices

1. **Always use type imports**: `import type { ... }` to avoid runtime overhead
2. **Import from central index**: Use `@/types` for consistency
3. **Use base types from database-models**: For database operations
4. **Use service types for UI**: When displaying data with computed fields
5. **Never modify database.types.ts**: It's auto-generated

## Common Patterns

### Fetching user with profile
```typescript
const { data: user } = await supabase
  .from('users')
  .select(`
    *,
    profile:user_profiles(*),
    membership:memberships(*),
    location:user_locations(*),
    activity:user_activity_status(*)
  `)
  .eq('id', userId)
  .single();

// Type assertion
const typedUser = user as UserWithProfile;
```

### Working with feed items
```typescript
const { data: videos } = await supabase
  .from('content_posts')  // New clean table name
  .select(`
    *,
    user:users(*)
  `);

// Transform to feed items
const feedItems: FeedItem[] = videos.map(video => ({
  content: { ...video, content_type: 'video' },
  user: video.user,
  user_liked: false // Set based on likes check
}));
```

### Working with reactions/likes
```typescript
const { data: reactions } = await supabase
  .from('content_reactions')  // New clean table name
  .select('*')
  .eq('content_id', videoId)
  .eq('content_type', 'video')
  .eq('reaction', 'like');
```

### Working with comments  
```typescript
const { data: comments } = await supabase
  .from('content_comments')  // New clean table name
  .select(`
    *,
    user:users(id, first_name, last_name, avatar_url)
  `)
  .eq('video_id', videoId);
```

### Working with follows
```typescript
const { data: follows } = await supabase
  .from('social_follows')  // New clean table name
  .select('*')
  .eq('follower_id', userId);
```

## Migration Notes

If you see old type patterns like:
- `Database["public"]["Tables"]["users"]["Row"]` - Replace with `User`
- Custom interface definitions - Use types from `@/types/database-models`
- Duplicate type definitions - Consolidate to use central types

## Type Safety Tips

1. Use strict null checks
2. Handle optional fields appropriately
3. Use type guards for union types
4. Validate data at runtime when needed

## Questions?

If you need to:
- Add new computed fields → Extend base types in services
- Add new database fields → Update database schema, regenerate types
- Fix type errors → Check this guide first, then ask for help