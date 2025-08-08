# Image Cache Management Guide

This project includes a comprehensive image cache management system to handle browser caching issues when you update images.

## Problem

When you update an image file (like replacing `/icons/wolf-icon.png` with a new version), browsers may continue showing the old cached version because the URL hasn't changed.

## Solution

We've implemented an automatic cache-busting system that adds version parameters to image URLs.

## Usage

### 1. Automatic Cache Busting (Recommended)

Use the `CachedImage` component instead of Next.js `Image`:

```tsx
import { CachedImage } from '@/components/ui/CachedImage';

// Old way
<Image src="/icons/wolf-icon.png" alt="Wolf" width={64} height={64} />

// New way - automatically cache-busted
<CachedImage src="/icons/wolf-icon.png" alt="Wolf" width={64} height={64} />
```

### 2. Manual Cache Busting

For existing Image components, use the utility functions:

```tsx
import { getSmartCacheBustedUrl } from '@/lib/utils/image-cache';

<Image 
  src={getSmartCacheBustedUrl('/icons/wolf-icon.png')} 
  alt="Wolf" 
  width={64} 
  height={64} 
/>
```

### 3. Force Fresh Images (Always Current Timestamp)

For images that should never be cached:

```tsx
import { getFreshImageUrl } from '@/lib/utils/image-cache';

<Image 
  src={getFreshImageUrl('/icons/wolf-icon.png')} 
  alt="Wolf" 
  width={64} 
  height={64} 
/>
```

### 4. Using the Hook

For dynamic scenarios:

```tsx
import { useImageCache } from '@/hooks/useImageCache';

function MyComponent() {
  const logoUrl = useImageCache('/icons/wolf-icon.png');
  
  return <Image src={logoUrl} alt="Wolf" width={64} height={64} />;
}
```

## Configuration

### High-Priority Images (Always Cache-Busted)

These images are automatically cache-busted because they change frequently:

- `/icons/wolf-and-title.png`
- `/icons/wolf-icon.png`
- `/icons/sidehustle.png`
- `/icons/WOLFPACK-PAW.png`
- `/icons/wolf-icon-light-screen.png`

To add more images to this list, edit the `ALWAYS_CACHE_BUST` array in `/lib/utils/image-cache.ts`.

### Global Cache Busting

To force refresh ALL images across the entire app:

1. Open `/lib/utils/image-cache.ts`
2. Update the `IMAGE_VERSION` constant to a new timestamp
3. Redeploy the app

```ts
// Change this value to bust all image caches
const IMAGE_VERSION = '1732499226'; // Update this timestamp
```

## Avatar Images

Avatar images are handled automatically through the avatar utilities:

```tsx
import { resolveAvatarUrl } from '@/lib/utils/avatar-utils';

const avatarUrl = resolveAvatarUrl(user); // Automatically cache-busted for fallback icons
```

## Development vs Production

- **Development**: Uses current timestamp for maximum freshness
- **Production**: Uses build-time version for better performance

## Browser Cache Headers

The Next.js config sets these cache headers:

- **Icons**: `public, max-age=31536000, immutable` (1 year)
- **Cache-busted URLs**: Override the cache using query parameters

## Troubleshooting

### Images Still Not Updating?

1. **Check the URL**: Verify cache-busting parameter is present (`?v=123456`)
2. **Hard Refresh**: Press Ctrl+F5 (Windows) or Cmd+Shift+R (Mac)
3. **Update Global Version**: Change `IMAGE_VERSION` in the utility file
4. **Clear Browser Cache**: Use developer tools to clear cache
5. **Check Network Tab**: Verify the request is being made with the new URL

### Performance Concerns

- Cache-busting is only applied to static assets that need it
- User-uploaded images are not cache-busted (they have unique URLs)
- Build-time versioning is used in production for better caching

## Examples

### Before (Problematic)
```tsx
<Image src="/icons/wolf-icon.png" alt="Wolf" width={64} height={64} />
// URL: /icons/wolf-icon.png (cached forever)
```

### After (Fixed)
```tsx
<CachedImage src="/icons/wolf-icon.png" alt="Wolf" width={64} height={64} />
// URL: /icons/wolf-icon.png?v=1732499226 (cache-busted)
```

## Migration

To migrate existing components:

1. **Replace `Image` with `CachedImage`** for static assets
2. **Use `getSmartCacheBustedUrl()`** for manual cases
3. **Update avatar components** to use the updated avatar utilities
4. **Test in development** to ensure images refresh properly

This system ensures your users always see the latest version of your images while maintaining optimal performance.