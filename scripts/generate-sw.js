// Build script to generate service worker with environment variables
const fs = require('fs');
const path = require('path');

function generateServiceWorker() {
  console.log('[Build] Generating service worker with environment variables...');
  
  // Read the template service worker
  const templatePath = path.join(__dirname, '../public/firebase-messaging-sw.js');
  const template = fs.readFileSync(templatePath, 'utf8');
  
  // Environment variables to inject
  const envVars = {
    '${NEXT_PUBLIC_FIREBASE_API_KEY}': process.env.NEXT_PUBLIC_FIREBASE_API_KEY || '',
    '${NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN}': process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || '',
    '${NEXT_PUBLIC_FIREBASE_PROJECT_ID}': process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || '',
    '${NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET}': process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || '',
    '${NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID}': process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || '',
    '${NEXT_PUBLIC_FIREBASE_APP_ID}': process.env.NEXT_PUBLIC_FIREBASE_APP_ID || ''
  };
  
  // Replace placeholders with actual values
  let generatedSW = template;
  Object.entries(envVars).forEach(([placeholder, value]) => {
    generatedSW = generatedSW.replace(new RegExp(placeholder, 'g'), value);
  });
  
  // Write the generated service worker to .next/static
  const outputDir = path.join(__dirname, '../.next/static');
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }
  
  const outputPath = path.join(outputDir, 'firebase-messaging-sw.js');
  fs.writeFileSync(outputPath, generatedSW);
  
  console.log('[Build] Service worker generated successfully at:', outputPath);
  
  // Also copy to public directory for immediate use
  fs.writeFileSync(templatePath, generatedSW);
  console.log('[Build] Service worker updated in public directory');
}

// Run if called directly
if (require.main === module) {
  generateServiceWorker();
}

module.exports = generateServiceWorker;