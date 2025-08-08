# Fix for "Database error saving new user" - 500 Error on Signup

## The Problem
- Users get a 500 error during signup with "Database error saving new user"
- Missing database trigger to create user profiles when users sign up via Supabase Auth

## The Solution
A new migration file has been created that adds a trigger function to automatically create user profiles when someone signs up.

## Deploy the Fix

### Option 1: Using Supabase CLI (Recommended)
```bash
# Navigate to your project directory
cd /mnt/c/Users/mkahl/Desktop/damm/dammdude

# Run the migration
supabase db push
```

### Option 2: Manual SQL Execution
If you don't have Supabase CLI, copy and paste the contents of this file into your Supabase SQL editor:
`supabase/migrations/20250722000001_create_auth_user_trigger.sql`

## What the Fix Does

1. **Creates `handle_new_user()` Function**
   - Triggers automatically when someone signs up via Supabase Auth
   - Extracts user info from auth metadata (name, email)  
   - Creates a profile record in the `public.users` table
   - Sets appropriate role (admin for gthabarber1@gmail.com, user for others)

2. **Creates Database Trigger**
   - Fires `AFTER INSERT` on `auth.users`
   - Calls `handle_new_user()` function automatically

3. **Error Handling**
   - If profile creation fails, user signup still succeeds
   - Errors are logged as warnings, not failures

## Frontend Changes Made

1. **Removed Manual Profile Creation**: Frontend no longer tries to create profiles manually
2. **Added Small Delay**: 100ms delay after signup to let trigger complete
3. **Enhanced Error Handling**: Better error messages for users

## Testing the Fix

1. **Deploy the migration** (see options above)
2. **Try signing up** with a new email address
3. **Check the database** - user should appear in both `auth.users` and `public.users`
4. **No more 500 errors** should occur during signup

## Verification Queries

After deployment, you can verify the trigger exists:

```sql
-- Check if function exists
SELECT proname FROM pg_proc WHERE proname = 'handle_new_user';

-- Check if trigger exists  
SELECT trigger_name FROM information_schema.triggers 
WHERE trigger_name = 'on_auth_user_created';

-- Test signup and check both tables
SELECT auth.email, users.display_name 
FROM auth.users 
JOIN public.users ON auth.users.id = public.users.auth_id;
```

## Important Notes

- **Backward Compatible**: Existing users are unaffected
- **Legacy Users**: The sign-in flow still has profile creation for users who signed up before this fix
- **Admin Detection**: gthabarber1@gmail.com automatically gets admin role
- **Safe Deployment**: If trigger fails, user signup still succeeds (just without profile)

The signup flow should now work perfectly without any 500 errors! 🎉