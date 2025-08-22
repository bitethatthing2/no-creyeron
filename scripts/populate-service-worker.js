/* eslint-disable */
const fs = require('fs');
const path = require('path');

console.log('Populating service worker with environment variables...');

// Try to load .env.local if it exists and dotenv is available, but don't fail if it doesn't
try {
  const dotenv = require('dotenv');
  const envPath = path.join(__dirname, '..', '.env.local');
  if (fs.existsSync(envPath)) {
    dotenv.config({ path: envPath });
    console.log('✅ Loaded .env.local file');
  } else {
    console.log('ℹ️  No .env.local file found, using environment variables');
  }
} catch (e) {
  console.log('ℹ️  dotenv not available, using environment variables directly');
}

// Path to the service worker file
const swPath = path.join(__dirname, '..', 'public', 'firebase-messaging-sw.js');

// Check if service worker file exists
if (!fs.existsSync(swPath)) {
  console.error('Error: firebase-messaging-sw.js not found at', swPath);
  process.exit(1);
}

// Read the service worker file
let swContent = fs.readFileSync(swPath, 'utf8');

// Firebase config values from environment variables
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || '',
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || '',
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || '',
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || '',
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || '',
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || '',
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID || ''
};

// Log the config being used (but mask sensitive values)
console.log('Firebase config being applied:');
console.log({
  apiKey: firebaseConfig.apiKey ? `${firebaseConfig.apiKey.substring(0, 10)}...` : 'NOT SET',
  authDomain: firebaseConfig.authDomain || 'NOT SET',
  projectId: firebaseConfig.projectId || 'NOT SET', 
  storageBucket: firebaseConfig.storageBucket || 'NOT SET',
  messagingSenderId: firebaseConfig.messagingSenderId || 'NOT SET',
  appId: firebaseConfig.appId ? `${firebaseConfig.appId.substring(0, 20)}...` : 'NOT SET',
  measurementId: firebaseConfig.measurementId || 'NOT SET'
});

// Replace the Firebase config in the service worker
const configRegex = /firebase\.initializeApp\(\{[\s\S]*?\}\);/;
const newConfigString = `firebase.initializeApp({
  apiKey: "${firebaseConfig.apiKey}",
  authDomain: "${firebaseConfig.authDomain}",
  projectId: "${firebaseConfig.projectId}",
  storageBucket: "${firebaseConfig.storageBucket}",
  messagingSenderId: "${firebaseConfig.messagingSenderId}",
  appId: "${firebaseConfig.appId}"
});`;

if (!configRegex.test(swContent)) {
  console.error('Error: Could not find Firebase config pattern in service worker file');
  console.error('Looking for: firebase.initializeApp({...});');
  process.exit(1);
}

// Replace the config
swContent = swContent.replace(configRegex, newConfigString);

// Write the updated service worker file
fs.writeFileSync(swPath, swContent, 'utf8');

console.log('✅ Service worker successfully populated with environment variables');

// Warn if any critical values are missing
const missingValues = Object.entries(firebaseConfig)
  .filter(([key, value]) => key !== 'measurementId' && !value)
  .map(([key]) => key);

if (missingValues.length > 0) {
  console.warn('⚠️  Warning: Missing Firebase environment variables:', missingValues.join(', '));
  console.warn('   Make sure these are set in your .env.local file');
}
