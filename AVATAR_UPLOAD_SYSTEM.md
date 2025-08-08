# Avatar Upload System Documentation

## CRITICAL: DO NOT MODIFY WITHOUT UNDERSTANDING THIS DOCUMENTATION

This document explains the avatar upload system implementation and the specific fixes that were applied to make it work with Supabase RLS policies.

## System Overview

### Storage Structure
- **Bucket Name**: `user-avatars` (NOT `user-uploads`)
- **File Path Structure**: `{user_auth_id}/{timestamp}.{extension}`
- **Example**: `591aeaf7-71e6-4015-be21-9b804791ccb2/1753221968227.png`

### Key Components
- **Main File**: `app/(main)/wolfpack/profile/edit/page.tsx`
- **Upload Function**: `handleImageUpload()`
- **Storage Bucket**: `user-avatars` in Supabase

## CRITICAL FIXES APPLIED

### 1. RLS Policy Compliance Fix
**Problem**: Upload was failing with "new row violates row-level security policy" error (403 Unauthorized)

**Root Cause**: The RLS policy for `user-avatars` bucket expects files to be uploaded in a folder structure where the first folder matches the authenticated user's ID:
```sql
-- RLS Policy Check Expression:
((bucket_id = 'user-avatars'::text) AND ((auth.uid())::text = (storage.foldername(name))[1]))
```

**Solution Applied**:
```typescript
// BEFORE (BROKEN):
const fileName = `${authUser.id}_${Date.now()}.${fileExt}`;
await supabase.storage.from('user-avatars').upload(fileName, file);
// This uploaded to: "591aeaf7-71e6-4015-be21-9b804791ccb2_1753221968227.png"
// RLS check failed because storage.foldername(name)[1] was undefined

// AFTER (WORKING):
const fileName = `${Date.now()}.${fileExt}`;
const filePath = `${authUser.id}/${fileName}`;
await supabase.storage.from('user-avatars').upload(filePath, file);
// This uploads to: "591aeaf7-71e6-4015-be21-9b804791ccb2/1753221968227.png"
// RLS check passes because storage.foldername(name)[1] = "591aeaf7-71e6-4015-be21-9b804791ccb2"
```

### 2. Bucket Name Correction
**Problem**: Code was using `user-uploads` bucket instead of the correct `user-avatars` bucket

**Solution Applied**:
```typescript
// BEFORE:
.from('user-uploads')

// AFTER:
.from('user-avatars')
```

### 3. Consistent Path Usage
**Problem**: Inconsistent use of fileName vs filePath for upload and URL generation

**Solution Applied**:
```typescript
// Upload
await supabase.storage.from('user-avatars').upload(filePath, file);

// Get Public URL
const { data: { publicUrl } } = supabase.storage
  .from('user-avatars')
  .getPublicUrl(filePath);
```

## Current Working Implementation

### Upload Flow (DO NOT MODIFY):
1. User selects image file
2. File validation (type: JPEG/PNG/WebP, size: max 2MB)
3. Generate unique filename: `{timestamp}.{extension}`
4. Create file path: `{user_auth_id}/{filename}`
5. Upload to `user-avatars` bucket with `upsert: true`
6. Generate public URL using the same file path
7. Update profile state with new avatar URL

### File Naming Convention:
- **Format**: `{user_auth_id}/{timestamp}.{file_extension}`
- **Example**: `591aeaf7-71e6-4015-be21-9b804791ccb2/1753221968227.png`
- **Why This Format**: 
  - User folder isolation (required by RLS)
  - Timestamp prevents name collisions
  - Auth ID ensures users can only access their own files

## Security Features

### Row Level Security (RLS)
The `user-avatars` bucket has RLS policies that:
- Only allow authenticated users to upload
- Require uploads to go to a folder matching the user's auth ID
- Prevent users from accessing other users' avatar folders

### File Validation
- **Allowed Types**: `image/jpeg`, `image/jpg`, `image/png`, `image/webp`
- **Max Size**: 2MB (2,097,152 bytes)
- **Client-side validation**: Prevents unnecessary upload attempts

## IMPORTANT WARNINGS

### DO NOT CHANGE:
1. **Bucket name**: Must remain `user-avatars`
2. **File path structure**: Must be `{user_auth_id}/{filename}`
3. **RLS policy compliance**: Any change that breaks the folder structure will cause 403 errors
4. **Upload and getPublicUrl**: Both must use the same `filePath` variable

### Common Mistakes to Avoid:
1. **Don't upload to root**: `fileName` instead of `filePath` breaks RLS
2. **Don't change bucket**: `user-uploads` doesn't exist or has wrong policies
3. **Don't hardcode paths**: Always use `authUser.id` for folder name
4. **Don't skip validation**: File type/size validation prevents errors

## Testing Checklist

Before modifying this system, ensure:
- [ ] User can upload JPEG/PNG/WebP images
- [ ] File size validation works (rejects >2MB)
- [ ] File type validation works (rejects non-images)
- [ ] Upload creates correct folder structure: `{user_id}/{filename}`
- [ ] Public URL generation works
- [ ] Profile image updates in UI immediately
- [ ] No RLS policy violations (403 errors)
- [ ] No bucket access errors

## Error Troubleshooting

### 403 Unauthorized / RLS Policy Violation:
- Check file path structure includes user folder
- Verify bucket name is `user-avatars`
- Ensure user is authenticated

### 400 Bad Request:
- Check file validation (type/size)
- Verify filename doesn't contain invalid characters

### Upload Success but Image Not Displaying:
- Check public URL generation uses same path as upload
- Verify bucket is configured for public access

## Future Development Guidelines

### If You Need to Modify This System:
1. Read this documentation completely
2. Test in development environment first
3. Verify RLS policies still work
4. Update this documentation with changes
5. Test all error scenarios

### If You Need to Add Features:
1. Don't change the core upload path structure
2. Add new validation as needed
3. Update this documentation
4. Consider backward compatibility

## Last Updated
- **Date**: January 22, 2025
- **Changes**: Fixed RLS policy compliance and bucket name correction
- **Status**: ✅ WORKING - DO NOT MODIFY WITHOUT CAREFUL TESTING

---

**REMEMBER**: This system works because of the specific RLS policy requirements. Any changes to the file path structure or bucket name will break authentication and cause 403 errors.