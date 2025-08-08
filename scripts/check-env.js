#!/usr/bin/env node

// Environment Variable Checker
// Run with: node scripts/check-env.js

const fs = require('fs');
const path = require('path');

console.log('🔍 ENVIRONMENT VARIABLE CHECKER');
console.log('================================\n');

// Check if .env.local exists
const envLocalPath = path.join(process.cwd(), '.env.local');
const envExists = fs.existsSync(envLocalPath);

console.log('1️⃣ Environment File Check:');
console.log(`   .env.local exists: ${envExists ? '✅ Yes' : '❌ No'}`);

if (envExists) {
  try {
    const envContent = fs.readFileSync(envLocalPath, 'utf8');
    const lines = envContent.split('\n').filter(line => line.trim() && !line.startsWith('#'));
    console.log(`   Variables found: ${lines.length}`);
  } catch (error) {
    console.log(`   Error reading file: ${error.message}`);
  }
} else {
  console.log('   ⚠️  Create .env.local in your project root');
}

console.log('\n2️⃣ Required Variables Check:');

const requiredVars = [
  'NEXT_PUBLIC_SUPABASE_URL',
  'NEXT_PUBLIC_SUPABASE_ANON_KEY',
  'SUPABASE_SERVICE_ROLE_KEY'
];

const missingVars = [];

requiredVars.forEach(varName => {
  const value = process.env[varName];
  if (value) {
    const displayValue = varName.includes('KEY') 
      ? `${value.substring(0, 10)}...${value.substring(value.length - 4)}`
      : value;
    console.log(`   ${varName}: ✅ ${displayValue}`);
  } else {
    console.log(`   ${varName}: ❌ Missing`);
    missingVars.push(varName);
  }
});

console.log('\n3️⃣ Analysis:');

if (missingVars.length === 0) {
  console.log('   ✅ All required variables are present');
} else {
  console.log(`   ❌ ${missingVars.length} variables are missing:`);
  missingVars.forEach(varName => {
    console.log(`      - ${varName}`);
  });
}

console.log('\n4️⃣ Fix Instructions:');

if (!envExists || missingVars.length > 0) {
  console.log(`
   Create/update .env.local with:
   
   NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here
   SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
   
   Get these values from:
   1. Go to your Supabase project
   2. Settings > API
   3. Copy the Project URL, anon/public key, and service_role key
   4. Restart your development server after updating
`);
} else {
  console.log('   🎉 Configuration looks good!');
  console.log('   If you\'re still getting API errors, try restarting your dev server.');
}

console.log('\n5️⃣ Common Issues:');
console.log(`
   - API key errors usually mean missing/incorrect keys
   - Service role key is needed for server-side menu loading
   - Make sure .env.local is in your project root (not in a subfolder)
   - Restart your development server after changing environment variables
   - Don't commit .env.local to git (it should be in .gitignore)
`);

// If this is run as part of the build/dev process, exit with error code
if (missingVars.length > 0) {
  process.exit(1);
}