#!/usr/bin/env node

/**
 * Environment Validation Script
 * Validates that all required environment variables are properly configured
 */

const { z } = require('zod');
const path = require('path');
const fs = require('fs');

// Define the same schema as in app.config.ts
const environmentSchema = z.object({
  // Node.js Environment
  NODE_ENV: z.enum(['development', 'staging', 'production']).default('development'),
  
  // Application Configuration
  NEXT_PUBLIC_APP_NAME: z.string().min(1, 'Application name is required').default('Side Hustle Bar'),
  NEXT_PUBLIC_APP_VERSION: z.string().optional(),
  NEXT_PUBLIC_APP_URL: z.string().url().optional(),
  
  // Supabase Configuration
  NEXT_PUBLIC_SUPABASE_URL: z.string().url('Invalid Supabase URL'),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1, 'Supabase anon key is required'),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1, 'Supabase service role key is required'),
  SUPABASE_PROJECT_ID: z.string().min(1, 'Supabase project ID is required'),
  
  // Firebase Configuration
  NEXT_PUBLIC_FIREBASE_API_KEY: z.string().min(1, 'Firebase API key is required'),
  NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN: z.string().min(1, 'Firebase auth domain is required'),
  NEXT_PUBLIC_FIREBASE_PROJECT_ID: z.string().min(1, 'Firebase project ID is required'),
  NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET: z.string().min(1, 'Firebase storage bucket is required'),
  NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID: z.string().min(1, 'Firebase messaging sender ID is required'),
  NEXT_PUBLIC_FIREBASE_APp_user_id: z.string().min(1, 'Firebase app ID is required'),
  NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID: z.string().optional(),
  NEXT_PUBLIC_FIREBASE_VAPID_KEY: z.string().min(1, 'Firebase VAPID key is required'),
  
  // Optional External Services
  OPENAI_API_KEY: z.string().optional(),
  GOOGLE_MAPS_API_KEY: z.string().optional(),
});

function loadEnvFile(filename) {
  const envPath = path.join(process.cwd(), filename);
  if (!fs.existsSync(envPath)) {
    return {};
  }
  
  const envContent = fs.readFileSync(envPath, 'utf8');
  const envVars = {};
  
  envContent.split('\n').forEach(line => {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith('#')) {
      const [key, ...valueParts] = trimmed.split('=');
      if (key && valueParts.length > 0) {
        const value = valueParts.join('=').replace(/^["']|["']$/g, '');
        envVars[key] = value;
      }
    }
  });
  
  return envVars;
}

function validateEnvironment() {
  console.log('🔍 Validating environment configuration...\n');
  
  // Load environment variables from multiple sources
  const envLocal = loadEnvFile('.env.local');
  const envFile = loadEnvFile('.env');
  const processEnv = process.env;
  
  // Merge environment variables (process.env takes priority)
  const allEnvVars = {
    ...envFile,
    ...envLocal,
    ...processEnv,
  };
  
  try {
    const validatedEnv = environmentSchema.parse(allEnvVars);
    
    console.log('✅ Environment validation passed!');
    console.log('\n📊 Configuration Summary:');
    console.log(`   Environment: ${validatedEnv.NODE_ENV}`);
    console.log(`   App Name: ${validatedEnv.NEXT_PUBLIC_APP_NAME}`);
    console.log(`   Supabase URL: ${validatedEnv.NEXT_PUBLIC_SUPABASE_URL}`);
    console.log(`   Firebase Project: ${validatedEnv.NEXT_PUBLIC_FIREBASE_PROJECT_ID}`);
    
    if (validatedEnv.OPENAI_API_KEY) {
      console.log('   🤖 OpenAI integration enabled');
    }
    
    if (validatedEnv.GOOGLE_MAPS_API_KEY) {
      console.log('   🗺️  Google Maps integration enabled');
    }
    
    console.log('\n🚀 Ready for development!');
    return true;
  } catch (error) {
    if (error instanceof z.ZodError) {
      console.log('❌ Environment validation failed:\n');
      
      error.errors.forEach(err => {
        const field = err.path.join('.');
        console.log(`   ❌ ${field}: ${err.message}`);
      });
      
      console.log('\n💡 To fix this:');
      console.log('1. Copy .env.example to .env.local');
      console.log('2. Fill in the required environment variables');
      console.log('3. Run this script again to validate');
      console.log('\n📖 See .env.example for detailed instructions');
      
      return false;
    }
    
    console.error('❌ Unexpected error during validation:', error);
    return false;
  }
}

function checkEnvFiles() {
  const envLocalExists = fs.existsSync('.env.local');
  const envExists = fs.existsSync('.env');
  const envExampleExists = fs.existsSync('.env.example');
  
  console.log('📁 Environment file status:');
  console.log(`   .env.example: ${envExampleExists ? '✅ exists' : '❌ missing'}`);
  console.log(`   .env: ${envExists ? '✅ exists' : '⚠️  not found'}`);
  console.log(`   .env.local: ${envLocalExists ? '✅ exists' : '❌ missing'}`);
  console.log('');
  
  if (!envExampleExists) {
    console.log('⚠️  .env.example is missing - this file should contain template environment variables');
  }
  
  if (!envLocalExists && !envExists) {
    console.log('⚠️  No environment file found. Create .env.local with your configuration.');
    console.log('💡 You can copy .env.example as a starting point.');
    return false;
  }
  
  return true;
}

// Main execution
if (require.main === module) {
  console.log('🔧 Environment Configuration Validator\n');
  
  const hasEnvFiles = checkEnvFiles();
  
  if (hasEnvFiles) {
    const isValid = validateEnvironment();
    process.exit(isValid ? 0 : 1);
  } else {
    process.exit(1);
  }
}

module.exports = { validateEnvironment, checkEnvFiles };