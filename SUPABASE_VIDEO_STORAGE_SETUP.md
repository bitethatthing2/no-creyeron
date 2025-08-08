# Supabase Video Storage Setup Guide

## Step 1: Create Video Storage Bucket in Supabase

Go to your Supabase Dashboard > Storage and run this SQL:

```sql
-- Create a public bucket for menu videos
INSERT INTO storage.buckets (id, name, public, avif_autodetection, allowed_mime_types)
VALUES (
  'menu-videos',
  'menu-videos',
  true,
  false,
  ARRAY['video/mp4', 'video/webm', 'video/ogg']
);

-- Set up RLS policies (public read access)
CREATE POLICY "Public Access" ON storage.objects 
FOR SELECT TO public 
USING (bucket_id = 'menu-videos');

CREATE POLICY "Authenticated users can upload" ON storage.objects 
FOR INSERT TO authenticated 
WITH CHECK (bucket_id = 'menu-videos');
```

## Step 2: Upload Videos to Supabase

### Option A: Via Dashboard (Easy)
1. Go to Supabase Dashboard > Storage
2. Click on 'menu-videos' bucket
3. Upload all video files
4. Note the public URLs

### Option B: Via Code (Automated)
Create a script `upload-videos.js`:

```javascript
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const videoFiles = [
  // Food videos
  'public/food-menu-images/birria-soup-watch-it-made.mp4',
  'public/food-menu-images/fish-tacos-watch-it-made.mp4',
  'public/food-menu-images/watch-it-be-made-burrito.mp4',
  'public/food-menu-images/watch-it-being-made-queso-tacos.mp4',
  'public/food-menu-images/watch-it-being-made-taco-salad.mp4',
  'public/food-menu-images/watch-it-made-breakfast-burrito.mp4',
  'public/food-menu-images/watch-it-made-pizza.mp4',
  'public/food-menu-images/watch-it-made.mp4',
  // Drink videos
  'public/drink-menu-images/MARGARITA-BOARDS.mp4',
  'public/drink-menu-images/margarita-tower.mp4',
  'public/drink-menu-images/watch-it-made-vampiros.mp4',
  // Icon videos
  'public/icons/first-box.mp4',
  'public/icons/main-page-only.mp4',
  'public/icons/priemer-destination.mp4',
  'public/icons/video-food.mp4',
  'public/icons/welcome-to-hustle.mp4'
];

async function uploadVideos() {
  for (const filePath of videoFiles) {
    const fileName = path.basename(filePath);
    const folder = filePath.includes('food-menu') ? 'food' : 
                   filePath.includes('drink-menu') ? 'drinks' : 'icons';
    
    const file = fs.readFileSync(filePath);
    
    const { data, error } = await supabase.storage
      .from('menu-videos')
      .upload(`${folder}/${fileName}`, file, {
        contentType: 'video/mp4',
        upsert: true
      });

    if (error) {
      console.error(`Error uploading ${fileName}:`, error);
    } else {
      console.log(`✅ Uploaded ${fileName}`);
      const publicUrl = supabase.storage
        .from('menu-videos')
        .getPublicUrl(`${folder}/${fileName}`).data.publicUrl;
      console.log(`   URL: ${publicUrl}`);
    }
  }
}

uploadVideos();
```

## Step 3: Create Video URL Mapping

Create `lib/constants/video-urls.ts`:

```typescript
export const VIDEO_URLS = {
  // Food videos
  'birria-soup-watch-it-made': 'https://tvnpgbjypnezoasbhbwx.supabase.co/storage/v1/object/public/menu-videos/food/birria-soup-watch-it-made.mp4',
  'fish-tacos-watch-it-made': 'https://tvnpgbjypnezoasbhbwx.supabase.co/storage/v1/object/public/menu-videos/food/fish-tacos-watch-it-made.mp4',
  'watch-it-be-made-burrito': 'https://tvnpgbjypnezoasbhbwx.supabase.co/storage/v1/object/public/menu-videos/food/watch-it-be-made-burrito.mp4',
  'watch-it-being-made-queso-tacos': 'https://tvnpgbjypnezoasbhbwx.supabase.co/storage/v1/object/public/menu-videos/food/watch-it-being-made-queso-tacos.mp4',
  'watch-it-being-made-taco-salad': 'https://tvnpgbjypnezoasbhbwx.supabase.co/storage/v1/object/public/menu-videos/food/watch-it-being-made-taco-salad.mp4',
  'watch-it-made-breakfast-burrito': 'https://tvnpgbjypnezoasbhbwx.supabase.co/storage/v1/object/public/menu-videos/food/watch-it-made-breakfast-burrito.mp4',
  'watch-it-made-pizza': 'https://tvnpgbjypnezoasbhbwx.supabase.co/storage/v1/object/public/menu-videos/food/watch-it-made-pizza.mp4',
  
  // Drink videos
  'MARGARITA-BOARDS': 'https://tvnpgbjypnezoasbhbwx.supabase.co/storage/v1/object/public/menu-videos/drinks/MARGARITA-BOARDS.mp4',
  'margarita-tower': 'https://tvnpgbjypnezoasbhbwx.supabase.co/storage/v1/object/public/menu-videos/drinks/margarita-tower.mp4',
  'watch-it-made-vampiros': 'https://tvnpgbjypnezoasbhbwx.supabase.co/storage/v1/object/public/menu-videos/drinks/watch-it-made-vampiros.mp4',
};
```

## Step 4: Update Components to Use Supabase URLs

Update `components/shared/FoodDrinkCarousel.tsx` and `components/menu/MenuItemCard.tsx`:

```typescript
// Instead of local path:
video: '/food-menu-images/birria-soup-watch-it-made.mp4'

// Use Supabase URL:
video: VIDEO_URLS['birria-soup-watch-it-made']
```

## Step 5: Benefits of Supabase Storage

✅ **No GitHub storage limits**
✅ **CDN delivery** - Fast global access
✅ **Bandwidth included** - Part of your Supabase plan
✅ **Easy management** - Upload/delete via dashboard
✅ **Direct integration** - Works with your existing Supabase setup
✅ **Transformations** - Can resize/optimize on the fly

## Deployment Steps:

1. Upload videos to Supabase Storage
2. Update your code to use Supabase URLs
3. Test locally
4. Push code to GitHub (without videos)
5. Deploy to Vercel

Your videos will now stream directly from Supabase's CDN!