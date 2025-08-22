# Codebase Cleanup Plan

## Current State Analysis

### Service Architecture Confusion
We have **TWO competing "unified" approaches**:
1. `/lib/services/wolfpack/` directory - Modular approach with static classes
2. `/lib/services/unified-wolfpack.service.ts` - Singleton approach

Both claim to be the "consolidated" solution but they're different patterns!

### Active Usage
- 5 files use `wolfpackService` from `unified-wolfpack.service`
- 4 files use `WolfpackService` from `/lib/services/wolfpack/`
- Various files still import individual legacy services

## Recommended Approach

### KEEP: `/lib/services/wolfpack/` Directory Structure
**Why:**
- Better organized with separate files for auth, feed, etc.
- Cleaner module boundaries
- Already has types and error handling separated
- More maintainable long-term

### Phase 1: Immediate Cleanup (Safe to do now)

#### Remove These Unused Files:
```bash
# Legacy services that are definitely replaced
rm lib/services/wolfpack.service.ts
rm lib/services/wolfpack-enhanced.service.ts  
rm lib/services/like.service.ts
rm lib/services/fixed-likes.service.ts
rm lib/services/fixed-notification.service.ts
rm lib/services/comment-reaction.service.ts

# Debug routes (if not needed in production)
rm app/api/menu-debug/route.ts
rm app/api/fix-menu-rls/route.ts
```

### Phase 2: Service Consolidation

1. **Update all imports** from `unified-wolfpack.service` to use `/lib/services/wolfpack/`
2. **Migrate functionality** from `unified-wolfpack.service` to appropriate modules in `/lib/services/wolfpack/`
3. **Remove** `unified-wolfpack.service.ts` once migration complete

### Phase 3: Complete the Modular Service

The `/lib/services/wolfpack/` needs these modules completed:
- `membership.ts` - For pack membership functions
- `location.ts` - For location verification
- `social.ts` - Consolidate likes, comments, follows

### Phase 4: API Route Cleanup

#### Merge Notification Routes:
- Keep: `/app/api/notifications/send/route.ts` (most complete)
- Remove: `/app/api/notifications/route.ts`, `/app/api/send-notification/route.ts`

#### Merge Message Routes:
- Keep: `/app/api/messages/send/route.ts` (most generic)
- Remove or specialize: `/app/api/messages/direct/route.ts`, `/app/api/messages/private/route.ts`

## Files to Check Before Removing

These services might still be in use:
- `wolfpack-backend.service.ts` - Referenced in wolfpack/index.ts
- `wolfpack-social.service.ts` - Referenced in wolfpack/index.ts  
- `wolfpack-notification.service.ts` - Used by 2 components
- `wolfpack-auth.service.ts` - Might have unique auth logic
- `wolfpack-membership.service.ts` - Might have membership logic
- `wolfpack-location.service.ts` - Might have location logic

## Implementation Order

1. **Today**: Remove obviously unused files (Phase 1)
2. **Next**: Consolidate to `/lib/services/wolfpack/` pattern
3. **Then**: Complete missing modules
4. **Finally**: Clean up API routes

## Expected Benefits

- **50% reduction** in service files
- **Clear import paths** - always `from '@/lib/services/wolfpack'`
- **No more confusion** about which service to use
- **Easier maintenance** - single source of truth
- **Better performance** - less duplicate code

## Testing After Each Phase

Critical paths to test:
- User authentication
- Wolfpack feed loading
- Posting comments
- Like functionality  
- Notifications
- Messages

## Notes

- The codebase shows signs of multiple incomplete refactoring attempts
- There's a pattern of creating "fixed-" versions instead of fixing originals
- Many services have overlapping functionality
- The modular approach in `/lib/services/wolfpack/` is the best foundation