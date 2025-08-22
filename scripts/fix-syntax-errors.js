#!/usr/bin/env node

/**
 * Script to fix common syntax errors found in the codebase
 */

const fs = require('fs');
const path = require('path');
const glob = require('glob');

// Common syntax error patterns and their fixes
const fixes = [
  // Missing quotes
  {
    pattern: /(\w+_\w+)'/g,
    replacement: "'$1'",
    description: "Fix missing opening quotes"
  },
  // Double quotes in string literals
  {
    pattern: /: "([^"]*)"'/g,
    replacement: ": '$1'",
    description: "Fix quote consistency"
  },
  // Template literal issues
  {
    pattern: /`([^`]*)\$\{([^}]*)\}([^`]*)`'/g,
    replacement: "`$1\${$2}$3`",
    description: "Fix template literal quotes"
  }
];

function fixSyntaxInFile(filePath) {
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    let hasChanges = false;
    
    // Apply each fix
    fixes.forEach(fix => {
      const newContent = content.replace(fix.pattern, fix.replacement);
      if (newContent !== content) {
        console.log(`   Applying: ${fix.description}`);
        content = newContent;
        hasChanges = true;
      }
    });
    
    // Manual fixes for specific patterns
    // Fix missing quotes at start of strings
    const manualFixes = [
      { from: /: (\w+_\w+)'/g, to: ": '$1'" },
      { from: /: ([A-Z_]+)'/g, to: ": '$1'" },
      { from: /\[\s*(\w+)\]/g, to: "['$1']" },
    ];
    
    manualFixes.forEach(fix => {
      const newContent = content.replace(fix.from, fix.to);
      if (newContent !== content) {
        content = newContent;
        hasChanges = true;
      }
    });
    
    if (hasChanges) {
      fs.writeFileSync(filePath, content, 'utf8');
      console.log(`✅ Fixed: ${filePath}`);
      return true;
    }
    return false;
  } catch (error) {
    console.error(`❌ Error fixing ${filePath}:`, error.message);
    return false;
  }
}

function main() {
  console.log('🔧 Fixing syntax errors...\n');
  
  // Files with known syntax errors
  const problematicFiles = [
    'app/api/dj/events/route.ts',
    'app/api/events/[eventId]/vote/route.ts', 
    'app/api/orders/wolfpack/route.ts',
    'components/wolfpack/WolfpackChatChannels.tsx',
    'lib/services/wolfpack-backend.service.ts',
    'lib/services/wolfpack-enhanced.service.ts'
  ];
  
  let fixedCount = 0;
  
  problematicFiles.forEach(file => {
    const filePath = path.resolve(file);
    if (fs.existsSync(filePath)) {
      console.log(`\n🔍 Checking: ${file}`);
      const wasFixed = fixSyntaxInFile(filePath);
      if (wasFixed) fixedCount++;
    } else {
      console.log(`⚠️  File not found: ${file}`);
    }
  });
  
  console.log(`\n📊 Summary:`);
  console.log(`   Files fixed: ${fixedCount}`);
  
  if (fixedCount > 0) {
    console.log('\n✨ Syntax errors fixed!');
    console.log('💡 Run `npm run types:check` to verify fixes');
  } else {
    console.log('\n✅ No syntax errors found to fix');
  }
}

if (require.main === module) {
  main();
}

module.exports = { fixSyntaxInFile };