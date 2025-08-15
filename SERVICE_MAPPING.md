# SERVICE MAPPING - CURRENT STATE INVENTORY

**Last Updated**: 2025-01-15  
**Purpose**: Track exactly what services exist and what depends on them  
**Status**: 🚨 CRITICAL - 11 different implementations for same functionality  

## CURRENT SERVICE ARCHITECTURE (BROKEN)

### 🎯 TARGET: Single Consolidated Service
**Goal**: `/lib/services/wolfpack/` should be the ONLY Wolfpack service

### 📊 ACTUAL STATE: Multiple Competing Services

## SERVICE INVENTORY

### ✅ KEEP - Consolidated Service (Target)
```
/lib/services/wolfpack/
├── index.ts          - Main export (WolfpackService class)
├── auth.ts           - WolfpackAuthService 
├── feed.ts           - WolfpackFeedService
├── types.ts          - Type definitions
└── errors.ts         - Error handling
```

**Status**: ✅ This is the target architecture  
**Dependencies**: 4 files importing from this  
**Completeness**: Partial - missing location, membership modules

### ❌ REMOVE - Competing "Unified" Service
```
/lib/services/unified-wolfpack.service.ts
```
**Status**: ❌ Competes with `/lib/services/wolfpack/`  
**Dependencies**: 5 files importing `wolfpackService`  
**Action Required**: Migrate imports to consolidated service

### ❌ REMOVE - Legacy Duplicate Services
```
/lib/services/wolfpack-backend.service.ts      - Referenced in wolfpack/index.ts
/lib/services/wolfpack-enhanced.service.ts     - No active imports found
/lib/services/wolfpack-social.service.ts       - Referenced in wolfpack/index.ts  
/lib/services/wolfpack-notification.service.ts - 2 components depend on this
/lib/services/wolfpack-auth.service.ts         - Might have unique logic
/lib/services/wolfpack-membership.service.ts   - Might have unique logic
/lib/services/wolfpack-location.service.ts     - Might have unique logic
/lib/services/wolfpack-realtime.service.ts     - Check for dependencies
/lib/services/wolfpack.service.ts              - Legacy main service
```

### ❌ REMOVE - "Fixed" Anti-Pattern Services
```
/lib/services/like.service.ts               - ✅ Used by lib/hooks/useVideoLike.ts
/lib/services/fixed-likes.service.ts        - ✅ Used by components/shared/FixedUnifiedInit.tsx
/lib/services/fixed-notification.service.ts - ✅ Used by components/shared/FixedUnifiedInit.tsx
/lib/services/comment-reaction.service.ts   - ✅ Used by components/wolfpack/CommentReactions.tsx
```
**⚠️ WARNING**: These have active dependencies! Cannot remove yet.

## DEPENDENCY MAPPING

### Files Using Consolidated Service ✅
```
lib/services/wolfpack/index.ts         - Exports WolfpackService
app/actions/wolfpack-feed.ts           - imports WolfpackService  
app/api/wolfpack/join/route.ts         - imports WolfpackService
app/api/wolfpack/reset/route.ts        - imports WOLFPACK_TABLES, mapSupabaseError
lib/hooks/useWolfpackQuery.ts          - imports WolfpackService
```
**Status**: ✅ These are following the correct pattern

### Files Using Competing Unified Service ❌
```
app/(main)/wolfpack/feed/page.tsx           - imports wolfpackService
components/wolfpack/FindFriends.tsx         - imports wolfpackService  
components/wolfpack/ShareModal.tsx          - imports wolfpackService
components/wolfpack/VideoCommentsOptimized.tsx - imports wolfpackService
components/wolfpack/feed/TikTokStyleFeed.tsx - imports wolfpackService
```
**Action Required**: Migrate these 5 files to use `/lib/services/wolfpack/`

### Files Using "Fixed" Services ❌
```
lib/hooks/useVideoLike.ts                    - imports LikeService
components/wolfpack/CommentReactions.tsx     - imports CommentReactionService
components/shared/FixedUnifiedInit.tsx       - imports FixedNotificationService, FixedLikesService
```
**Action Required**: Migrate these 3 files to consolidated service

### Files Using Legacy Services ❌
```
[Need to run grep analysis to find these]
```

## MIGRATION PRIORITY

### Phase 1: High Priority (This Week)
1. **Migrate "unified-wolfpack" users** (5 files) → `/lib/services/wolfpack/`
2. **Assess missing functionality** in consolidated service
3. **Add missing modules** (location, membership) to consolidated service

### Phase 2: Medium Priority (Next Week)  
1. **Migrate "fixed" service users** (3 files) → consolidated service
2. **Remove competing unified service** after migration complete
3. **Remove "fixed" services** after dependencies migrated

### Phase 3: Low Priority (Following Week)
1. **Remove legacy services** after confirming no dependencies
2. **Clean up legacy imports** and dead code
3. **Verify single source of truth**

## FUNCTIONALITY ANALYSIS

### What's in Consolidated Service ✅
```typescript
// /lib/services/wolfpack/index.ts exports:
WolfpackService.auth     - Authentication & user management
WolfpackService.feed     - Feed content management  
WolfpackService.backend  - Legacy compatibility layer
WolfpackService.social   - Legacy compatibility layer
```

### What's Missing ❌
```typescript
// These modules need to be created:
WolfpackService.location    - Location verification  
WolfpackService.membership  - Pack joining/leaving
WolfpackService.events      - DJ events, broadcasts
WolfpackService.realtime    - Real-time features
```

### Functionality in "Fixed" Services
```typescript
// LikeService provides:
- toggleLike(videoId) with user ID mapping
- Error handling for authentication failures
- Database interaction for wolfpack_post_likes table

// CommentReactionService provides:  
- Comment reaction management
- [Need to analyze specific functions]

// FixedNotificationService provides:
- [Need to analyze - probably notification fixes]

// FixedLikesService provides:
- [Need to analyze - probably like functionality fixes]
```

## MIGRATION CHECKLIST

### Before Removing Any Service:
- [ ] Check this mapping for dependencies
- [ ] Run grep search: `grep -r "service-name" --include="*.ts" --include="*.tsx" .`
- [ ] Ensure functionality exists in consolidated service
- [ ] Test migration thoroughly
- [ ] Update this mapping file

### After Each Migration:
- [ ] Update dependency lists in this file
- [ ] Mark files as migrated
- [ ] Update `TECHNICAL_DEBT.md` 
- [ ] Update `PROJECT_STATUS.md`

## API ROUTE DEPENDENCIES

### Wolfpack API Routes
```
app/api/wolfpack/join/route.ts     - Uses WolfpackService ✅
app/api/wolfpack/leave/route.ts    - [Check dependencies]
app/api/wolfpack/reset/route.ts    - Uses WOLFPACK_TABLES ✅
app/api/wolfpack/status/route.ts   - [Check dependencies]  
app/api/wolfpack/update/route.ts   - [Check dependencies]
app/api/wolfpack/actions/route.ts  - [Check dependencies]
app/api/wolfpack/members/route.ts  - [Check dependencies]
app/api/wolfpack/videos/route.ts   - [Check dependencies]
```

### Other Service Dependencies
```
app/api/notifications/route.ts       - [Check what service used]
app/api/notifications/send/route.ts  - [Check what service used]  
app/api/messages/send/route.ts       - [Check what service used]
```

## SUCCESS CRITERIA

### ✅ We'll know we're done when:
1. **Only one service**: `/lib/services/wolfpack/` exists
2. **All imports**: Come from `@/lib/services/wolfpack`
3. **No confusion**: Developers know exactly which service to use
4. **Complete functionality**: All needed modules exist in consolidated service
5. **No "fixed" versions**: Original functionality works properly

### 📊 Progress Tracking
- **Total Services**: 11 → Target: 1
- **Files Migrated**: 0/8 components using wrong services
- **Modules Complete**: 2/6 modules in consolidated service
- **Dependencies Resolved**: 0/4 "fixed" service dependencies

---

*This mapping will be updated as we progress through the migration. Always check this file before making service changes.*