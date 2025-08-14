#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// React hooks and components that should be converted
const reactExports = [
  'useState', 'useEffect', 'useContext', 'useReducer', 'useCallback', 'useMemo',
  'useRef', 'useImperativeHandle', 'useLayoutEffect', 'useDebugValue',
  'useDeferredValue', 'useTransition', 'useId', 'useSyncExternalStore',
  'useInsertionEffect', 'Suspense', 'Fragment', 'Component', 'PureComponent',
  'forwardRef', 'memo', 'lazy', 'createContext', 'createElement', 'cloneElement',
  'isValidElement', 'Children', 'StrictMode'
];

function fixReactImports(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    let updatedContent = content;
    let hasChanges = false;

    // Check for React named imports patterns
    const namedImportRegex = /import\s*{\s*([^}]+)\s*}\s*from\s*['"]react['"];?/;
    const mixedImportRegex = /import\s+React,\s*{\s*([^}]+)\s*}\s*from\s*['"]react['"];?/;
    const namedMatch = content.match(namedImportRegex);
    const mixedMatch = content.match(mixedImportRegex);
    
    let reactImports = [];
    let importPattern = null;
    
    if (namedMatch) {
      reactImports = namedMatch[1].split(',').map(s => s.trim()).filter(imp => reactExports.includes(imp));
      importPattern = namedImportRegex;
    } else if (mixedMatch) {
      reactImports = mixedMatch[1].split(',').map(s => s.trim()).filter(imp => reactExports.includes(imp));
      importPattern = mixedImportRegex;
    }
    
    if (reactImports.length > 0 && importPattern) {
      console.log(`Fixing ${filePath}:`);
      console.log(`  Found React imports: ${reactImports.join(', ')}`);
      
      // Replace the import statement with star import
      updatedContent = updatedContent.replace(importPattern, "import * as React from 'react';");
      
      // Update usage of these imports
      reactImports.forEach(imp => {
        // Handle both JSX and function call usage
        const jsxRegex = new RegExp(`<${imp}\\b`, 'g');
        const callRegex = new RegExp(`\\b${imp}\\(`, 'g');
        const hookRegex = new RegExp(`\\b${imp}\\b(?!\\.)`, 'g');
        
        // Replace JSX usage
        updatedContent = updatedContent.replace(jsxRegex, `<React.${imp}`);
        // Replace function call usage
        updatedContent = updatedContent.replace(callRegex, `React.${imp}(`);
        // Replace hook usage (but not if it's already prefixed with React.)
        updatedContent = updatedContent.replace(hookRegex, (match, offset) => {
          // Check if it's already prefixed with React.
          if (offset > 5 && updatedContent.substring(offset - 6, offset) === 'React.') {
            return match;
          }
          // Check if it's in an import statement (skip)
          const lineStart = updatedContent.lastIndexOf('\n', offset);
          const lineEnd = updatedContent.indexOf('\n', offset);
          const line = updatedContent.substring(lineStart + 1, lineEnd);
          if (line.trim().startsWith('import') || line.includes('from')) {
            return match;
          }
          return `React.${match}`;
        });
      });
      
      // Fix any closing tags for JSX components
      reactImports.forEach(imp => {
        if (['Suspense', 'Fragment', 'StrictMode'].includes(imp)) {
          const closingRegex = new RegExp(`</${imp}>`, 'g');
          updatedContent = updatedContent.replace(closingRegex, `</React.${imp}>`);
        }
      });
      
      hasChanges = true;
    }

    if (hasChanges) {
      fs.writeFileSync(filePath, updatedContent);
      console.log(`  ✓ Fixed ${filePath}`);
      return true;
    }
    
  } catch (error) {
    console.error(`Error processing ${filePath}:`, error.message);
  }
  
  return false;
}

// Get files with React import errors from TypeScript compiler
function getFilesWithReactImportErrors() {
  try {
    const output = execSync('npx tsc --noEmit 2>&1', { 
      encoding: 'utf8', 
      cwd: process.cwd(),
      maxBuffer: 1024 * 1024 // 1MB buffer
    });
    const lines = output.split('\n');
    const errorFiles = new Set();
    
    lines.forEach(line => {
      if (line.includes("Module '\"react\"' has no exported member")) {
        const match = line.match(/^([^(]+)\(/);
        if (match) {
          // Remove ANSI color codes and clean path
          const filePath = match[1].replace(/\x1b\[[0-9;]*m/g, '').trim();
          errorFiles.add(filePath);
        }
      }
    });
    
    return Array.from(errorFiles);
  } catch (error) {
    // Even if tsc exits with error code, we can still process the output
    if (error.stdout) {
      const lines = error.stdout.split('\n');
      const errorFiles = new Set();
      
      lines.forEach(line => {
        if (line.includes("Module '\"react\"' has no exported member")) {
          const match = line.match(/^([^(]+)\(/);
          if (match) {
            const filePath = match[1].replace(/\x1b\[[0-9;]*m/g, '').trim();
            errorFiles.add(filePath);
          }
        }
      });
      
      return Array.from(errorFiles);
    }
    
    console.error('Error getting TypeScript errors:', error.message);
    return [];
  }
}

// Main execution
console.log('🔧 Fixing React import errors...\n');

const filesWithErrors = getFilesWithReactImportErrors();
console.log(`Found ${filesWithErrors.length} files with React import errors\n`);

let fixedCount = 0;
filesWithErrors.forEach(filePath => {
  if (fs.existsSync(filePath)) {
    if (fixReactImports(filePath)) {
      fixedCount++;
    }
  }
});

console.log(`\n✅ Fixed React imports in ${fixedCount} files`);

// Check remaining errors
console.log('\n🔍 Checking remaining TypeScript errors...');
try {
  const output = execSync('npx tsc --noEmit --pretty 2>&1', { encoding: 'utf8', cwd: process.cwd() });
  const reactImportErrors = (output.match(/Module '"react"' has no exported member/g) || []).length;
  console.log(`Remaining React import errors: ${reactImportErrors}`);
} catch (error) {
  console.log('TypeScript check completed');
}