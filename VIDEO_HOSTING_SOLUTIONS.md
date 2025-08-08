# Video Hosting Solutions

## Option 1: Cloudinary (FREE - Recommended)
- 25GB storage + 25GB bandwidth/month free
- Auto-optimization and CDN
1. Sign up at cloudinary.com
2. Upload videos
3. Replace local paths with Cloudinary URLs

## Option 2: Supabase Storage
- Since you're already using Supabase
- Create a bucket for videos
```sql
-- Run in Supabase SQL Editor
INSERT INTO storage.buckets (id, name, public) 
VALUES ('videos', 'videos', true);
```
Then upload videos via dashboard

## Option 3: YouTube (Unlisted)
- Upload as unlisted videos
- Embed using iframe or video URLs
- Completely free, unlimited

## Option 4: AWS S3 / Backblaze B2
- More technical but very cheap
- ~$0.005/GB storage

## Option 5: Vercel Blob Storage
- Integrated with your Vercel deployment
- 1GB free, then pay-as-you-go

## Quick Fix for Now:
Remove the video commits and use placeholder URLs:

```bash
# Reset to before video commits
git reset --hard HEAD~2

# Create video URL mapping file
# Then update your code to use external URLs
```

## Update Code Example:
```typescript
// Instead of local path:
// video: '/food-menu-images/birria-soup-watch-it-made.mp4'

// Use external URL:
video: 'https://res.cloudinary.com/your-account/video/upload/v1234/birria-soup-watch-it-made.mp4'
```