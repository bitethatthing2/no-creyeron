# 🛑 DO NOT BREAK - WORKING FEATURES LIST

## Purpose
This file tracks ALL features that are currently working and MUST NOT be modified without explicit user request for NEW functionality.

## WORKING FEATURES - DO NOT TOUCH

### ✅ Messaging System (Fixed: 2025-01-20)
**Status**: FULLY FUNCTIONAL
**Files**: 
- `/app/api/messages/conversations/route.ts`
- `/app/api/messages/wolfpack-members/route.ts`
- `/lib/hooks/useMessaging.ts`
- `/app/(main)/messages/page.tsx`
- `/app/(main)/messages/user/[userId]/page.tsx`
- `/app/(main)/messages/conversation/[conversationId]/page.tsx`

**What Works**:
- ✅ Viewing conversations list
- ✅ Starting new conversations
- ✅ Sending/receiving messages
- ✅ Real-time updates
- ✅ Member selection
- ✅ Navigation between conversations

**DO NOT**:
- Change any type definitions
- "Optimize" database queries  
- Refactor "for clarity"
- Add "helpful" abstractions
- Modify without user explicitly asking

---

### ✅ Menu System & Videos
**Status**: WORKING
**Note**: Dual mapping required for videos (see MENU_VIDEO_MAPPING.md)

---

### ✅ Authentication Flow
**Status**: WORKING
**Note**: Uses Supabase Auth

---

## BEFORE MAKING ANY CHANGES

Ask yourself:
1. Is this feature currently broken? (If no, DON'T TOUCH IT)
2. Did the user explicitly ask for this change? (If no, DON'T TOUCH IT)
3. Am I "improving" working code? (If yes, DON'T TOUCH IT)

## THE GOLDEN RULE

**If it works, DON'T TOUCH IT unless adding NEW features**

## Track Record of Unnecessary Breaks
- Messaging system broken 3+ times by "improvements"
- Hours wasted on fixing the same issues
- User frustration: MAXIMUM

## How to Add New Features (The RIGHT Way)
1. Confirm existing functionality works
2. Add new feature WITHOUT modifying existing code
3. Test that old functionality still works
4. Document the addition
5. Update this file if needed

---
**Last Updated**: 2025-01-20
**Working Features Count**: 4 major systems