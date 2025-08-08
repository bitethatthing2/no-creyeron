// Script to upload menu videos to Supabase storage
// Run this in the root of your project after videos are uploaded

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Initialize Supabase client with service role key
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://tvnpgbjypnezoasbhbwx.supabase.co',
  process.env.SUPABASE_SERVICE_ROLE_KEY // This key allows uploads
);

// List of video files that need to be uploaded
const videoFiles = [
  // Food videos
  { local: 'public/food-menu-images/birria-soup-watch-it-made.mp4', remote: 'food/birria-soup-watch-it-made.mp4' },
  { local: 'public/food-menu-images/fish-tacos-watch-it-made.mp4', remote: 'food/fish-tacos-watch-it-made.mp4' },
  { local: 'public/food-menu-images/watch-it-be-made-burrito.mp4', remote: 'food/watch-it-be-made-burrito.mp4' },
  { local: 'public/food-menu-images/watch-it-being-made-queso-tacos.mp4', remote: 'food/watch-it-being-made-queso-tacos.mp4' },
  { local: 'public/food-menu-images/watch-it-being-made-taco-salad.mp4', remote: 'food/watch-it-being-made-taco-salad.mp4' },
  { local: 'public/food-menu-images/watch-it-made-breakfast-burrito.mp4', remote: 'food/watch-it-made-breakfast-burrito.mp4' },
  { local: 'public/food-menu-images/watch-it-made-pizza.mp4', remote: 'food/watch-it-made-pizza.mp4' },
  { local: 'public/food-menu-images/watch-it-made.mp4', remote: 'food/watch-it-made.mp4' },
  
  // Drink videos  
  { local: 'public/drink-menu-images/MARGARITA-BOARDS.mp4', remote: 'drinks/MARGARITA-BOARDS.mp4' },
  { local: 'public/drink-menu-images/margarita-tower.mp4', remote: 'drinks/margarita-tower.mp4' },
  { local: 'public/drink-menu-images/watch-it-made-vampiros.mp4', remote: 'drinks/watch-it-made-vampiros.mp4' },
  
  // Icon videos
  { local: 'public/icons/first-box.mp4', remote: 'icons/first-box.mp4' },
  { local: 'public/icons/main-page-only.mp4', remote: 'icons/main-page-only.mp4' },
  { local: 'public/icons/priemer-destination.mp4', remote: 'icons/priemer-destination.mp4' },
  { local: 'public/icons/video-food.mp4', remote: 'icons/video-food.mp4' },
  { local: 'public/icons/welcome-to-hustle.mp4', remote: 'icons/welcome-to-hustle.mp4' }
];

async function uploadVideos() {
  console.log('🚀 Starting video upload to Supabase storage...\n');
  
  let successCount = 0;
  let skipCount = 0;
  let errorCount = 0;
  
  for (const { local, remote } of videoFiles) {
    try {
      // Check if file exists locally
      if (!fs.existsSync(local)) {
        console.log(`⚠️  Skipping ${remote} - local file not found: ${local}`);
        skipCount++;
        continue;
      }
      
      // Check if already uploaded
      const { data: existingFile } = await supabase.storage
        .from('menu-videos')
        .list(path.dirname(remote), {
          search: path.basename(remote)
        });
        
      if (existingFile && existingFile.length > 0) {
        console.log(`✅ Already exists: ${remote}`);
        successCount++;
        continue;
      }
      
      // Read and upload file
      const fileBuffer = fs.readFileSync(local);
      const fileStats = fs.statSync(local);
      const fileSizeMB = (fileStats.size / 1024 / 1024).toFixed(2);
      
      console.log(`📤 Uploading ${remote} (${fileSizeMB} MB)...`);
      
      const { data, error } = await supabase.storage
        .from('menu-videos')
        .upload(remote, fileBuffer, {
          contentType: 'video/mp4',
          upsert: true
        });

      if (error) {
        console.error(`❌ Error uploading ${remote}:`, error.message);
        errorCount++;
      } else {
        // Get public URL to verify upload
        const { data: publicUrlData } = supabase.storage
          .from('menu-videos')
          .getPublicUrl(remote);
          
        console.log(`✅ Uploaded: ${remote}`);
        console.log(`   URL: ${publicUrlData.publicUrl}\n`);
        successCount++;
      }
      
    } catch (err) {
      console.error(`❌ Exception uploading ${remote}:`, err.message);
      errorCount++;
    }
  }
  
  // Summary
  console.log('\n📊 Upload Summary:');
  console.log(`✅ Successful: ${successCount}`);
  console.log(`⚠️  Skipped: ${skipCount}`);
  console.log(`❌ Errors: ${errorCount}`);
  console.log(`📁 Total files: ${videoFiles.length}`);
  
  if (errorCount === 0) {
    console.log('\n🎉 All videos uploaded successfully!');
    console.log('\nNext steps:');
    console.log('1. Deploy your frontend changes');
    console.log('2. Test "Watch It Made" buttons on your website');
    console.log('3. Videos will now load from Supabase CDN');
  } else {
    console.log(`\n⚠️  ${errorCount} videos failed to upload. Check the errors above.`);
  }
}

// Run the upload
uploadVideos().catch(console.error);