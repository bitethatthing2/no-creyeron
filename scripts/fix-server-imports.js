#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const glob = require('glob');

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  red: '\x1b[31m'
};

console.log(`${colors.blue}${colors.bright}Fixing server imports...${colors.reset}\n`);

// Files to exclude
const excludePatterns = [
  '**/node_modules/**',
  '**/dist/**',
  '**/build/**',
  '**/.next/**', 
  '**/lib/supabase/client.ts',
  '**/lib/supabase/server.ts',
  '**/lib/supabase/index.ts',
  '**/scripts/**'
];

// Find all files that were changed to use '@/lib/supabase' for server imports
const files = glob.sync('**/*.{ts,tsx,js,jsx}', {
  ignore: excludePatterns,
  absolute: true,
  cwd: process.cwd()
});

let totalChanges = 0;
const changedFiles = [];

files.forEach((filePath) => {
  let content = fs.readFileSync(filePath, 'utf8');
  let originalContent = content;
  let fileChanges = 0;

  // Check if this is a server component/API route
  const isServerComponent = content.includes('await createServerClient()') || 
                           content.includes('await createAdminClient()') ||
                           filePath.includes('/api/') ||
                           filePath.includes('app/') && !content.includes("'use client'");

  if (isServerComponent) {
    // Revert server imports to use direct paths
    const serverImportPattern = /import\s*{\s*(createServerClient|createAdminClient)\s*}\s*from\s*['"]@\/lib\/supabase['"]/g;
    const matches = content.match(serverImportPattern);
    
    if (matches) {
      content = content.replace(serverImportPattern, "import { $1 } from '@/lib/supabase/server'");
      fileChanges += matches.length;
      console.log(`${colors.green}✓${colors.reset} ${path.relative(process.cwd(), filePath)}: Fixed server imports (${matches.length} changes)`);
    }
  }

  // Write file if changed
  if (fileChanges > 0) {
    fs.writeFileSync(filePath, content, 'utf8');
    totalChanges += fileChanges;
    changedFiles.push(path.relative(process.cwd(), filePath));
  }
});

// Summary
console.log(`\n${colors.bright}Summary:${colors.reset}`);
console.log(`Total changes: ${colors.green}${totalChanges}${colors.reset}`);
console.log(`Files modified: ${colors.green}${changedFiles.length}${colors.reset}`);

if (changedFiles.length > 0) {
  console.log(`\n${colors.bright}Modified files:${colors.reset}`);
  changedFiles.forEach(file => {
    console.log(`  ${colors.blue}→${colors.reset} ${file}`);
  });
}

console.log(`\n${colors.green}${colors.bright}✨ Server imports fixed!${colors.reset}`);