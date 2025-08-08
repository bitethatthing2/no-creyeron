#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

console.log('\n🔧 Supabase Configuration Setup\n');
console.log('The current Supabase URL (tvnpgbjypnezoasbhbwx.supabase.co) is not resolving.');
console.log('This script will help you update your Supabase configuration.\n');

const envPath = path.join(__dirname, '..', '.env.local');

function question(query) {
  return new Promise((resolve) => rl.question(query, resolve));
}

async function updateEnvFile() {
  console.log('To fix this, you need to either:');
  console.log('1. Create a new Supabase project at https://supabase.com/dashboard');
  console.log('2. Use an existing Supabase project\n');

  const projectUrl = await question('Enter your Supabase project URL (e.g., https://yourproject.supabase.co): ');
  const anonKey = await question('Enter your Supabase anon/public key: ');
  const serviceKey = await question('Enter your Supabase service role key: ');

  // Extract project ID from URL
  const projectId = projectUrl.match(/https:\/\/([^.]+)\.supabase\.co/)?.[1];
  
  if (!projectId) {
    console.error('❌ Invalid Supabase URL format. Expected: https://yourproject.supabase.co');
    rl.close();
    return;
  }

  // Read current env file
  let envContent = '';
  try {
    envContent = fs.readFileSync(envPath, 'utf8');
  } catch (error) {
    console.log('Creating new .env.local file...');
  }

  // Update Supabase-related variables
  const updates = {
    'NEXT_PUBLIC_SUPABASE_URL': projectUrl,
    'NEXT_PUBLIC_SUPABASE_ANON_KEY': anonKey,
    'SUPABASE_SERVICE_ROLE_KEY': serviceKey,
    'NEXT_PUBLIC_SUPABASE_PROJECT_ID': projectId,
    'SUPABASE_PROJECT_ID': projectId
  };

  // Update or add each variable
  for (const [key, value] of Object.entries(updates)) {
    const regex = new RegExp(`^${key}=.*$`, 'gm');
    if (regex.test(envContent)) {
      envContent = envContent.replace(regex, `${key}=${value}`);
    } else {
      envContent += `\n${key}=${value}`;
    }
  }

  // Write updated content
  fs.writeFileSync(envPath, envContent);
  
  console.log('\n✅ Configuration updated successfully!');
  console.log('\nNext steps:');
  console.log('1. Run the database migrations in your Supabase project:');
  console.log('   - Go to the SQL Editor in your Supabase dashboard');
  console.log('   - Run each .sql file from the supabase/migrations folder in order');
  console.log('2. Restart your development server');
  console.log('3. Try logging in again\n');

  // Create a migration helper script
  const migrationScript = `-- Run these migrations in order in your Supabase SQL Editor:

-- 1. First, run all migration files from supabase/migrations/ folder in chronological order
-- 2. Make sure to run the RLS policy fix:

-- Fix users table RLS policies for authentication
BEGIN;

-- Drop existing restrictive policies
DROP POLICY IF EXISTS "Users can view their own profile" ON public.users;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.users;

-- Create new policies that allow proper authentication flow
CREATE POLICY "Enable read access for all users" ON public.users
    FOR SELECT USING (true);

CREATE POLICY "Enable insert for authentication" ON public.users
    FOR INSERT WITH CHECK (auth.uid() = auth_id);

CREATE POLICY "Enable update for users based on auth_id" ON public.users
    FOR UPDATE USING (auth.uid() = auth_id);

-- Only admins can delete users
CREATE POLICY "Enable delete for admins only" ON public.users
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM public.users
            WHERE auth_id = auth.uid()
            AND role = 'admin'
        )
    );

COMMIT;

-- 3. Create a test user (optional):
-- Go to Authentication > Users in Supabase dashboard and create a user with:
-- Email: test@test.com
-- Password: password123
`;

  fs.writeFileSync(path.join(__dirname, '..', 'setup-database.sql'), migrationScript);
  console.log('Created setup-database.sql with essential migrations.');
  
  rl.close();
}

updateEnvFile().catch(console.error);