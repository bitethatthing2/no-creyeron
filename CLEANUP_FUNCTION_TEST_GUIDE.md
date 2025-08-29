# Database Cleanup Function - Testing Guide

## Overview
This guide provides comprehensive testing instructions for the new database cleanup edge function integration.

## Components Added
1. **`/lib/hooks/useCleanup.ts`** - React hook for cleanup function
2. **`/components/admin/DatabaseCleanup.tsx`** - Main cleanup UI component
3. **`/components/admin/CleanupDebugPanel.tsx`** - Debug/test component
4. **`test-cleanup-function.js`** - Node.js test script
5. Updated **`/app/admin/dashboard/page.tsx`** - Integrated cleanup component

## Testing Methods

### Method 1: Quick Node.js Test
Test basic connectivity and authentication:

```bash
# Run the test script
node test-cleanup-function.js
```

This will test:
- Function reachability
- Authentication requirements
- CORS configuration

### Method 2: Debug Panel in Browser

1. **Add the debug panel to admin dashboard:**

```tsx
// In /app/admin/dashboard/page.tsx, add after DatabaseCleanup:
import { CleanupDebugPanel } from '@/components/admin/CleanupDebugPanel';

// In the component, add:
<div className="mt-8">
  <CleanupDebugPanel />
</div>
```

2. **Navigate to admin dashboard:**
   - Go to `/admin/dashboard`
   - Look for the "Cleanup Function Debug Panel"

3. **Check authentication status:**
   - Verify you're logged in
   - Verify your role shows as "Admin"
   - Verify access token is present

4. **Click "Test Cleanup Function"**
   - Watch the console for debug logs
   - Check the response in the UI

### Method 3: Manual Browser Testing

1. **Login as admin user:**
   ```
   Email: your-admin@email.com
   Password: your-password
   ```

2. **Navigate to admin dashboard:**
   ```
   http://localhost:3000/admin/dashboard
   ```

3. **Open browser console (F12)**

4. **Find "Database Cleanup" section**

5. **Click "Run Database Cleanup"**

6. **Confirm the action in the dialog**

7. **Monitor console for:**
   ```javascript
   // You should see:
   🔍 Debug Info:
   - User ID: xxx
   - User Role: admin
   - Session exists: true
   - Access Token: Present
   
   📊 Test Result: {...}
   ```

### Method 4: Direct API Test with cURL

1. **Get your auth token:**
   - Login to the app
   - Open browser console
   - Run: `(await supabase.auth.getSession()).data.session.access_token`
   - Copy the token

2. **Test with cURL:**
   ```bash
   curl -X POST \
     'https://tvnpgbjypnezoasbhbwx.supabase.co/functions/v1/cleanup-scheduler' \
     -H 'Authorization: Bearer YOUR_TOKEN_HERE' \
     -H 'Content-Type: application/json' \
     -v
   ```

## Expected Responses

### Success (200 OK):
```json
{
  "success": true,
  "cleanup_results": {
    "posts_deleted": 0,
    "read_messages_deleted": 0,
    "unread_messages_deleted": 0,
    "storage_files_deleted": 0,
    "inactive_tokens_deleted": 0,
    "old_notifications_deleted": 0,
    "orphaned_interactions_deleted": 0,
    "orphaned_comments_deleted": 0,
    "orphaned_receipts_deleted": 0
  },
  "cleaned_at": "2025-08-29T12:00:00.000Z",
  "total_items_cleaned": 0
}
```

### Authentication Error (401):
```json
{
  "error": "Authentication required"
}
```

### Authorization Error (403):
```json
{
  "error": "Admin access required"
}
```

## Troubleshooting

### Issue: 401 Unauthorized
**Solution:** 
- Ensure you're logged in
- Check if session token is present
- Try logging out and back in

### Issue: 403 Forbidden
**Solution:**
- Verify user has admin role in database:
  ```sql
  SELECT role FROM users WHERE email = 'your-email@example.com';
  ```
- Update role if needed:
  ```sql
  UPDATE users SET role = 'admin' WHERE email = 'your-email@example.com';
  ```

### Issue: Network Error
**Solution:**
- Check Supabase URL is correct
- Verify internet connection
- Check if edge function is deployed

### Issue: CORS Error
**Solution:**
- Ensure you're testing from correct domain
- Check browser console for specific CORS errors
- Verify edge function CORS configuration

## Database Verification

To verify cleanup actually works, you can:

1. **Check database before cleanup:**
   ```sql
   -- Count old posts
   SELECT COUNT(*) FROM content_posts 
   WHERE created_at < NOW() - INTERVAL '48 hours';
   
   -- Count old messages
   SELECT COUNT(*) FROM chat_messages 
   WHERE created_at < NOW() - INTERVAL '48 hours' 
   AND read = true;
   ```

2. **Run cleanup function**

3. **Check database after cleanup:**
   - Run the same queries
   - Verify counts have decreased

## Admin User Setup

If you need to create an admin user for testing:

1. **Register a new user normally**

2. **Update their role in Supabase:**
   ```sql
   UPDATE users 
   SET role = 'admin' 
   WHERE email = 'test-admin@example.com';
   ```

3. **Verify the update:**
   ```sql
   SELECT id, email, role 
   FROM users 
   WHERE email = 'test-admin@example.com';
   ```

## Console Commands for Testing

Run these in browser console while on the admin page:

```javascript
// Check current user
const { data: { user } } = await supabase.auth.getUser();
console.log('Current user:', user);

// Check user role
const { data: userData } = await supabase
  .from('users')
  .select('role')
  .eq('auth_id', user.id)
  .single();
console.log('User role:', userData?.role);

// Get session token
const { data: { session } } = await supabase.auth.getSession();
console.log('Session token:', session?.access_token);

// Test cleanup function directly
const response = await fetch(
  `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/cleanup-scheduler`,
  {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${session.access_token}`,
      'Content-Type': 'application/json'
    }
  }
);
const result = await response.json();
console.log('Cleanup result:', result);
```

## Safety Notes

⚠️ **IMPORTANT**: The cleanup function permanently deletes data:
- Always test in development first
- Ensure you have backups before running in production
- The cleanup cannot be undone

## Support

If you encounter issues:
1. Check browser console for detailed errors
2. Verify all authentication requirements
3. Check Supabase logs for edge function errors
4. Contact backend team if function returns 500 errors