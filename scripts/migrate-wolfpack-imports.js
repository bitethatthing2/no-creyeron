#!/usr/bin/env node

/**
 * Script to migrate all Wolfpack service imports to use the new unified service
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Configuration
const PROJECT_ROOT = process.cwd();
const EXTENSIONS = ['.ts', '.tsx', '.js', '.jsx'];

// Old service patterns to replace
const OLD_IMPORTS = [
  // Direct service imports
  {
    pattern: /from ['"]@\/lib\/services\/wolfpack\.service['"]/g,
    replacement: "from '@/lib/services/wolfpack'"
  },
  {
    pattern: /from ['"]@\/lib\/services\/wolfpack-auth\.service['"]/g,
    replacement: "from '@/lib/services/wolfpack'"
  },
  {
    pattern: /from ['"]@\/lib\/services\/wolfpack-social\.service['"]/g,
    replacement: "from '@/lib/services/wolfpack'"
  },
  {
    pattern: /from ['"]@\/lib\/services\/wolfpack-membership\.service['"]/g,
    replacement: "from '@/lib/services/wolfpack'"
  },
  {
    pattern: /from ['"]@\/lib\/services\/wolfpack-location\.service['"]/g,
    replacement: "from '@/lib/services/wolfpack'"
  },
  {
    pattern: /from ['"]@\/lib\/services\/wolfpack-enhanced\.service['"]/g,
    replacement: "from '@/lib/services/wolfpack'"
  },
  {
    pattern: /from ['"]@\/lib\/services\/wolfpack-backend\.service['"]/g,
    replacement: "from '@/lib/services/wolfpack'"
  },
  
  // Import specifiers
  {
    pattern: /import\s*{\s*WolfpackService\s*}/g,
    replacement: "import { WolfpackService }"
  },
  {
    pattern: /import\s*{\s*WolfpackAuthService\s*}/g,
    replacement: "import { WolfpackService }"
  },
  {
    pattern: /import\s*{\s*WolfpackSocialService\s*}/g,
    replacement: "import { WolfpackService }"
  },
  {
    pattern: /import\s*{\s*WolfpackMembershipService\s*}/g,
    replacement: "import { WolfpackService }"
  },
  {
    pattern: /import\s*{\s*WolfpackLocationService\s*}/g,
    replacement: "import { WolfpackService }"
  },
  {
    pattern: /import\s*{\s*WolfpackEnhancedService\s*}/g,
    replacement: "import { WolfpackService }"
  },
  {
    pattern: /import\s*{\s*WolfpackBackendService\s*}/g,
    replacement: "import { WolfpackService }"
  }
];

// Usage pattern replacements
const USAGE_REPLACEMENTS = {
  // Auth service
  'WolfpackService.auth.': 'WolfpackService.auth.',
  
  // Feed service  
  'WolfpackService.feed.': 'WolfpackService.feed.',
  
  // Legacy service calls (will need manual review)
  'WolfpackService.events.getActiveEvents': 'WolfpackService.events.getActiveEvents',
  'WolfpackService.events.createEvent': 'WolfpackService.events.createEvent',
  'WolfpackService.broadcasts.sendBroadcast': 'WolfpackService.broadcasts.sendBroadcast',
  
  // Social service calls
  'WolfpackService.social.': 'WolfpackService.social.',
  'WolfpackService.membership.': 'WolfpackService.membership.',
  'WolfpackService.location.': 'WolfpackService.location.',
  'WolfpackService.enhanced.': 'WolfpackService.enhanced.',
  'WolfpackService.backend.': 'WolfpackService.backend.'
};

function findFiles(dir, extensions) {
  let files = [];
  
  const items = fs.readdirSync(dir);
  
  for (const item of items) {
    const fullPath = path.join(dir, item);
    const stat = fs.statSync(fullPath);
    
    if (stat.isDirectory()) {
      // Skip node_modules and .git
      if (!['node_modules', '.git', '.next', 'dist', 'build'].includes(item)) {
        files = files.concat(findFiles(fullPath, extensions));
      }
    } else if (extensions.some(ext => item.endsWith(ext))) {
      files.push(fullPath);
    }
  }
  
  return files;
}

function migrateFile(filePath) {
  console.log(`📄 Processing: ${path.relative(PROJECT_ROOT, filePath)}`);
  
  let content = fs.readFileSync(filePath, 'utf8');
  let hasChanges = false;
  
  // Apply import replacements
  for (const { pattern, replacement } of OLD_IMPORTS) {
    if (pattern.test(content)) {
      content = content.replace(pattern, replacement);
      hasChanges = true;
    }
  }
  
  // Apply usage replacements
  for (const [oldUsage, newUsage] of Object.entries(USAGE_REPLACEMENTS)) {
    if (content.includes(oldUsage)) {
      content = content.replaceAll(oldUsage, newUsage);
      hasChanges = true;
    }
  }
  
  if (hasChanges) {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`  ✅ Updated`);
    return 1;
  } else {
    console.log(`  ⏭️  No changes needed`);
    return 0;
  }
}

function main() {
  console.log('🐺 Migrating Wolfpack service imports to unified architecture...\n');
  
  // Find all TypeScript/JavaScript files
  const files = findFiles(PROJECT_ROOT, EXTENSIONS);
  
  console.log(`📋 Found ${files.length} files to process\n`);
  
  let changedFiles = 0;
  
  // Process each file
  for (const file of files) {
    // Skip the new unified service files
    if (file.includes('lib/services/wolfpack/')) {
      continue;
    }
    
    changedFiles += migrateFile(file);
  }
  
  console.log(`\n✨ Migration complete!`);
  console.log(`📊 Files changed: ${changedFiles}/${files.length}`);
  
  if (changedFiles > 0) {
    console.log(`\n⚠️  Manual review needed for:`);
    console.log(`   - Legacy service method calls that might need API adjustments`);
    console.log(`   - Any remaining service-specific functionality`);
    console.log(`   - Error handling patterns`);
    
    console.log(`\n💡 Next steps:`);
    console.log(`   1. Test the application to ensure all imports work`);
    console.log(`   2. Implement missing service modules (social, membership, etc.)`);
    console.log(`   3. Remove old service files once migration is verified`);
  }
}

// Run the migration
main();