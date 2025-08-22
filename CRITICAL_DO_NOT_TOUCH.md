# 🚨 CRITICAL: DO NOT TOUCH - CORE FUNCTIONALITY 🚨

**Date:** August 11, 2025  
**Priority:** MAXIMUM  
**Status:** PERMANENT PROTECTION REQUIRED

---

## ⚠️ **CLAUDE CODE CRITICAL WARNING** ⚠️

**THIS IS FOR ANY AI ASSISTANT WORKING ON THIS CODEBASE:**

You have made a CRITICAL ERROR by removing the "Watch It Made" video functionality. This is the **CORE BUSINESS FEATURE** of this application and must NEVER be touched, removed, or modified without explicit permission.

---

## 🔴 **NEVER TOUCH THESE FILES - THEY ARE CORE FUNCTIONALITY**

### **Watch It Made Video System (PRIMARY FEATURE):**
```
components/menu/WatchItMadeModal.tsx          ← CORE VIDEO MODAL
components/shared/FoodDrinkCarousel.tsx       ← MAIN CAROUSEL WITH VIDEOS  
lib/constants/video-urls.ts                   ← VIDEO MAPPING SYSTEM
MENU_VIDEO_MAPPING.md                         ← VIDEO DOCUMENTATION
```

### **Critical Functions in FoodDrinkCarousel.tsx:**
- `getWatchItMadeVideo()` function
- `setShowWatchItMadeModal()` state
- "Watch It Made" button click handlers
- Video modal rendering at bottom of component
- All video mapping logic

### **Critical Dependencies:**
- Any import of `WatchItMadeModal`
- Any reference to video mappings
- Any "Watch It Made" button functionality
- Video URL resolution functions

---

## 📋 **WHAT THIS SYSTEM DOES (BUSINESS CRITICAL):**

1. **Displays food items** in an interactive carousel
2. **Shows "Watch It Made" buttons** for items with videos
3. **Opens video modals** when buttons are clicked
4. **Plays cooking/preparation videos** for menu items
5. **Provides core customer engagement** feature

**THIS IS THE PRIMARY FEATURE THAT CUSTOMERS USE**

---

## 🚨 **WHAT WENT WRONG ON AUGUST 11, 2025:**

### **The Error:**
- User asked to "cleanup outdated food ordering system"
- AI assistant removed ENTIRE `components/menu/` directory
- This broke the **core "Watch It Made" video functionality**
- Customer-facing videos stopped working completely

### **The Impact:**
- Primary business feature broken
- Customer experience destroyed
- Development time wasted on restoration
- User frustration and lost trust

### **The Lesson:**
**NEVER remove directories or files without CAREFULLY analyzing what depends on them**

---

## ✅ **SAFE TO REMOVE vs ⛔ NEVER TOUCH**

### ✅ **SAFE TO REMOVE (if needed):**
- Shopping cart checkout systems
- Food ordering APIs (if not used for videos)
- Payment processing (if separate from videos)
- User account management (if separate)

### ⛔ **NEVER TOUCH (CORE FEATURES):**
- **Watch It Made videos** - PRIMARY FEATURE
- **FoodDrinkCarousel** - MAIN UI COMPONENT
- **WolfPack social features** - CORE FUNCTIONALITY
- **Authentication system** - REQUIRED FOR APP
- **Video storage/playback** - CUSTOMER-FACING

---

## 🔒 **PROTECTION RULES FOR AI ASSISTANTS:**

### **RULE 1: ASK BEFORE REMOVING ANYTHING**
```bash
# WRONG
rm -rf components/menu/

# RIGHT  
# "I see components/menu/ contains WatchItMadeModal.tsx which appears to be used 
#  for video functionality. Should I preserve this while removing other files?"
```

### **RULE 2: CHECK DEPENDENCIES FIRST**
```bash
# ALWAYS run before removing files:
grep -r "WatchItMadeModal" . 
grep -r "components/menu" .
grep -r "Watch It Made" .
```

### **RULE 3: VERIFY WHAT FILES DO**
- Read file contents before removing
- Check if they're imported elsewhere
- Understand the business purpose
- Confirm with user before removal

### **RULE 4: PRESERVE WORKING FEATURES**
- If something is working, DON'T BREAK IT
- User said "cleanup ordering" NOT "break videos"
- When in doubt, PRESERVE rather than remove

---

## 📖 **CONTEXT FOR FUTURE AI ASSISTANTS:**

### **This Application Is:**
- A restaurant/bar management system
- Focused on social features (WolfPack)
- Has video content showing food preparation
- Uses "Watch It Made" as primary customer engagement

### **The User Values Most:**
1. **Watch It Made videos** (PRIMARY FEATURE)
2. WolfPack social functionality  
3. User authentication
4. Clean, working codebase

### **The User Does NOT Want:**
- Broken core functionality
- Time wasted fixing preventable errors
- Features removed without permission
- Code going in circles due to AI mistakes

---

## 🎯 **VERIFICATION CHECKLIST**

Before making ANY changes that involve removing files:

- [ ] Did I check if any files contain "Watch It Made" functionality?
- [ ] Did I grep for imports of files I'm about to remove?
- [ ] Did I ask the user to confirm removal of ANY menu-related components?
- [ ] Did I understand what each file does before removing it?
- [ ] Am I 100% sure this won't break core functionality?

**If ANY answer is NO, then STOP and ask the user for clarification.**

---

## 🔥 **EMERGENCY RESTORATION GUIDE**

If "Watch It Made" videos are ever broken again:

1. **Check if WatchItMadeModal exists:** `ls components/menu/WatchItMadeModal.tsx`
2. **Check FoodDrinkCarousel imports:** `grep "WatchItMadeModal" components/shared/FoodDrinkCarousel.tsx`
3. **Restore from git:** `git checkout HEAD~1 -- components/menu/WatchItMadeModal.tsx`
4. **Fix imports immediately**
5. **Test video functionality**
6. **Commit fixes with "URGENT FIX" message**

---

## 📞 **USER COMMUNICATION**

When the user says "cleanup the menu system" they mean:
- Remove UNUSED/OUTDATED food ordering features
- Keep WORKING video functionality
- Preserve customer-facing features
- Don't break what's working

**ALWAYS clarify with the user before removing ANYTHING related to:**
- Videos
- Menus  
- Customer-facing features
- Core functionality

---

## ⚡ **FINAL WARNING**

**ANY AI ASSISTANT THAT BREAKS THE "WATCH IT MADE" VIDEO FUNCTIONALITY AGAIN WILL BE CONSIDERED TO HAVE FAILED THEIR BASIC RESPONSIBILITY.**

This is not just code cleanup - this affects real customers and real business value. 

**BE EXTREMELY CAREFUL. WHEN IN DOUBT, ASK THE USER.**

---

*This document was created after a critical error on August 11, 2025*  
*It must be read and understood by any AI working on this codebase*  
*The goal is to prevent breaking core functionality ever again*