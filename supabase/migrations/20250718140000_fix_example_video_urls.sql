-- Fix example.com video URLs in wolfpack_videos table
-- These are causing video load errors in the browser

-- Update any video URLs that contain example.com to null
UPDATE public.wolfpack_videos 
SET video_url = null 
WHERE video_url LIKE '%example.com%';

-- Also update any thumbnail URLs that contain example.com to null
UPDATE public.wolfpack_videos 
SET thumbnail_url = null 
WHERE thumbnail_url LIKE '%example.com%';

-- Clean up any other placeholder URLs that might cause issues
UPDATE public.wolfpack_videos 
SET video_url = null 
WHERE video_url LIKE '%placeholder%' 
   OR video_url LIKE '%test%' 
   OR video_url LIKE '%sample%'
   OR video_url LIKE '%demo%';

-- Add some real sample data with null video URLs (will show as images instead)
INSERT INTO public.wolfpack_videos (user_id, title, description, video_url, thumbnail_url, duration, view_count, like_count)
SELECT 
    u.id,
    'Welcome to Side Hustle Bar',
    'Experience the best nightlife in Salem! Join the wolf pack! 🐺',
    null,
    '/images/entertainment-hero.jpg',
    null,
    42,
    15
FROM public.users u
WHERE u.email = 'test@example.com'
LIMIT 1
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.wolfpack_videos (user_id, title, description, video_url, thumbnail_url, duration, view_count, like_count)
SELECT 
    u.id,
    'Craft Cocktail Night',
    'Our mixologists are crafting amazing drinks tonight! 🍸',
    null,
    '/drink-menu-images/margarita-boards.png',
    null,
    28,
    8
FROM public.users u
WHERE u.email = 'test@example.com'
LIMIT 1
ON CONFLICT (id) DO NOTHING;