# MENU VIDEO MAPPING DOCUMENTATION - ✅ PRODUCTION READY

## ✅ SYSTEM STATUS: CENTRALIZED & DEPLOYED

### Videos Successfully Uploaded:
All "Watch It Made" videos have been **manually uploaded to Supabase storage** and are working in production.

### ✅ Centralized Video System:
The video mapping system has been **centralized** into a single source of truth:

**File:** `/lib/constants/video-urls.ts`

This **single file** now controls ALL video mappings for:
- Front page carousel (`FoodDrinkCarousel.tsx`)
- Full menu page (`MenuItemCard.tsx`)

## PRODUCTION VIDEO SYSTEM:

### Current Video URLs (Supabase Storage):
All videos are served from: `https://tvnpgbjypnezoasbhbwx.supabase.co/storage/v1/object/public/menu-videos/[folder]/[filename]`

### Working Videos:
- Birria Soup: ✅ Deployed
- Fish Tacos: ✅ Deployed  
- Queso Tacos: ✅ Deployed
- Taco Salad: ✅ Deployed
- Burrito: ✅ Deployed
- Breakfast Burrito: ✅ Deployed
- Pizza: ✅ Deployed
- Margarita Board: ✅ Deployed
- Margarita Tower: ✅ Deployed
- Vampiros: ✅ Deployed

## TO ADD NEW "WATCH IT MADE" VIDEOS:

1. **Manually upload video** to Supabase storage bucket `menu-videos`

2. **Update SINGLE file** `/lib/constants/video-urls.ts`:
   - Add new video to `VIDEO_URLS` object
   - Add menu item mappings to `MENU_VIDEO_MAPPING` object
   - System automatically updates both front page and menu page

3. **Use the EXACT menu item name** (case-sensitive matching)

## EXAMPLE - Current Production Setup:

### Single Source of Truth: `/lib/constants/video-urls.ts`
```javascript
export const VIDEO_URLS = {
  'birria-soup-watch-it-made': getSupabaseVideoUrl('food', 'birria-soup-watch-it-made.mp4'),
  // ... other videos
};

export const MENU_VIDEO_MAPPING: { [key: string]: string } = {
  // Works for both front page and menu page
  'birria ramen bowl': VIDEO_URLS['birria-soup-watch-it-made'],
  'BIRRIA RAMEN BOWL': VIDEO_URLS['birria-soup-watch-it-made'],
  // ... other mappings
};
```

## ✅ SYSTEM BENEFITS:
- **Single file** to update (no more dual maintenance)
- **Centralized** video URL management
- **Production-ready** with Supabase storage
- **Clean URLs** without naming quirks
- **Automatic** propagation to both pages

## 🎬 PRODUCTION STATUS:
**All videos deployed and working!** No upload scripts needed.

---
Last Updated: 2025-08-08
Status: ✅ PRODUCTION READY - All videos manually uploaded to Supabase storage
System: Centralized video mapping in `/lib/constants/video-urls.ts`