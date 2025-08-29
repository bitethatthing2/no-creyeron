#!/usr/bin/env node

// Automated Wolfpack Type Reference Fixer
// This script finds and fixes all outdated wolfpack type references

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Colors for console output
const colors = {
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  white: '\x1b[37m',
  reset: '\x1b[0m',
  bright: '\x1b[1m'
};

function log(message, color = 'white') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

// Type fixes mapping - what to replace with what
const TYPE_FIXES = {
  // Remove DJ-related types completely
  'DJEvent': null,
  'DJBroadcast': null,
  'ActiveEvent': null,
  
  // Update wolfpack status to only have valid values
  'wolfpack_status.*"dj"': 'wolfpack_status: "active"',
  '"dj"': '"active"',
  
  // Fix role references
  'role.*"dj"': 'role: "admin"',
  
  // Remove DJ-specific functions
  'isDJ\\(': 'isAdmin(',
  'checkDJStatus': 'checkAdminStatus',
  'getDJEvents': null,
  'createDJBroadcast': null,
  'stopDJBroadcast': null,
  
  // Update interface names if needed
  'DJEventInterface': 'EventInterface',
  'DJBroadcastInterface': 'BroadcastInterface',
};

// Files to skip (binary, generated, etc.)
const SKIP_PATTERNS = [
  /node_modules/,
  /\.git/,
  /\.next/,
  /\.vercel/,
  /dist/,
  /build/,
  /coverage/,
  /\.map$/,
  /\.png$/,
  /\.jpg$/,
  /\.jpeg$/,
  /\.gif$/,
  /\.svg$/,
  /\.ico$/,
  /\.woff/,
  /\.ttf$/,
  /\.eot$/,
  /package-lock\.json$/,
  /yarn\.lock$/,
];

// File extensions to process
const VALID_EXTENSIONS = ['.ts', '.tsx', '.js', '.jsx', '.json'];

class WolfpackTypeFixer {
  constructor() {
    this.fixCount = 0;
    this.fileCount = 0;
    this.errors = [];
    this.fixes = [];
  }

  shouldSkipFile(filePath) {
    return SKIP_PATTERNS.some(pattern => pattern.test(filePath));
  }

  isValidFile(filePath) {
    const ext = path.extname(filePath);
    return VALID_EXTENSIONS.includes(ext);
  }

  async getAllFiles(dirPath, allFiles = []) {
    const files = fs.readdirSync(dirPath);
    
    for (const file of files) {
      const filePath = path.join(dirPath, file);
      
      if (this.shouldSkipFile(filePath)) {
        continue;
      }
      
      const stat = fs.statSync(filePath);
      
      if (stat.isDirectory()) {
        await this.getAllFiles(filePath, allFiles);
      } else if (this.isValidFile(filePath)) {
        allFiles.push(filePath);
      }
    }
    
    return allFiles;
  }

  fixFileContent(content, filePath) {
    let modified = content;
    let fileFixed = false;
    const fileFixes = [];

    // Apply each fix
    for (const [pattern, replacement] of Object.entries(TYPE_FIXES)) {
      if (replacement === null) {
        // Remove lines containing this pattern
        const lines = modified.split('\\n');
        const filteredLines = lines.filter(line => {
          const regex = new RegExp(pattern, 'gi');
          const matches = regex.test(line);
          if (matches) {
            fileFixes.push(`Removed line: ${line.trim()}`);
            fileFixed = true;
          }
          return !matches;
        });
        modified = filteredLines.join('\\n');
      } else {
        // Replace pattern
        const regex = new RegExp(pattern, 'gi');
        const matches = modified.match(regex);
        if (matches) {
          modified = modified.replace(regex, replacement);
          fileFixes.push(`${pattern} -> ${replacement} (${matches.length} times)`);
          fileFixed = true;
        }
      }
    }

    // Additional specific fixes for TypeScript files
    if (filePath.endsWith('.ts') || filePath.endsWith('.tsx')) {
      // Remove DJ-related imports
      const djImportPattern = /import.*(?:DJEvent|DJBroadcast|ActiveEvent).*from.*;\n?/g;
      if (djImportPattern.test(modified)) {
        modified = modified.replace(djImportPattern, '');
        fileFixes.push('Removed DJ-related imports');
        fileFixed = true;
      }

      // Fix enum values
      const djEnumPattern = /DJ\s*=\s*["']dj["'],?\n?/gi;
      if (djEnumPattern.test(modified)) {
        modified = modified.replace(djEnumPattern, '');
        fileFixes.push('Removed DJ enum value');
        fileFixed = true;
      }

      // Fix type unions that include 'dj'
      const djUnionPattern = /\|\s*["']dj["']/gi;
      if (djUnionPattern.test(modified)) {
        modified = modified.replace(djUnionPattern, '');
        fileFixes.push('Removed DJ from type unions');
        fileFixed = true;
      }
    }

    // Fix wolfpack_status type definitions
    const statusTypePattern = /wolfpack_status.*:.*["']dj["']/gi;
    if (statusTypePattern.test(modified)) {
      modified = modified.replace(statusTypePattern, 'wolfpack_status: "active"');
      fileFixes.push('Fixed wolfpack_status type');
      fileFixed = true;
    }

    return { modified, fileFixed, fileFixes };
  }

  async fixFile(filePath) {
    try {
      const content = fs.readFileSync(filePath, 'utf8');
      const { modified, fileFixed, fileFixes } = this.fixFileContent(content, filePath);
      
      if (fileFixed) {
        fs.writeFileSync(filePath, modified, 'utf8');
        this.fixCount += fileFixes.length;
        this.fixes.push({
          file: filePath,
          fixes: fileFixes
        });
        log(`  ✅ Fixed ${fileFixes.length} issues in ${path.relative(process.cwd(), filePath)}`, 'green');
        fileFixes.forEach(fix => log(`    - ${fix}`, 'cyan'));
        return true;
      }
      
      return false;
    } catch (error) {
      this.errors.push({
        file: filePath,
        error: error.message
      });
      log(`  ❌ Error fixing ${filePath}: ${error.message}`, 'red');
      return false;
    }
  }

  async findProblematicFiles() {
    log('🔍 Scanning for files with DJ/wolfpack type issues...', 'yellow');
    
    const problematicPatterns = [
      'DJEvent',
      'DJBroadcast', 
      'ActiveEvent',
      'wolfpack_status.*"dj"',
      'role.*"dj"',
      '"dj".*:.*wolfpack',
      'isDJ\\(',
      'checkDJStatus',
    ];

    const problematicFiles = new Set();
    
    for (const pattern of problematicPatterns) {
      try {
        const result = execSync(`rg -l "${pattern}" --type ts --type tsx --type js --type jsx . 2>/dev/null || true`, {
          encoding: 'utf8'
        });
        
        result.split('\\n').filter(Boolean).forEach(file => {
          if (!this.shouldSkipFile(file)) {
            problematicFiles.add(file);
          }
        });
      } catch (error) {
        // rg might not be available, fallback to manual search
        log(`Warning: Could not use rg for pattern ${pattern}`, 'yellow');
      }
    }

    return Array.from(problematicFiles);
  }

  async run() {
    log(`${colors.bright}${colors.blue}🔧 Wolfpack Type Reference Fixer${colors.reset}`, 'blue');
    log('=' .repeat(50), 'blue');

    // First, try to find files with specific issues
    const problematicFiles = await this.findProblematicFiles();
    
    if (problematicFiles.length > 0) {
      log(`Found ${problematicFiles.length} files with potential issues:`, 'yellow');
      problematicFiles.forEach(file => log(`  - ${file}`, 'white'));
      log('', 'white');
    }

    // Get all files to scan
    const allFiles = await this.getAllFiles('.');
    const filesToCheck = problematicFiles.length > 0 ? problematicFiles : allFiles;
    
    log(`🔄 Processing ${filesToCheck.length} files...`, 'blue');
    log('', 'white');

    // Fix each file
    for (const filePath of filesToCheck) {
      const wasFixed = await this.fixFile(filePath);
      if (wasFixed) {
        this.fileCount++;
      }
    }

    // Summary
    log('', 'white');
    log(`${colors.bright}${colors.green}📊 Fix Summary:${colors.reset}`, 'green');
    log('=' .repeat(40), 'green');
    log(`Files processed: ${filesToCheck.length}`, 'white');
    log(`Files modified: ${this.fileCount}`, this.fileCount > 0 ? 'green' : 'white');
    log(`Total fixes applied: ${this.fixCount}`, this.fixCount > 0 ? 'green' : 'white');
    log(`Errors encountered: ${this.errors.length}`, this.errors.length > 0 ? 'red' : 'white');

    if (this.errors.length > 0) {
      log('\\n❌ Errors:', 'red');
      this.errors.forEach(error => {
        log(`  ${error.file}: ${error.error}`, 'red');
      });
    }

    if (this.fileCount > 0) {
      log('\\n✅ Successfully cleaned up wolfpack type references!', 'green');
      log('\\nNext steps:', 'yellow');
      log('1. Run TypeScript compiler: npx tsc --noEmit', 'white');
      log('2. Run tests to verify changes: npm test', 'white');
      log('3. Review changes: git diff', 'white');
    } else {
      log('\\n✨ No type issues found - your codebase is already clean!', 'green');
    }

    return this.fileCount > 0;
  }
}

// Main execution
async function main() {
  const fixer = new WolfpackTypeFixer();
  
  try {
    const hadChanges = await fixer.run();
    process.exit(hadChanges ? 0 : 1);
  } catch (error) {
    log(`Fatal error: ${error.message}`, 'red');
    console.error(error);
    process.exit(1);
  }
}

// Handle CLI arguments
const args = process.argv.slice(2);
if (args.includes('--help') || args.includes('-h')) {
  console.log(`
🔧 Wolfpack Type Reference Fixer

Automatically finds and fixes outdated wolfpack type references in your codebase.

Usage:
  node fix-wolfpack-types.js

What it fixes:
  • Removes DJ-related type definitions (DJEvent, DJBroadcast, etc.)
  • Updates wolfpack_status values (removes "dj", keeps "active", "inactive", "pending")
  • Fixes role references (changes "dj" to "admin")
  • Removes DJ-specific function calls
  • Cleans up imports and enum values

Files processed:
  • TypeScript (.ts, .tsx)
  • JavaScript (.js, .jsx)  
  • JSON configuration files

The script will show you exactly what changes it makes to each file.
`);
  process.exit(0);
}

// Run the fixer
main();