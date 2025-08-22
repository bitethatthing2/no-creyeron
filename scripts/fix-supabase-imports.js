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

console.log(`${colors.blue}${colors.bright}Starting Supabase import fix...${colors.reset}\n`);

// Patterns to match and replace
const importPatterns = [
  {
    // Match: import { createClient } from '@/lib/supabase/client'
    pattern: /import\s*{\s*createClient\s*}\s*from\s*['"]@\/lib\/supabase\/client['"]/g,
    replacement: "import { supabase } from '@/lib/supabase'",
    description: 'Browser client direct import'
  },
  {
    // Match: import { supabase } from '@/lib/supabase/client'
    pattern: /import\s*{\s*supabase\s*}\s*from\s*['"]@\/lib\/supabase\/client['"]/g,
    replacement: "import { supabase } from '@/lib/supabase'",
    description: 'Supabase singleton direct import'
  },
  {
    // Match: import { createClient } from '@/lib/supabase/server'
    pattern: /import\s*{\s*createClient\s*}\s*from\s*['"]@\/lib\/supabase\/server['"]/g,
    replacement: "import { createServerClient } from '@/lib/supabase'",
    description: 'Server client direct import'
  },
  {
    // Match: import { createServerClient } from './supabase/server'
    pattern: /import\s*{\s*createServerClient\s*}\s*from\s*['"]\.\/supabase\/server['"]/g,
    replacement: "import { createServerClient } from '@/lib/supabase'",
    description: 'Relative server import'
  },
  {
    // Match: import { createServerClient } from '../supabase/server'
    pattern: /import\s*{\s*createServerClient\s*}\s*from\s*['"]\.\.\/supabase\/server['"]/g,
    replacement: "import { createServerClient } from '@/lib/supabase'",
    description: 'Relative server import (parent)'
  },
  {
    // Match: import { createAdminClient } from '@/lib/supabase/server'
    pattern: /import\s*{\s*createAdminClient\s*}\s*from\s*['"]@\/lib\/supabase\/server['"]/g,
    replacement: "import { createAdminClient } from '@/lib/supabase'",
    description: 'Admin client direct import'
  },
  {
    // Match usage of createClient that needs to be changed to createServerClient
    pattern: /const\s+supabase\s*=\s*await\s+createClient\(\)/g,
    replacement: "const supabase = await createServerClient()",
    description: 'Server createClient usage'
  }
];

// Additional patterns for fixing usage after import changes
const usagePatterns = [
  {
    // In client components that were using createClient()
    pattern: /const\s+supabase\s*=\s*createClient\(\)/g,
    replacement: "// Using singleton instance\n// const supabase is already imported",
    description: 'Client createClient usage',
    condition: (content) => content.includes("'use client'") || content.includes('"use client"')
  }
];

// Files to exclude
const excludePatterns = [
  '**/node_modules/**',
  '**/dist/**',
  '**/build/**',
  '**/.next/**',
  '**/lib/supabase/client.ts',
  '**/lib/supabase/server.ts',
  '**/lib/supabase/index.ts',
  '**/scripts/fix-supabase-imports.js'
];

// Find all TypeScript and JavaScript files
const files = glob.sync('**/*.{ts,tsx,js,jsx}', {
  ignore: excludePatterns,
  absolute: true,
  cwd: process.cwd()
});

console.log(`Found ${colors.bright}${files.length}${colors.reset} files to check\n`);

let totalChanges = 0;
const changedFiles = [];

files.forEach((filePath) => {
  let content = fs.readFileSync(filePath, 'utf8');
  let originalContent = content;
  let fileChanges = 0;

  // Apply import patterns
  importPatterns.forEach((rule) => {
    const matches = content.match(rule.pattern);
    if (matches) {
      content = content.replace(rule.pattern, rule.replacement);
      fileChanges += matches.length;
      console.log(`${colors.green}✓${colors.reset} ${path.relative(process.cwd(), filePath)}: ${rule.description} (${matches.length} changes)`);
    }
  });

  // Apply usage patterns
  usagePatterns.forEach((rule) => {
    if (!rule.condition || rule.condition(content)) {
      const matches = content.match(rule.pattern);
      if (matches) {
        content = content.replace(rule.pattern, rule.replacement);
        fileChanges += matches.length;
        console.log(`${colors.green}✓${colors.reset} ${path.relative(process.cwd(), filePath)}: ${rule.description} (${matches.length} changes)`);
      }
    }
  });

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

// Create ESLint rule configuration
const eslintConfig = `
// Add to .eslintrc.js or .eslintrc.json

{
  "rules": {
    "no-restricted-imports": [
      "error",
      {
        "paths": [
          {
            "name": "@/lib/supabase/client",
            "message": "Please import from '@/lib/supabase' instead."
          },
          {
            "name": "@/lib/supabase/server", 
            "message": "Please import from '@/lib/supabase' instead."
          }
        ],
        "patterns": [
          {
            "group": ["*/supabase/client", "*/supabase/server"],
            "message": "Please import from '@/lib/supabase' instead."
          }
        ]
      }
    ]
  }
}
`;

console.log(`\n${colors.yellow}${colors.bright}Next steps:${colors.reset}`);
console.log(`1. Add the following ESLint rule to prevent direct imports:`);
console.log(`${colors.blue}${eslintConfig}${colors.reset}`);
console.log(`2. Run ${colors.bright}npm run lint${colors.reset} to verify no direct imports remain`);
console.log(`3. Test the application to ensure all Supabase operations work correctly`);

console.log(`\n${colors.green}${colors.bright}✨ Supabase import fix complete!${colors.reset}`);