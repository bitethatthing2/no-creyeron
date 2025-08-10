# Firebase Push Notifications Setup Guide

## Frontend Implementation Status ✅

Your frontend push notification implementation is **correctly configured** and ready to use. The following components have been verified:

### ✅ Completed Items

1. **Firebase Configuration**
   - Environment variables are properly set in `.env.local`
   - Firebase config matches between service worker and main app
   - VAPID key is configured for web push

2. **Service Worker (`firebase-messaging-sw.js`)**
   - Correctly handles background messages
   - Implements notification click handlers
   - Routes users to appropriate pages based on notification type

3. **Unified Notification Service**
   - Updated to use the new `upsert_fcm_token` RPC function
   - Properly handles user authentication
   - Prevents duplicate token storage
   - Includes comprehensive device information

4. **Database Integration**
   - RLS policies fixed for `user_fcm_tokens` table
   - Unique constraint prevents duplicate tokens
   - Performance indexes added for better query speed
   - Helper function `upsert_fcm_token()` handles token management

## ⚠️ Required: Firebase Admin SDK Setup

To enable server-side push notifications, you need to add Firebase Admin SDK credentials:

### Steps to Get Firebase Admin Credentials:

1. **Go to Firebase Console**
   - Visit: https://console.firebase.google.com/
   - Select your project: `sidehustle-22a6a`

2. **Navigate to Service Accounts**
   - Click the gear icon ⚙️ next to "Project Overview"
   - Select "Project settings"
   - Go to the "Service accounts" tab

3. **Generate Private Key**
   - Click "Generate new private key"
   - Click "Generate key" in the confirmation dialog
   - A JSON file will be downloaded

4. **Extract Credentials from JSON**
   Open the downloaded JSON file and find these fields:
   ```json
   {
     "client_email": "firebase-adminsdk-xxxxx@sidehustle-22a6a.iam.gserviceaccount.com",
     "private_key": "-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
   }
   ```

5. **Update `.env.local`**
   Replace the placeholder values with your actual credentials:
   ```env
   FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxxxx@sidehustle-22a6a.iam.gserviceaccount.com
   FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----"
   ```

   **Important**: Keep the quotes around the private key and preserve the `\n` characters.

6. **Deploy to Vercel**
   Add these same environment variables to your Vercel project:
   - Go to: https://vercel.com/dashboard
   - Select your project
   - Go to Settings → Environment Variables
   - Add both `FIREBASE_CLIENT_EMAIL` and `FIREBASE_PRIVATE_KEY`

## Testing Push Notifications

Once you've added the Firebase Admin credentials:

1. **Test Permission Request**
   ```javascript
   // In browser console
   await notificationService.requestNotificationPermission()
   ```

2. **Test Sending a Notification**
   ```javascript
   // Send a test notification to yourself
   await notificationService.createNotification(
     'your-user-id',
     {
       title: 'Test Notification',
       body: 'This is a test push notification',
       type: 'info',
       sendPush: true
     }
   )
   ```

## Troubleshooting

### Common Issues:

1. **406 Not Acceptable Error** - ✅ FIXED
   - This was caused by RLS policies
   - Now resolved with the new RLS configuration

2. **No FCM Token Generated**
   - Check browser console for errors
   - Ensure notifications are allowed in browser settings
   - Clear browser cache and try again

3. **Push Notifications Not Received**
   - Verify Firebase Admin credentials are correct
   - Check that the user has an active FCM token in the database
   - Ensure the service worker is registered (check Application tab in DevTools)

4. **Service Worker Not Registering**
   - Verify HTTPS is used (or localhost for development)
   - Check that `/firebase-messaging-sw.js` is accessible
   - Clear browser cache and service workers

## Security Notes

- **NEVER** commit Firebase Admin credentials to Git
- Keep `.env.local` in `.gitignore`
- Use environment variables in production
- Rotate credentials periodically
- Monitor Firebase Console for unusual activity

## Next Steps

1. Add Firebase Admin credentials to `.env.local`
2. Deploy environment variables to Vercel
3. Test the complete notification flow
4. Monitor error logs for any issues

## Support

If you encounter issues after following this guide:
1. Check browser console for errors
2. Review Vercel function logs
3. Verify Firebase Console shows active users
4. Check Supabase logs for database errors