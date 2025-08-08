# Required Environment Variables for Vercel Deployment

You need to add these environment variables in your Vercel project settings:
https://vercel.com/[your-username]/[your-project]/settings/environment-variables

## Supabase (Required)
```
NEXT_PUBLIC_SUPABASE_URL=https://tvnpgbjypnezoasbhbwx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR2bnBnYmp5cG5lem9hc2JoYnd4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDgzOTM0MDMsImV4cCI6MjA2Mzk2OTQwM30.5u3YkO5BvdJ3eabOzNhEuKDF2IvugTFE_EAvB-V7Y9c
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR2bnBnYmp5cG5lem9hc2JoYnd4Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0ODM5MzQwMywiZXhwIjoyMDYzOTY5NDAzfQ.coNBjmUMYmljAjdav4XZK3HyU1TwsvBiS4TUnV9xOv4
NEXT_PUBLIC_SUPABASE_PROJECT_ID=tvnpgbjypnezoasbhbwx
SUPABASE_PROJECT_ID=tvnpgbjypnezoasbhbwx
```

## Firebase (Required for Push Notifications)
```
NEXT_PUBLIC_FIREBASE_API_KEY=AIzaSyAUWCAf5xHLMitmAgI5gfy8d2o48pnjXeo
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=sidehustle-22a6a.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=sidehustle-22a6a
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=sidehustle-22a6a.firebasestorage.app
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=993911155207
NEXT_PUBLIC_FIREBASE_APP_ID=1:993911155207:web:610f19ac354d69540bd8a2
NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=G-RHT2310KWW
NEXT_PUBLIC_FIREBASE_VAPID_KEY=BLfFyuUgSyB2QnZNsNWLf2NmoL48rBzTcvYSk9bNbmg9q584FJBcNuUturt0UL-dV0n1QVFMllarMjJgt9qRNmc
```

## Firebase Admin (Server-side) - Create service-account.json
You also need to add FIREBASE_SERVICE_ACCOUNT_KEY with the contents of your Firebase service account JSON file.
Get this from Firebase Console > Project Settings > Service Accounts > Generate New Private Key

## App Configuration
```
NEXT_PUBLIC_APP_URL=https://your-vercel-domain.vercel.app
NEXT_PUBLIC_APP_NAME=Side Hustle
NEXT_PUBLIC_APP_DESCRIPTION=Wolfpack Bar Management System
NEXT_PUBLIC_ENABLE_PUSH_NOTIFICATIONS=true
```

## Location Configuration
```
NEXT_PUBLIC_PORTLAND_LAT=45.518537
NEXT_PUBLIC_PORTLAND_LNG=-122.678789
NEXT_PUBLIC_SALEM_LAT=44.940496
NEXT_PUBLIC_SALEM_LNG=-123.041395
NEXT_PUBLIC_PORTLAND_MAP_EMBED=https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d5591.159563601749!2d-122.67878942440281!3d45.518537171074854!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x54950bbb77279f67%3A0xfb5a916203b1c05a!2sSide%20Hustle!5e0!3m2!1sen!2sus!4v1751586230419!5m2!1sen!2sus
NEXT_PUBLIC_SALEM_MAP_EMBED=https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d5648.312048561214!2d-123.0413951244411!3d44.94049607107016!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x54bfff43800426c7%3A0xe32b22509988966e!2sSide%20Hustle%20Bar!5e0!3m2!1sen!2sus!4v1751586271162!5m2!1sen!2sus
```

## API Keys (Optional but may be needed for some features)
```
YOUTUBE_API_KEY=AIzaSyBWaMlHsqSDdPRBNc23I1I-ARQelgz89WU
GEMINI_API_KEY=AIzaSyBWaMlHsqSDdPRBNc23I1I-ARQelgz89WU
```

## How to Add in Vercel:

1. Go to your Vercel dashboard
2. Select your project
3. Click on "Settings" tab
4. Click on "Environment Variables" in the left sidebar
5. Add each variable one by one:
   - Enter the Key (e.g., `NEXT_PUBLIC_SUPABASE_URL`)
   - Enter the Value
   - Select which environments (Production, Preview, Development)
   - Click "Save"

6. After adding all variables, redeploy your application:
   - Go to the "Deployments" tab
   - Click the three dots on the latest deployment
   - Select "Redeploy"

## Important Notes:

- Variables starting with `NEXT_PUBLIC_` are exposed to the browser
- Variables without `NEXT_PUBLIC_` are server-side only (more secure)
- The `SUPABASE_SERVICE_ROLE_KEY` should NEVER have `NEXT_PUBLIC_` prefix
- Update `NEXT_PUBLIC_APP_URL` to your actual Vercel domain after deployment