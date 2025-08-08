#!/usr/bin/env node

/**
 * Script to fix createClient() references in service files
 */

const fs = require('fs');
const path = require('path');

const services = [
  'lib/services/data-service.ts',
  'lib/services/feature-flags.service.ts', 
  'lib/services/image-replacement.service.ts',
  'lib/services/user-profile.service.ts',
  'lib/utils/notifications/NotificationHelpers.ts'
];

function fixFile(filePath) {
  console.log(`📄 Fixing: ${filePath}`);
  
  if (!fs.existsSync(filePath)) {
    console.log(`  ⚠️  File not found: ${filePath}`);
    return;
  }
  
  let content = fs.readFileSync(filePath, 'utf8');
  let hasChanges = false;
  
  // Replace createClient() with supabase
  if (content.includes('createClient()')) {
    content = content.replace(/createClient\(\)/g, 'supabase');
    hasChanges = true;
  }
  
  // Replace this.supabase = createClient() with this.supabase = supabase
  if (content.includes('this.supabase = createClient()')) {
    content = content.replace(/this\.supabase = createClient\(\)/g, 'this.supabase = supabase');
    hasChanges = true;
  }
  
  // Replace private supabase = createClient() with private supabase = supabase
  if (content.includes('private supabase = createClient()')) {
    content = content.replace(/private supabase = createClient\(\)/g, 'private supabase = supabase');
    hasChanges = true;
  }
  
  if (hasChanges) {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`  ✅ Fixed`);
  } else {
    console.log(`  ⏭️  No changes needed`);
  }
}

console.log('🔧 Fixing createClient() references...\n');

for (const service of services) {
  fixFile(service);
}

console.log('\n✨ All fixes applied!');