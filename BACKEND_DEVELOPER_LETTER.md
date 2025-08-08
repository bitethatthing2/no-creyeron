# Letter to Backend Development Team

## Subject: Wolf Pack Platform Schema Requirements - Salem & Portland Creative Community Hub

Dear Backend Development Team,

We have developed a comprehensive social platform called **Wolf Pack** that serves as a creative and business collaboration hub for Salem and Portland communities. This is a TikTok-style video sharing platform with expanded categories designed to unite local businesses, artists, events, and community activities.

## Platform Overview

Wolf Pack is a vertical video feed platform similar to TikTok, but specifically designed for the Pacific Northwest creative community. Our mission is to connect local businesses, artists, musicians, event organizers, and community members in Salem and Portland, creating a unified ecosystem where "we are strong together."

## Current Frontend Implementation

### Video Feed Categories (Horizontal Slider Menu)
We have implemented 11 distinct content categories:

1. **LIVE** - Live streaming events and real-time content
2. **For You** - Personalized algorithm-driven content
3. **Following** - Content from followed users/businesses
4. **Festivals** - Local festivals and fairs (Waterfront Blues Festival, etc.)
5. **Food & Wine** - Culinary events, wine tastings, restaurant content
6. **Arts & Culture** - Local art exhibitions, cultural events, creative showcases
7. **Sports** - Sporting events, local teams, athletic activities
8. **Community** - Community meetings, local government, neighborhood events
9. **Family** - Family-friendly activities and events
10. **Music** - Live music, concerts, local bands, music festivals
11. **Markets** - Saturday Market, farmers markets, local vendors

### Key Features Currently Implemented
- TikTok-style vertical video scrolling
- Location-based content (Salem/Portland)
- User profiles with verification badges
- wolfpack_comments system
- Like/reaction system
- Share functionality
- Bookmark system
- Upload capabilities (photo/video)
- Real-time notifications
- Music attribution
- Hashtag system
- Location badges

## Required Database Schema

We need a comprehensive database schema that supports the following data structures:

### 1. Users Table
```sql
users (
  id: UUID PRIMARY KEY,
  email: VARCHAR UNIQUE,
  first_name: VARCHAR,
  last_name: VARCHAR,
  display_name: VARCHAR,
  username: VARCHAR UNIQUE,
  avatar_url: VARCHAR,
  is_wolfpack_member: BOOLEAN,
  wolfpack_bio: TEXT,
  verified: BOOLEAN,
  occupation: VARCHAR,
  location: ENUM('salem', 'portland'),
  business_account: BOOLEAN,
  artist_account: BOOLEAN,
  created_at: TIMESTAMP,
  updated_at: TIMESTAMP
)
```

### 2. Wolf Pack wolfpack_posts Table
```sql
wolfpack_videos (
  id: UUID PRIMARY KEY,
  author_id: UUID REFERENCES users(id),
  content: TEXT,
  media_urls: TEXT[],
  media_type: ENUM('image', 'video', 'text'),
  category: ENUM('live', 'for_you', 'following', 'festivals', 'food_wine', 'arts_culture', 'sports', 'community', 'family', 'music', 'markets'),
  location: ENUM('salem', 'portland'),
  visibility: ENUM('public', 'followers', 'private'),
  tags: TEXT[],
  music_title: VARCHAR,
  music_artist: VARCHAR,
  reaction_counts: JSONB,
  comment_count: INTEGER DEFAULT 0,
  share_count: INTEGER DEFAULT 0,
  view_count: INTEGER DEFAULT 0,
  is_live: BOOLEAN DEFAULT FALSE,
  live_stream_url: VARCHAR,
  event_date: TIMESTAMP,
  event_location: VARCHAR,
  business_promotion: BOOLEAN DEFAULT FALSE,
  featured: BOOLEAN DEFAULT FALSE,
  created_at: TIMESTAMP,
  updated_at: TIMESTAMP
)
```

### 3. Categories Table
```sql
categories (
  id: UUID PRIMARY KEY,
  name: VARCHAR UNIQUE,
  display_name: VARCHAR,
  description: TEXT,
  icon_url: VARCHAR,
  color_theme: VARCHAR,
  sort_order: INTEGER,
  active: BOOLEAN DEFAULT TRUE,
  created_at: TIMESTAMP
)
```

### 4. Business Profiles Table
```sql
business_profiles (
  id: UUID PRIMARY KEY,
  user_id: UUID REFERENCES users(id),
  business_name: VARCHAR,
  business_type: VARCHAR,
  address: TEXT,
  phone: VARCHAR,
  website: VARCHAR,
  hours_of_operation: JSONB,
  verified_business: BOOLEAN DEFAULT FALSE,
  categories: TEXT[],
  description: TEXT,
  created_at: TIMESTAMP,
  updated_at: TIMESTAMP
)
```

### 5. Events Table
```sql
events (
  id: UUID PRIMARY KEY,
  creator_id: UUID REFERENCES users(id),
  title: VARCHAR,
  description: TEXT,
  category: VARCHAR,
  event_date: TIMESTAMP,
  end_date: TIMESTAMP,
  location_name: VARCHAR,
  address: TEXT,
  city: ENUM('salem', 'portland'),
  ticket_url: VARCHAR,
  price_range: VARCHAR,
  age_restriction: VARCHAR,
  featured_image_url: VARCHAR,
  attendee_count: INTEGER DEFAULT 0,
  max_capacity: INTEGER,
  tags: TEXT[],
  business_id: UUID REFERENCES business_profiles(id),
  created_at: TIMESTAMP,
  updated_at: TIMESTAMP
)
```

### 6. Reactions Table
```sql
reactions (
  id: UUID PRIMARY KEY,
  user_id: UUID REFERENCES users(id),
  video_id: UUID REFERENCES wolfpack_videos(id),
  reaction_type: ENUM('like', 'love', 'laugh', 'wow', 'sad', 'angry'),
  created_at: TIMESTAMP,
  UNIQUE(user_id, video_id)
)
```

### 7. wolfpack_comments Table
```sql
wolfpack_comments (
  id: UUID PRIMARY KEY,
  video_id: UUID REFERENCES wolfpack_videos(id),
  user_id: UUID REFERENCES users(id),
  parent_comment_id: UUID REFERENCES wolfpack_comments(id),
  content: TEXT,
  reaction_count: INTEGER DEFAULT 0,
  created_at: TIMESTAMP,
  updated_at: TIMESTAMP
)
```

### 8. Follows Table
```sql
follows (
  id: UUID PRIMARY KEY,
  follower_id: UUID REFERENCES users(id),
  following_id: UUID REFERENCES users(id),
  created_at: TIMESTAMP,
  UNIQUE(follower_id, following_id)
)
```

### 9. Notifications Table
```sql
notifications (
  id: UUID PRIMARY KEY,
  user_id: UUID REFERENCES users(id),
  type: ENUM('like', 'comment', 'follow', 'mention', 'event', 'business_update'),
  title: VARCHAR,
  message: TEXT,
  data: JSONB,
  read: BOOLEAN DEFAULT FALSE,
  created_at: TIMESTAMP
)
```

### 10. Live Streams Table
```sql
live_streams (
  id: UUID PRIMARY KEY,
  user_id: UUID REFERENCES users(id),
  title: VARCHAR,
  description: TEXT,
  stream_url: VARCHAR,
  stream_key: VARCHAR,
  category: VARCHAR,
  viewer_count: INTEGER DEFAULT 0,
  is_active: BOOLEAN DEFAULT TRUE,
  started_at: TIMESTAMP,
  ended_at: TIMESTAMP,
  created_at: TIMESTAMP
)
```

## Critical Requirements

### Real-time Features Needed
1. **Live streaming support** with viewer counts
2. **Real-time notifications** for interactions
3. **Live comment feeds** during streams
4. **Real-time view counts** and engagement metrics

### Algorithm Requirements
1. **Location-based content filtering** (Salem vs Portland)
2. **Category-specific algorithms** for each content type
3. **Business promotion algorithms** for local business visibility
4. **Event proximity algorithms** for upcoming local events
5. **Cross-category content discovery** to promote local collaboration

### Performance Requirements
1. **Video streaming optimization** for mobile devices
2. **Image/video upload processing** with compression
3. **Fast search capabilities** across all content types
4. **Caching strategies** for frequently accessed content

## Integration Points

### Current Supabase Integration
We're currently using Supabase with the following configuration:
- Real-time subscriptions for live updates
- Row Level Security (RLS) for user privacy
- Storage buckets for media files
- Edge functions for notifications

### Required API Endpoints
Please implement RESTful APIs for:
1. Content CRUD operations by category
2. User authentication and profile management
3. Business profile management
4. Event creation and management
5. Live streaming initiation/termination
6. Real-time notification delivery
7. Search and discovery algorithms
8. Analytics and engagement metrics

## Business Impact

This platform aims to:
- **Boost local economy** by connecting businesses with customers
- **Promote local artists** and creative professionals
- **Increase event attendance** through targeted promotion
- **Foster community engagement** across Salem and Portland
- **Create collaborative opportunities** between businesses and artists
- **Showcase Portland's creative culture** to a wider audience

## Timeline

We need this schema implemented as soon as possible to support our growing user base and upcoming local events including the Waterfront Blues Festival and Saturday Market promotions.

## Questions for Backend Team

1. Can you implement real-time streaming capabilities?
2. What's the recommended approach for video compression and delivery?
3. How should we handle cross-location content discovery?
4. What analytics tracking do you recommend for business accounts?
5. Can we implement location-based push notifications?

Thank you for your partnership in building this community-focused platform. Wolf Pack represents Portland's spirit of creativity and collaboration, and your backend architecture will be the foundation that makes it all possible.

Best regards,
Frontend Development Team
Wolf Pack Platform

---
*"Together we are strong" - Building Portland's Creative Community*
when creating a user // When creating/updating a user
const { data, error } = await supabase.auth.updateUser({
  data: { 
    role: 'some_role', 
    is_vip: true  // This will now automatically set VIP status
  }
})