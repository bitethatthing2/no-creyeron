// rename-wolfpack-safe.js - Corrected and safer version

const fs = require('fs');
const path = require('path');
const glob = require('glob');

// Configuration
const config = {
  // File patterns to search
  filePatterns: [
    'app/**/*.{ts,tsx,js,jsx}',
    'components/**/*.{ts,tsx,js,jsx}',
    'lib/**/*.{ts,tsx,js,jsx}',
    'contexts/**/*.{ts,tsx,js,jsx}',
    'hooks/**/*.{ts,tsx,js,jsx}',
    'types/**/*.{ts,tsx,js,jsx}',
  ],
  
  // Files/folders to exclude
  exclude: [
    'node_modules/**',
    '.next/**',
    'dist/**',
    'build/**',
    '.git/**',
    '*.min.js',
    '*.min.css',
  ],

  // Backup directory
  backupDir: './backup-before-rename',
  
  // Dry run mode (set to false to actually make changes)
  dryRun: false,
};

// Conservative replacement mappings - only safe, specific replacements
const replacements = {
  // Component/Class names - very specific to avoid false positives
  'WolfpackService': 'SocialService',
  'WolfpackProfile': 'UserProfile',
  'WolfpackProfileManager': 'UserProfileManager',
  'WolfpackSignupForm': 'MembershipSignupForm',
  'WolfpackDevWarning': 'DevWarning',
  'WolfpackFeedServiceEnhanced': 'SocialFeedService',
  'WolfpackFeedService': 'SocialFeedService',
  'WolfpackSocialService': 'SocialInteractionService',
  'FindWolfpackMembers': 'FindMembers',
  
  // Function names - specific function names only
  'hasWolfpackAccess': 'hasMemberAccess',
  'canJoinWolfpack': 'canJoinMembership',
  'needsWolfpackVerification': 'needsVerification',
  'getWolfpackProfile': 'getUserProfile',
  'updateWolfpackProfile': 'updateUserProfile',
  'joinWolfpack': 'joinMembership',
  'leaveWolfpack': 'leaveMembership',
  
  // Service method names - very specific
  'WolfpackService.social': 'SocialService',
  'WolfpackService.profile': 'ProfileService',
  'WolfpackService.content': 'ContentService',
};

// Helper functions
function escapeRegExp(string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function createBackup(filePath) {
  const backupPath = path.join(config.backupDir, path.relative('.', filePath));
  const backupDirPath = path.dirname(backupPath);
  
  if (!fs.existsSync(backupDirPath)) {
    fs.mkdirSync(backupDirPath, { recursive: true });
  }
  
  fs.copyFileSync(filePath, backupPath);
}

function processFile(filePath) {
  console.log(`Processing: ${filePath}`);
  
  let content = fs.readFileSync(filePath, 'utf8');
  let originalContent = content;
  let changeCount = 0;
  
  // Apply simple replacements with word boundaries for safety
  for (const [search, replace] of Object.entries(replacements)) {
    // Use word boundaries to avoid partial matches
    const regex = new RegExp('\\b' + escapeRegExp(search) + '\\b', 'g');
    const matches = content.match(regex);
    if (matches) {
      content = content.replace(regex, replace);
      changeCount += matches.length;
      console.log(`  - Replaced "${search}" → "${replace}" (${matches.length} times)`);
    }
  }
  
  // Handle import/export statements specially
  content = fixImportExports(content);
  
  if (changeCount > 0 && !config.dryRun) {
    // Create backup before making changes
    createBackup(filePath);
    
    // Write the modified content
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`  ✓ File updated with ${changeCount} changes`);
  } else if (changeCount > 0) {
    console.log(`  → Would make ${changeCount} changes (dry run)`);
  } else {
    console.log(`  - No changes needed`);
  }
  
  return changeCount;
}

function fixImportExports(content) {
  // Fix import statements - be very conservative
  content = content.replace(
    /from\s+['"]([^'"]*\/wolfpack\/[^'"]*)['"]/gi,
    (match, importPath) => {
      // Only change the wolfpack part in paths, not the whole path
      let newPath = importPath.replace(/\/wolfpack\//g, '/social/');
      return `from '${newPath}'`;
    }
  );
  
  return content;
}

// Main execution
async function main() {
  console.log('Starting safe Wolfpack → Social rename process...');
  console.log(`Mode: ${config.dryRun ? 'DRY RUN' : 'ACTUAL CHANGES'}`);
  console.log('');
  
  if (!config.dryRun) {
    // Create backup directory
    if (!fs.existsSync(config.backupDir)) {
      fs.mkdirSync(config.backupDir, { recursive: true });
    }
    console.log(`Backup directory: ${config.backupDir}\n`);
  }
  
  // Process file contents
  let totalChanges = 0;
  let filesProcessed = 0;
  
  config.filePatterns.forEach(pattern => {
    const files = glob.sync(pattern, { ignore: config.exclude });
    files.forEach(file => {
      const changes = processFile(file);
      if (changes > 0) {
        totalChanges += changes;
        filesProcessed++;
      }
    });
  });
  
  console.log('\n' + '='.repeat(50));
  console.log('Summary:');
  console.log(`  Files with content changes: ${filesProcessed}`);
  console.log(`  Total replacements: ${totalChanges}`);
  
  if (config.dryRun) {
    console.log('\nThis was a DRY RUN. No files were actually modified.');
    console.log('Set config.dryRun = false to apply changes.');
  } else {
    console.log('\n✓ All changes applied successfully!');
    console.log(`Backup created in: ${config.backupDir}`);
  }
}

// Run the script
main().catch(console.error);