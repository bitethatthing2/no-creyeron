// Simple, safe configuration without runtime validation
// Runtime validation should only happen in build scripts, not during app execution

// Helper function to get environment variable with fallback
function getEnvVar(name: string, fallback?: string): string {
  const value = process.env[name];
  if (value) return value;
  if (fallback !== undefined) return fallback;
  return '';
}

// Helper function for required environment variables
function getRequiredEnvVar(name: string): string {
  const value = process.env[name];
  if (!value) {
    // Only log error in development, not production
    if (process.env.NODE_ENV === 'development') {
      console.error(`Missing required environment variable: ${name}`);
    }
    return '';
  }
  return value;
}

// Export configuration objects directly from environment
export const env = {
  // Node.js Environment
  NODE_ENV: (process.env.NODE_ENV || 'development') as 'development' | 'staging' | 'production',
  
  // Application Configuration
  NEXT_PUBLIC_APP_NAME: getEnvVar('NEXT_PUBLIC_APP_NAME', 'Side Hustle Bar'),
  NEXT_PUBLIC_APP_VERSION: getEnvVar('NEXT_PUBLIC_APP_VERSION', '1.0.0'),
  NEXT_PUBLIC_APP_URL: getEnvVar('NEXT_PUBLIC_APP_URL'),
  
  // Supabase Configuration
  NEXT_PUBLIC_SUPABASE_URL: getRequiredEnvVar('NEXT_PUBLIC_SUPABASE_URL'),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: getRequiredEnvVar('NEXT_PUBLIC_SUPABASE_ANON_KEY'),
  SUPABASE_SERVICE_ROLE_KEY: getEnvVar('SUPABASE_SERVICE_ROLE_KEY'),
  SUPABASE_PROJECT_ID: getEnvVar('SUPABASE_PROJECT_ID'),
  
  // Firebase Configuration
  NEXT_PUBLIC_FIREBASE_API_KEY: getEnvVar('NEXT_PUBLIC_FIREBASE_API_KEY'),
  NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN: getEnvVar('NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN'),
  NEXT_PUBLIC_FIREBASE_PROJECT_ID: getEnvVar('NEXT_PUBLIC_FIREBASE_PROJECT_ID'),
  NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET: getEnvVar('NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET'),
  NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID: getEnvVar('NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID'),
  NEXT_PUBLIC_FIREBASE_APp_user_id: getEnvVar('NEXT_PUBLIC_FIREBASE_APp_user_id'),
  NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID: getEnvVar('NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID'),
  NEXT_PUBLIC_FIREBASE_VAPID_KEY: getEnvVar('NEXT_PUBLIC_FIREBASE_VAPID_KEY'),
  
  // Optional External Services
  OPENAI_API_KEY: getEnvVar('OPENAI_API_KEY'),
  GOOGLE_MAPS_API_KEY: getEnvVar('GOOGLE_MAPS_API_KEY'),
};

// Type-safe configuration objects
export const appConfig = {
  name: env.NEXT_PUBLIC_APP_NAME,
  version: env.NEXT_PUBLIC_APP_VERSION || '1.0.0',
  url: env.NEXT_PUBLIC_APP_URL,
  environment: env.NODE_ENV,
  isProduction: env.NODE_ENV === 'production',
  isDevelopment: env.NODE_ENV === 'development',
  isStaging: env.NODE_ENV === 'staging',
} as const;

export const supabaseConfig = {
  url: env.NEXT_PUBLIC_SUPABASE_URL,
  anonKey: env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  serviceRoleKey: env.SUPABASE_SERVICE_ROLE_KEY,
  projectId: env.SUPABASE_PROJECT_ID,
} as const;

export const firebaseConfig = {
  apiKey: env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: env.NEXT_PUBLIC_FIREBASE_APp_user_id,
  measurementId: env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
  vapidKey: env.NEXT_PUBLIC_FIREBASE_VAPID_KEY,
} as const;

// Configuration is ready to use without runtime validation
// For environment validation, use: npm run env:validate