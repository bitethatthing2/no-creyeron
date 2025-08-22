# 🚨 ABSOLUTELY FORBIDDEN - DO NOT TOUCH THESE SYSTEMS 🚨

## MESSAGING SYSTEM - WORKING, DO NOT MODIFY
**❌ DO NOT TOUCH ANY OF THESE FILES:**
- `/app/api/messages/conversations/route.ts` - WORKING
- `/app/api/messages/wolfpack-members/route.ts` - WORKING  
- `/lib/hooks/useMessaging.ts` - WORKING
- `/app/(main)/messages/page.tsx` - WORKING
- `/app/(main)/messages/user/[userId]/page.tsx` - WORKING
- `/app/(main)/messages/conversation/[conversationId]/page.tsx` - WORKING

**IF YOU NEED TO CHECK MESSAGING**: Read `MESSAGING_SYSTEM_CRITICAL_NOTES.md` FIRST

## WHY THIS MATTERS
- The messaging system is FULLY FUNCTIONAL as of 2025-01-20
- Previous "improvements" broke working code repeatedly
- Time wasted fixing the same issues: HOURS
- User frustration level: MAXIMUM

## IF ASKED TO MODIFY MESSAGING
1. **STOP** - The system works
2. **ASK** - "The messaging system is currently working. What specific NEW feature do you need?"
3. **NEVER** refactor, optimize, or "improve" without explicit request
4. **DOCUMENT** any new features in MESSAGING_SYSTEM_CRITICAL_NOTES.md

# CRITICAL RULES - DO NOT BREAK

## NEVER TOUCH THE BACKEND
- **DO NOT create migration files**
- **DO NOT modify any .sql files**
- **DO NOT run supabase db push**
- **DO NOT modify database schema**
- **DO NOT create RPC functions**
- **DO NOT touch anything in /supabase/migrations/**
- **DO NOT modify supabase/config.toml**

## FRONTEND ONLY
- Only work on frontend code
- Only modify React/Next.js components
- Only fix frontend API calls
- If backend functions are missing, document it but DO NOT create them

## REMEMBER
The user has explicitly forbidden any backend modifications. Breaking this rule causes serious problems and wastes their time. FRONTEND ONLY.

## MENU "WATCH IT MADE" VIDEOS - CRITICAL DUAL MAPPING REQUIREMENT

### NEVER FORGET: TWO FILES MUST BE UPDATED FOR VIDEO BUTTONS TO WORK!

When adding "Watch It Made" videos, you MUST update BOTH of these files or the video will only work on one page:

1. **Front Page Carousel:** `/components/shared/FoodDrinkCarousel.tsx` (lines ~906-925)
2. **Menu Page:** `/components/menu/MenuItemCard.tsx` (lines ~54-80)

Both files have their own `videoMap`/`videoMapping` objects that must contain the same mappings.

**Example:**
- FoodDrinkCarousel.tsx: `'birria ramen bowl': '/food-menu-images/birria-soup-watch-it-made.mp4'`
- MenuItemCard.tsx: `'BIRRIA RAMEN BOWL': '/food-menu-images/birria-soup-watch-it-made.mp4'`

See `/MENU_VIDEO_MAPPING.md` for full documentation.

# CRITICAL SERVICE ARCHITECTURE RULES - ADDED 2025-01-15

## WOLFPACK SERVICES - FOLLOW THESE RULES OR BREAK EVERYTHING

### ⚠️ CRITICAL: DO NOT CREATE "FIXED" VERSIONS
- **NEVER** create `fixed-something.service.ts` files
- **NEVER** create `something-v2.service.ts` files  
- **FIX THE ORIGINAL** or create a proper replacement with migration plan
- Pattern of "fixed" versions created this mess of 11 duplicate services

### ✅ USE ONLY THE CONSOLIDATED SERVICE
**ALWAYS import from**: `/lib/services/wolfpack/`
```typescript
// ✅ CORRECT - Use this pattern
import { WolfpackService } from '@/lib/services/wolfpack';

// ❌ WRONG - Never use these
import { wolfpackService } from '@/lib/services/unified-wolfpack.service';
import WolfpackNotificationService from '@/lib/services/wolfpack-notification.service';
import { WolfpackBackendService } from '@/lib/services/wolfpack-backend.service';
```

### 🚨 BEFORE REMOVING ANY SERVICE FILE
1. **CHECK** `SERVICE_MAPPING.md` for dependencies
2. **GREP** the entire codebase for imports:
   ```bash
   grep -r "from.*service-name" --include="*.ts" --include="*.tsx" .
   ```
3. **MIGRATE** components to consolidated service first
4. **TEST** that everything still works
5. **ONLY THEN** remove the old service file

### 📊 REQUIRED DOCUMENTATION UPDATES
When making service changes, **ALWAYS** update:
- `SERVICE_MAPPING.md` - What services exist and what uses them
- `TECHNICAL_DEBT.md` - Remove resolved issues, add new ones found
- `PROJECT_STATUS.md` - Update current state
- `CLEANUP_PLAN.md` - Mark completed tasks

### 🔍 BEFORE ANY REFACTORING
1. **READ** `PROJECT_STATUS.md` to understand current state
2. **CHECK** `TECHNICAL_DEBT.md` for known issues
3. **FOLLOW** `CLEANUP_PLAN.md` for approved changes
4. **UPDATE** all documentation when done

### ⛔ ABSOLUTELY FORBIDDEN
- Creating new "wolfpack-*" service files without architectural justification
- Removing service files without dependency analysis
- Making service changes without updating documentation
- Creating "temporary" or "quick fix" services
- Copying service logic instead of consolidating

### 🎯 THE GOAL
- **ONE** Wolfpack service: `/lib/services/wolfpack/`
- **CLEAR** service boundaries (auth, feed, social, messaging)
- **NO** confusion about which service to import
- **DOCUMENTED** architecture decisions

## SUPABASE CLIENT RULES

### ✅ CORRECT IMPORT PATTERNS
```typescript
// Server components and API routes
import { createServerClient } from '@/lib/supabase/server';

// Client components  
import { supabase } from '@/lib/supabase';

// Types
import type { Database } from '@/types/database.types';
```

### ❌ NEVER IMPORT THESE
```typescript
// Wrong - will cause build errors
import { createServerClient } from '@/lib/supabase';
import { createClient } from '@/lib/supabase/client';
```

## ERROR HANDLING RULES

### ✅ USE CONSOLIDATED ERROR HANDLING
```typescript
import { mapSupabaseError } from '@/lib/services/wolfpack';
const userError = mapSupabaseError(error);
```

### ❌ NEVER USE THESE OLD PATTERNS
```typescript
// Wrong - these don't exist
WolfpackErrorHandler.handleSupabaseError()
WolfpackService.handleError()
```

## TYPESCRIPT SERVICE RETURN TYPES - CRITICAL FIX 2025-01-15

### ✅ ALL WOLFPACK SERVICES NOW RETURN ServiceResponse<T>
```typescript
// Correct pattern - all services return ServiceResponse
const response = await WolfpackService.feed.fetchFeedItems();
if (response.success) {
  const items = response.data; // FeedItem[]
} else {
  console.error(response.error);
}
```

### ❌ NEVER EXPECT THESE OLD PATTERNS
```typescript
// Wrong - old patterns no longer used
const response = await WolfpackService.feed.fetchFeedItems();
if (response.items) { /* Wrong - no items property */ }
if (response.totalItems) { /* Wrong - no totalItems property */ }
```

### ✅ CORRECT WOLFPACK INTERFACE USAGE
```typescript
import type { WolfpackAccess, WolfpackStatusType } from '@/types/features/wolfpack-interfaces';

// Status is a string literal, not an object
if (wolfpackStatus === 'active') { /* Correct */ }
if (wolfpackStatus.isActive) { /* Wrong - no .isActive property */ }

// Location status is also a string literal
if (locationStatus === 'verified') { /* Correct */ }
if (locationStatus.isAtLocation) { /* Wrong - no .isAtLocation property */ }
```

## EMERGENCY CONTACT
If you're confused about service architecture:
1. **READ** `SERVICE_MAPPING.md` first
2. **CHECK** `TECHNICAL_DEBT.md` for known issues
3. **FOLLOW** `CLEANUP_PLAN.md` for guidance
4. **DOCUMENT** any new issues found

Remember: This project got into this mess because people didn't follow documentation rules. **DON'T MAKE IT WORSE.**