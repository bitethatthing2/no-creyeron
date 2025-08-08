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