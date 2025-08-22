import Image, { ImageProps } from 'next/image';
import { getSmartCacheBustedUrl } from '@/lib/utils/image-cache';

interface CachedImageProps extends Omit<ImageProps, 'src'> {
  src: string;
  cacheBust?: boolean;
}

/**
 * Enhanced Image component with automatic cache busting for static assets
 */
export function CachedImage({ src, cacheBust = true, ...props }: CachedImageProps) {
  const processedSrc = cacheBust ? getSmartCacheBustedUrl(src) : src;
  
  return <Image src={processedSrc} {...props} />;
}

export default CachedImage;