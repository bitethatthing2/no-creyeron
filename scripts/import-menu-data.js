const fs = require('fs');
const { createClient } = require('@supabase/supabase-js');

// Read environment
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'http://127.0.0.1:54321';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;

console.log('Connecting to:', supabaseUrl);

const supabase = createClient(supabaseUrl, supabaseKey);

async function importMenuData() {
  try {
    // Read CSV file
    const csvContent = fs.readFileSync('./temp_menu_data.csv', 'utf8');
    const lines = csvContent.split('\n');
    
    if (lines.length < 2) {
      console.error('CSV file appears to be empty or invalid');
      return;
    }
    
    const headers = lines[0].split(',');
    console.log('CSV Headers:', headers);
    console.log('Total lines:', lines.length - 1);
    
    // Process each line
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;
      
      const cols = line.split(',');
      
      // Skip if line doesn't have enough columns
      if (cols.length < 15) {
        console.log(`Skipping line ${i}: insufficient columns`);
        continue;
      }
      
      // Map CSV columns to database fields - fix the parsing
      const menuItem = {
        id: cols[12] || null, // item_id is at position 12
        name: cols[13] || 'Unknown Item', // item_name
        description: cols[14] ? cols[14].replace(/"/g, '') : null, // clean quotes
        price: parseFloat(cols[15]) || 0,
        category_id: cols[6] || null,
        is_available: cols[17] === 'true',
        is_featured: cols[18] === 'true',
        is_active: true,
        display_order: parseInt(cols[16]) || 0,
        spice_level: cols[19] && cols[19] !== '' ? parseInt(cols[19]) : null,
        prep_time_minutes: cols[20] && cols[20] !== '' ? parseInt(cols[20]) : null,
        allergens: [], // Default to empty array to avoid parsing issues
        image_url: cols[22] || null,
        video_url: cols[2] || null,
        video_thumbnail_url: cols[4] || null,
        storage_path: cols[1] || null
      };
      
      console.log(`Processing: ${menuItem.name} - $${menuItem.price}`);
      
      // Insert or update
      const { error } = await supabase
        .from('menu_items')
        .upsert(menuItem, { 
          onConflict: 'id',
          ignoreDuplicates: false 
        });
      
      if (error) {
        console.error(`Error inserting ${menuItem.name}:`, error.message);
      }
    }
    
    // Check final count
    const { count, error: countError } = await supabase
      .from('menu_items')
      .select('*', { count: 'exact', head: true });
    
    if (countError) {
      console.error('Error counting items:', countError);
    } else {
      console.log(`Import complete! Database now has ${count} items.`);
    }
    
  } catch (error) {
    console.error('Import failed:', error);
  }
}

importMenuData();