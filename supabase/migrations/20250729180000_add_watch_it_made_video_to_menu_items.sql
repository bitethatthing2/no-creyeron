-- Add watch_it_made_video column to menu_items table
-- This allows storing watch-it-made wolfpack_videos for menu items directly in the database
-- rather than relying on hardcoded mappings in the frontend

ALTER TABLE public.menu_items 
ADD COLUMN watch_it_made_video TEXT;

-- Comment on the new column
COMMENT ON COLUMN public.menu_items.watch_it_made_video 
IS 'URL/path to watch-it-made video for this menu item';

-- Update the existing queso birria tacos item with its video
-- First, let's find the item by name since we know it exists
UPDATE public.menu_items 
SET watch_it_made_video = '/food-menu-images/watch-it-being-made-queso-tacos.mp4'
WHERE name ILIKE '%birria%queso%tacos%' OR name ILIKE '%queso%birria%tacos%';

-- Also update any items that might be just "queso tacos" but are birria-related
UPDATE public.menu_items 
SET watch_it_made_video = '/food-menu-images/watch-it-being-made-queso-tacos.mp4'
WHERE name ILIKE '%queso%tacos%' 
AND (description ILIKE '%birria%' OR name ILIKE '%birria%');