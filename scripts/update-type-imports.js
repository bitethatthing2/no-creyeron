#!/usr/bin/env node

/**
 * Script to update all database type imports from old location to new location
 * This updates imports from '@/types/database.types' to '@/lib/database.types'
 */

const fs = require('fs');
const path = require('path');
const glob = require('glob');

// Pattern to find all TypeScript files
const filePattern = '{app,lib,components,hooks,types}/**/*.{ts,tsx}';

// Old and new import paths
const oldImportPath = '@/types/database.types';
const newImportPath = '@/lib/database.types';

function updateImportsInFile(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const updatedContent = content.replace(
      new RegExp(oldImportPath.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'),
      newImportPath
    );
    
    if (content !== updatedContent) {
      fs.writeFileSync(filePath, updatedContent, 'utf8');
      console.log(`✅ Updated: ${filePath}`);
      return true;
    }
    return false;
  } catch (error) {
    console.error(`❌ Error updating ${filePath}:`, error.message);
    return false;
  }
}

function main() {
  console.log('🔄 Updating database type imports...\n');
  console.log(`   From: ${oldImportPath}`);
  console.log(`   To:   ${newImportPath}\n`);
  
  // Find all TypeScript files
  const files = glob.sync(filePattern, { 
    cwd: process.cwd(),
    ignore: ['node_modules/**', '.next/**', 'dist/**', 'build/**']
  });
  
  let updatedCount = 0;
  let totalFiles = 0;
  
  files.forEach(file => {
    const filePath = path.resolve(file);
    const wasUpdated = updateImportsInFile(filePath);
    if (wasUpdated) updatedCount++;
    totalFiles++;
  });
  
  console.log(`\n📊 Summary:`);
  console.log(`   Files checked: ${totalFiles}`);
  console.log(`   Files updated: ${updatedCount}`);
  
  if (updatedCount > 0) {
    console.log('\n✨ Import paths updated successfully!');
    console.log('💡 Run `npm run types:check` to verify TypeScript compilation');
  } else {
    console.log('\n✅ No imports needed updating');
  }
}

if (require.main === module) {
  main();
}

module.exports = { updateImportsInFile };