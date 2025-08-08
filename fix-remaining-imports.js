const fs = require('fs');
const path = require('path');

console.log('🔧 Fixing remaining import issues...\n');

// Fix 1: Update providers.tsx to remove NuqsAdapter
function fixProviders() {
  console.log('📝 Fixing app/providers.tsx...');
  const providersPath = path.join('app', 'providers.tsx');
  
  if (fs.existsSync(providersPath)) {
    let content = fs.readFileSync(providersPath, 'utf8');
    
    // Remove NuqsAdapter import
    content = content.replace(/import.*NuqsAdapter.*from.*['"]nuqs.*['"].*\n/g, '');
    
    // Remove NuqsAdapter usage - comment it out or remove the wrapper
    content = content.replace(/<NuqsAdapter>\s*/g, '{/* NuqsAdapter removed - not available in nuqs v1 */}\n');
    content = content.replace(/\s*<\/NuqsAdapter>/g, '');
    
    fs.writeFileSync(providersPath, content);
    console.log('  ✅ Fixed providers.tsx\n');
  }
}

// Fix 2: Update AuthContext to use the correct import
function fixAuthContext() {
  console.log('📝 Fixing contexts/AuthContext.tsx...');
  const authContextPath = path.join('contexts', 'AuthContext.tsx');
  
  if (fs.existsSync(authContextPath)) {
    let content = fs.readFileSync(authContextPath, 'utf8');
    
    // Replace supabase import with createClient
    content = content.replace(
      /import\s*{\s*supabase\s*}\s*from\s*['"]@\/lib\/supabase\/client['"]/g,
      `import { createClient } from '@/lib/supabase/client'`
    );
    
    // Add a const for supabase if needed
    if (!content.includes('const supabase = createClient()')) {
      // Add after imports
      content = content.replace(
        /(import[\s\S]*?from\s+['"][^'"]+['"];?\s*\n)(\n|(?!import))/,
        '$1\nconst supabase = createClient();\n$2'
      );
    }
    
    fs.writeFileSync(authContextPath, content);
    console.log('  ✅ Fixed AuthContext.tsx\n');
  }
}

// Fix 3: Update lib/supabase/index.ts exports
function fixSupabaseIndex() {
  console.log('📝 Fixing lib/supabase/index.ts...');
  const indexPath = path.join('lib', 'supabase', 'index.ts');
  
  if (fs.existsSync(indexPath)) {
    let content = fs.readFileSync(indexPath, 'utf8');
    
    // Check what's actually being exported from client.ts
    content = `// Re-export everything from client
export { createClient } from './client';

// Re-export server utilities
export * from './server';
export * from './server-helper';
export * from './middleware';

// Create singleton instance
import { createClient } from './client';
export const supabase = createClient();

// Helper functions
export function getSupabaseBrowserClient() {
  return createClient();
}

export function handleSupabaseError(error: any) {
  console.error('Supabase error:', error);
  return {
    error: error.message || 'An error occurred',
    data: null
  };
}
`;
    
    fs.writeFileSync(indexPath, content);
    console.log('  ✅ Fixed lib/supabase/index.ts\n');
  }
}

// Fix 4: Update menu.ts to use createClient
function fixSupabaseMenu() {
  console.log('📝 Fixing lib/supabase/menu.ts...');
  const menuPath = path.join('lib', 'supabase', 'menu.ts');
  
  if (fs.existsSync(menuPath)) {
    let content = fs.readFileSync(menuPath, 'utf8');
    
    // Replace getSupabaseBrowserClient with createClient
    content = content.replace(
      /import\s*{\s*getSupabaseBrowserClient\s*}\s*from\s*['"]\.\/client['"]/g,
      `import { createClient } from './client'`
    );
    
    // Replace usage
    content = content.replace(/getSupabaseBrowserClient\(\)/g, 'createClient()');
    
    fs.writeFileSync(menuPath, content);
    console.log('  ✅ Fixed lib/supabase/menu.ts\n');
  }
}

// Fix 5: Add dynamic export to API routes
function fixApiRoutes() {
  console.log('📝 Adding dynamic exports to API routes...');
  
  const apiRoutes = [
    'app/api/menu-debug/route.ts',
    'app/api/wolfpack/members/route.ts',
    'app/api/wolfpack/status/route.ts',
    'app/api/menu-items/route.ts',
    'app/api/locations/verify/route.ts',
    'app/api/admin/db-health-check/route.ts'
  ];
  
  apiRoutes.forEach(routePath => {
    if (fs.existsSync(routePath)) {
      let content = fs.readFileSync(routePath, 'utf8');
      
      // Add dynamic export if not present
      if (!content.includes('export const dynamic')) {
        content = `export const dynamic = 'force-dynamic';\n\n${content}`;
        fs.writeFileSync(routePath, content);
        console.log(`  ✅ Added dynamic export to ${routePath}`);
      }
    }
  });
}

// Run all fixes
try {
  fixProviders();
  fixAuthContext();
  fixSupabaseIndex();
  fixSupabaseMenu();
  fixApiRoutes();
  
  console.log('\n✨ All import issues fixed!');
  console.log('\nNow run:');
  console.log('  npm run build');
  console.log('\nThe warnings should be resolved, and your app should be ready to deploy! 🚀');
} catch (error) {
  console.error('❌ Error:', error);
}