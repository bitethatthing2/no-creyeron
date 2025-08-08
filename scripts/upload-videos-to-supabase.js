const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: '.env.local' });

// Initialize Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const videoFiles = [
  // Food videos
  { path: 'public/food-menu-images/birria-soup-watch-it-made.mp4', folder: 'food' },
  { path: 'public/food-menu-images/fish-tacos-watch-it-made.mp4', folder: 'food' },
  { path: 'public/food-menu-images/watch-it-be-made-burrito.mp4', folder: 'food' },
  { path: 'public/food-menu-images/watch-it-being-made-queso-tacos.mp4', folder: 'food' },
  { path: 'public/food-menu-images/watch-it-being-made-taco-salad.mp4', folder: 'food' },
  { path: 'public/food-menu-images/watch-it-made-breakfast-burrito.mp4', folder: 'food' },
  { path: 'public/food-menu-images/watch-it-made-pizza.mp4', folder: 'food' },
  { path: 'public/food-menu-images/watch-it-made.mp4', folder: 'food' },
  
  // Drink videos
  { path: 'public/drink-menu-images/MARGARITA-BOARDS.mp4', folder: 'drinks' },
  { path: 'public/drink-menu-images/margarita-tower.mp4', folder: 'drinks' },
  { path: 'public/drink-menu-images/watch-it-made-vampiros.mp4', folder: 'drinks' },
  
  // Icon videos
  { path: 'public/icons/first-box.mp4', folder: 'icons' },
  { path: 'public/icons/main-page-only.mp4', folder: 'icons' },
  { path: 'public/icons/priemer-destination.mp4', folder: 'icons' },
  { path: 'public/icons/video-food.mp4', folder: 'icons' },
  { path: 'public/icons/welcome-to-hustle.mp4', folder: 'icons' }
];

const urlMapping = {};

async function uploadVideos() {
  console.log('🚀 Starting video upload to Supabase Storage...\n');
  
  for (const video of videoFiles) {
    const fileName = path.basename(video.path);
    const storagePath = `${video.folder}/${fileName}`;
    
    try {
      // Check if file exists locally
      if (!fs.existsSync(video.path)) {
        console.log(`⚠️  File not found: ${video.path}`);
        continue;
      }
      
      const file = fs.readFileSync(video.path);
      console.log(`📤 Uploading ${fileName} (${(file.length / 1024 / 1024).toFixed(2)} MB)...`);
      
      // Upload to Supabase
      const { data, error } = await supabase.storage
        .from('menu-videos')
        .upload(storagePath, file, {
          contentType: 'video/mp4',
          upsert: true // Overwrite if exists
        });

      if (error) {
        console.error(`❌ Error uploading ${fileName}:`, error.message);
      } else {
        // Get public URL
        const { data: { publicUrl } } = supabase.storage
          .from('menu-videos')
          .getPublicUrl(storagePath);
        
        console.log(`✅ Uploaded successfully!`);
        console.log(`   URL: ${publicUrl}\n`);
        
        // Store mapping
        const key = fileName.replace('.mp4', '');
        urlMapping[key] = publicUrl;
      }
    } catch (err) {
      console.error(`❌ Failed to upload ${fileName}:`, err.message);
    }
  }
  
  // Save URL mapping
  console.log('\n📝 Creating URL mapping file...');
  
  // Ensure directory exists
  if (!fs.existsSync('lib/constants')) {
    fs.mkdirSync('lib/constants', { recursive: true });
  }
  
  const mappingContent = `// Auto-generated video URL mappings
// Generated on: ${new Date().toISOString()}

export const VIDEO_URLS = ${JSON.stringify(urlMapping, null, 2)};

export function getVideoUrl(key: string): string | undefined {
  return VIDEO_URLS[key];
}
`;
  
  fs.writeFileSync('lib/constants/video-urls.ts', mappingContent);
  console.log('✅ URL mapping saved to lib/constants/video-urls.ts');
  
  console.log('\n🎉 Upload complete! Total videos:', Object.keys(urlMapping).length);
}

// Run the upload
uploadVideos().catch(console.error);