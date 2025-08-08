# MENU VIDEO MAPPING DOCUMENTATION

## CRITICAL: There are TWO separate video mappings that MUST be kept in sync!

### Problem We Solved:
The "Watch It Made" functionality was not working for Birria Ramen Bowl because we have **TWO DIFFERENT MENU SYSTEMS** with **TWO DIFFERENT VIDEO MAPPINGS** that both need to be updated when adding videos.

## REQUIRED FILES TO UPDATE FOR ANY NEW "WATCH IT MADE" VIDEOS:

### 1. Front Page Carousel (MAIN MENU USERS SEE)
**File:** `/components/shared/FoodDrinkCarousel.tsx`
**Lines:** ~906-925 (in `getWatchItMadeVideo` function)
**Function:** `const videoMap: { [key: string]: string } = {`

This controls the "Watch It Made" buttons on the **FRONT PAGE SLIDER** that users see first.

### 2. Full Menu Page 
**File:** `/components/menu/MenuItemCard.tsx`  
**Lines:** ~54-80 (in `getWatchItMadeVideo` function)
**Function:** `const videoMapping: { [key: string]: string } = {`

This controls the "Watch It Made" buttons on the **FULL MENU PAGE** (/menu).

## EXACT STEPS TO ADD A NEW "WATCH IT MADE" VIDEO:

1. **Upload video file** to `/public/food-menu-images/[video-name].mp4`

2. **Update BOTH files** with the EXACT SAME mapping:
   - Add to FoodDrinkCarousel.tsx (front page)
   - Add to MenuItemCard.tsx (menu page)

3. **Use the EXACT menu item name** (case-sensitive matching)

## EXAMPLE - What We Did for Birria Ramen Bowl:

### File 1: `/components/shared/FoodDrinkCarousel.tsx`
```javascript
const videoMap: { [key: string]: string } = {
  // ... other mappings
  'birria ramen bowl': '/food-menu-images/birria-soup-watch-it-made.mp4',
  // ... other mappings
};
```

### File 2: `/components/menu/MenuItemCard.tsx`  
```javascript
const videoMapping: { [key: string]: string } = {
  // ... other mappings
  'BIRRIA RAMEN BOWL': '/food-menu-images/birria-soup-watch-it-made.mp4',
  // ... other mappings
};
```

## WHY THIS HAPPENED:
- Front page uses a carousel with hardcoded menu items
- Menu page pulls from database  
- Each has its own video mapping function
- Both need to be updated for videos to work everywhere

## NEVER FORGET:
**ALWAYS UPDATE BOTH FILES OR THE VIDEO WON'T WORK ON BOTH PAGES!**

---
Last Updated: 2025-08-07
Issue: Birria Ramen Bowl video mapping
Video File: `/public/food-menu-images/birria-soup-watch-it-made.mp4`