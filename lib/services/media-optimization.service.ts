/**
 * Advanced Media Optimization Service
 * Handles comprehensive image and video optimization for the wolfpack feed
 * Features: Multi-format support, adaptive streaming, compression, lazy loading
 */

interface ImageOptimizationOptions {
  width?: number;
  height?: number;
  quality?: number;
  format?: "webp" | "avif" | "jpeg" | "png" | "auto";
  fit?: "cover" | "contain" | "fill" | "inside" | "outside";
  blur?: boolean;
  progressive?: boolean;
  devicePixelRatio?: number;
}

interface VideoOptimizationOptions {
  quality?:
    | "auto"
    | "high"
    | "medium"
    | "low"
    | "4k"
    | "1080p"
    | "720p"
    | "480p";
  format?: "mp4" | "webm" | "hls" | "auto";
  thumbnail?: boolean;
  preload?: "none" | "metadata" | "auto";
  bitrate?: number;
  fps?: number;
  adaptive?: boolean;
}

interface OptimizedMedia {
  url: string;
  width?: number;
  height?: number;
  format?: string;
  size?: number;
  thumbnail?: string;
  placeholder?: string;
  sources?: MediaSource[];
  qualities?: QualityLevel[];
}

interface MediaSource {
  url: string;
  format: string;
  quality: string;
  bitrate?: number;
  size?: number;
}

interface QualityLevel {
  label: string;
  value: string;
  url: string;
  bitrate: number;
  resolution: string;
}

export class MediaOptimizationService {
  private static instance: MediaOptimizationService;
  private baseUrl: string;
  private cdnUrl: string;

  constructor() {
    this.baseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
    this.cdnUrl = process.env.NEXT_PUBLIC_CDN_URL || this.baseUrl;
  }

  static getInstance(): MediaOptimizationService {
    if (!MediaOptimizationService.instance) {
      MediaOptimizationService.instance = new MediaOptimizationService();
    }
    return MediaOptimizationService.instance;
  }

  /**
   * Advanced image optimization with multiple formats and quality levels
   */
  optimizeImage(
    originalUrl: string,
    options: ImageOptimizationOptions = {},
  ): OptimizedMedia {
    const {
      width = 1200,
      height = 800,
      quality = 95,
      format = "auto",
      fit = "cover",
      blur = false,
      progressive = true,
      devicePixelRatio = 1,
    } = options;

    // Calculate actual dimensions based on device pixel ratio
    const actualWidth = Math.round(width * devicePixelRatio);
    const actualHeight = Math.round(height * devicePixelRatio);

    // Determine optimal format
    const optimalFormat = format === "auto"
      ? this.getOptimalFormat("image")
      : format;

    // Generate multiple sources for different formats
    const sources: MediaSource[] = [];

    // For local images, use Next.js Image optimization
    if (originalUrl.startsWith("/") || originalUrl.startsWith("./")) {
      const baseUrl = originalUrl;

      // Generate WebP version
      sources.push({
        url: this.generateNextJSUrl(
          baseUrl,
          actualWidth,
          actualHeight,
          "webp",
          quality,
        ),
        format: "webp",
        quality: "high",
        size: this.estimateImageSize(
          actualWidth,
          actualHeight,
          "webp",
          quality,
        ),
      });

      // Generate AVIF version if supported
      if (this.supportsFormat("avif")) {
        sources.push({
          url: this.generateNextJSUrl(
            baseUrl,
            actualWidth,
            actualHeight,
            "avif",
            quality,
          ),
          format: "avif",
          quality: "high",
          size: this.estimateImageSize(
            actualWidth,
            actualHeight,
            "avif",
            quality,
          ),
        });
      }

      // Fallback JPEG
      sources.push({
        url: this.generateNextJSUrl(
          baseUrl,
          actualWidth,
          actualHeight,
          "jpeg",
          quality,
        ),
        format: "jpeg",
        quality: "high",
        size: this.estimateImageSize(
          actualWidth,
          actualHeight,
          "jpeg",
          quality,
        ),
      });

      return {
        url: sources[0].url,
        width: actualWidth,
        height: actualHeight,
        format: optimalFormat,
        sources,
        placeholder: this.generateAdvancedPlaceholder(
          originalUrl,
          width,
          height,
          blur,
        ),
      };
    }

    // For Supabase storage URLs, use transform parameters
    if (originalUrl.includes("supabase")) {
      const transformedUrl = this.transformSupabaseImage(originalUrl, {
        width: actualWidth,
        height: actualHeight,
        quality,
        format: optimalFormat,
        resize: fit,
        progressive,
      });

      // Generate multiple quality levels
      const qualityLevels = [
        { quality: 95, label: "High", suffix: "high" },
        { quality: 80, label: "Medium", suffix: "medium" },
        { quality: 60, label: "Low", suffix: "low" },
      ];

      qualityLevels.forEach((level) => {
        sources.push({
          url: this.transformSupabaseImage(originalUrl, {
            width: actualWidth,
            height: actualHeight,
            quality: level.quality,
            format: optimalFormat,
            resize: fit,
          }),
          format: optimalFormat,
          quality: level.suffix,
          size: this.estimateImageSize(
            actualWidth,
            actualHeight,
            optimalFormat,
            level.quality,
          ),
        });
      });

      return {
        url: transformedUrl,
        width: actualWidth,
        height: actualHeight,
        format: optimalFormat,
        sources,
        thumbnail: this.generateThumbnail(transformedUrl),
        placeholder: this.generateAdvancedPlaceholder(
          originalUrl,
          width,
          height,
          blur,
        ),
      };
    }

    // For external URLs, optimize if possible
    const optimizedUrl = this.optimizeExternalImage(originalUrl, {
      width: actualWidth,
      height: actualHeight,
      quality,
      format: optimalFormat,
    });

    return {
      url: optimizedUrl,
      width: actualWidth,
      height: actualHeight,
      format: optimalFormat,
      placeholder: this.generateAdvancedPlaceholder(
        originalUrl,
        width,
        height,
        blur,
      ),
    };
  }

  /**
   * Advanced video optimization with adaptive streaming and multiple quality levels
   */
  optimizeVideo(
    originalUrl: string,
    options: VideoOptimizationOptions = {},
  ): OptimizedMedia {
    const {
      quality = "auto",
      format = "auto",
      thumbnail = true,
      preload = "metadata",
      adaptive = true,
      bitrate,
      fps = 30,
    } = options;

    // Determine optimal format
    const optimalFormat = format === "auto"
      ? this.getOptimalFormat("video")
      : format;

    // Generate multiple quality levels for adaptive streaming
    const qualityLevels: QualityLevel[] = [];
    const sources: MediaSource[] = [];

    // Define quality configurations
    const qualityConfigs = [
      {
        label: "4K",
        value: "4k",
        resolution: "3840x2160",
        bitrate: 8000,
        enabled: quality === "4k" || quality === "auto",
      },
      {
        label: "1080p",
        value: "1080p",
        resolution: "1920x1080",
        bitrate: 4000,
        enabled: true,
      },
      {
        label: "720p",
        value: "720p",
        resolution: "1280x720",
        bitrate: 2000,
        enabled: true,
      },
      {
        label: "480p",
        value: "480p",
        resolution: "854x480",
        bitrate: 1000,
        enabled: true,
      },
      {
        label: "360p",
        value: "360p",
        resolution: "640x360",
        bitrate: 500,
        enabled: quality === "low" || quality === "auto",
      },
    ];

    // For local wolfpack_videos
    if (originalUrl.startsWith("/") || originalUrl.startsWith("./")) {
      qualityConfigs.forEach((config) => {
        if (config.enabled) {
          const optimizedUrl = this.generateVideoUrl(originalUrl, {
            quality: config.value,
            format: optimalFormat,
            bitrate: config.bitrate,
            fps,
          });

          qualityLevels.push({
            label: config.label,
            value: config.value,
            url: optimizedUrl,
            bitrate: config.bitrate,
            resolution: config.resolution,
          });

          sources.push({
            url: optimizedUrl,
            format: optimalFormat,
            quality: config.value,
            bitrate: config.bitrate,
            size: this.estimatewolfpack_videosize(config.bitrate, 15), // 15 seconds average
          });
        }
      });

      return {
        url: qualityLevels[0]?.url || originalUrl,
        format: optimalFormat,
        sources,
        qualities: qualityLevels,
        thumbnail: thumbnail
          ? this.generateAdvancedVideoThumbnail(originalUrl)
          : undefined,
        placeholder: this.generateVideoPlaceholder(originalUrl),
      };
    }

    // For Supabase storage URLs
    if (originalUrl.includes("supabase")) {
      qualityConfigs.forEach((config) => {
        if (config.enabled) {
          const optimizedUrl = this.transformSupabaseVideo(originalUrl, {
            quality: config.value,
            format: optimalFormat,
            bitrate: config.bitrate,
            fps,
          });

          qualityLevels.push({
            label: config.label,
            value: config.value,
            url: optimizedUrl,
            bitrate: config.bitrate,
            resolution: config.resolution,
          });

          sources.push({
            url: optimizedUrl,
            format: optimalFormat,
            quality: config.value,
            bitrate: config.bitrate,
            size: this.estimatewolfpack_videosize(config.bitrate, 15),
          });
        }
      });

      return {
        url: qualityLevels[0]?.url || originalUrl,
        format: optimalFormat,
        sources,
        qualities: qualityLevels,
        thumbnail: thumbnail
          ? this.generateAdvancedVideoThumbnail(originalUrl)
          : undefined,
        placeholder: this.generateVideoPlaceholder(originalUrl),
      };
    }

    // For external URLs (YouTube, etc.)
    return {
      url: originalUrl,
      format: optimalFormat,
      thumbnail: thumbnail
        ? this.extractVideoThumbnail(originalUrl)
        : undefined,
      placeholder: this.generateVideoPlaceholder(originalUrl),
    };
  }

  /**
   * Generate responsive image sizes for different screen sizes
   */
  generateResponsiveImages(originalUrl: string): {
    mobile: OptimizedMedia;
    tablet: OptimizedMedia;
    desktop: OptimizedMedia;
  } {
    return {
      mobile: this.optimizeImage(originalUrl, {
        width: 750,
        height: 1334,
        quality: 90,
      }),
      tablet: this.optimizeImage(originalUrl, {
        width: 1536,
        height: 2048,
        quality: 95,
      }),
      desktop: this.optimizeImage(originalUrl, {
        width: 2560,
        height: 1440,
        quality: 95,
      }),
    };
  }

  /**
   * Generate video qualities for adaptive streaming
   */
  generateAdaptiveVideo(originalUrl: string): {
    low: OptimizedMedia;
    medium: OptimizedMedia;
    high: OptimizedMedia;
  } {
    return {
      low: this.optimizeVideo(originalUrl, { quality: "low" }),
      medium: this.optimizeVideo(originalUrl, { quality: "medium" }),
      high: this.optimizeVideo(originalUrl, { quality: "high" }),
    };
  }

  /**
   * Check if media needs optimization
   */
  needsOptimization(url: string): boolean {
    // Check file size, format, dimensions
    const isLargeFile = this.isLargeFile(url);
    const isOldFormat = this.isOldFormat(url);
    const isHighRes = this.isHighResolution(url);
    const isSecure = this.isSecureUrl(url);

    return (isLargeFile || isOldFormat || isHighRes) && isSecure;
  }

  /**
   * Get optimal media format based on browser support
   */
  getOptimalFormat(mediaType: "image" | "video"): string {
    if (typeof window === "undefined") {
      return mediaType === "image"
        ? "webp"
        : "mp4";
    }

    if (mediaType === "image") {
      // Check AVIF support
      if (this.supportsFormat("avif")) return "avif";
      // Check WebP support
      if (this.supportsFormat("webp")) return "webp";
      // Fallback to JPEG
      return "jpeg";
    }

    if (mediaType === "video") {
      // Check WebM support
      if (this.supportsFormat("webm")) return "webm";
      // Fallback to MP4
      return "mp4";
    }

    return "auto";
  }

  // Private helper methods

  private generateNextJSUrl(
    url: string,
    width: number,
    height: number,
    format: string,
    quality: number,
  ): string {
    // Generate Next.js optimized image URL
    const params = new URLSearchParams({
      url,
      w: width.toString(),
      h: height.toString(),
      f: format,
      q: quality.toString(),
    });
    return `/_next/image?${params.toString()}`;
  }

  private generateVideoUrl(url: string, options: any): string {
    // Generate optimized video URL with quality parameters
    const params = new URLSearchParams();
    if (options.quality) params.set("quality", options.quality);
    if (options.format) params.set("format", options.format);
    if (options.bitrate) params.set("bitrate", options.bitrate.toString());
    if (options.fps) params.set("fps", options.fps.toString());

    return `${url}?${params.toString()}`;
  }

  private optimizeExternalImage(url: string, options: any): string {
    // Handle external image optimization services
    if (url.includes("unsplash.com")) {
      return this.optimizeUnsplashImage(url, options);
    }
    if (url.includes("cloudinary.com")) {
      return this.optimizeCloudinaryImage(url, options);
    }
    return url;
  }

  private optimizeUnsplashImage(url: string, options: any): string {
    const { width, height, quality, format } = options;
    return `${url}?w=${width}&h=${height}&fit=crop&crop=face&q=${quality}&fm=${format}`;
  }

  private optimizeCloudinaryImage(url: string, options: any): string {
    const { width, height, quality, format } = options;
    return url.replace(
      "/upload/",
      `/upload/w_${width},h_${height},c_fill,q_${quality},f_${format}/`,
    );
  }

  private estimateImageSize(
    width: number,
    height: number,
    format: string,
    quality: number,
  ): number {
    // Estimate file size based on dimensions, format, and quality
    const pixels = width * height;
    const baseSize = pixels * 3; // RGB

    const formatMultipliers = {
      "jpeg": 0.1,
      "webp": 0.08,
      "avif": 0.06,
      "png": 0.3,
    };

    const qualityMultiplier = quality / 100;
    const formatMultiplier =
      formatMultipliers[format as keyof typeof formatMultipliers] || 0.1;

    return Math.round(baseSize * formatMultiplier * qualityMultiplier);
  }

  private estimatewolfpack_videosize(
    bitrate: number,
    duration: number,
  ): number {
    // Estimate video file size based on bitrate and duration
    return Math.round((bitrate * duration) / 8 * 1000); // Convert to bytes
  }

  private generateAdvancedPlaceholder(
    url: string,
    width: number,
    height: number,
    blur: boolean = false,
  ): string {
    const blurFilter = blur ? "filter: blur(5px);" : "";
    return `data:image/svg+xml;base64,${
      btoa(`
      <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" style="stop-color:#1f2937;stop-opacity:1" />
            <stop offset="50%" style="stop-color:#374151;stop-opacity:1" />
            <stop offset="100%" style="stop-color:#1f2937;stop-opacity:1" />
          </linearGradient>
        </defs>
        <rect width="${width}" height="${height}" fill="url(#gradient)" style="${blurFilter}" />
        <circle cx="${width / 2}" cy="${
        height / 2
      }" r="20" fill="#6b7280" opacity="0.8" />
        <animateTransform attributeName="transform" type="rotate" values="0 ${
        width / 2
      } ${height / 2};360 ${width / 2} ${
        height / 2
      }" dur="2s" repeatCount="indefinite" />
      </svg>
    `)
    }`;
  }

  private generateVideoPlaceholder(url: string): string {
    return `data:image/svg+xml;base64,${
      btoa(`
      <svg width="800" height="600" xmlns="http://www.w3.org/2000/svg">
        <rect width="800" height="600" fill="#000" />
        <circle cx="400" cy="300" r="50" fill="#fff" opacity="0.8" />
        <polygon points="380,280 380,320 420,300" fill="#000" />
      </svg>
    `)
    }`;
  }

  private generateAdvancedVideoThumbnail(url: string): string {
    // Generate high-quality video thumbnail
    return `${url}?thumbnail=true&width=800&height=600&quality=95&time=1`;
  }

  private transformSupabaseImage(url: string, options: any): string {
    // Add Supabase transform parameters
    const params = new URLSearchParams();
    if (options.width) params.set("width", options.width.toString());
    if (options.height) params.set("height", options.height.toString());
    if (options.quality) params.set("quality", options.quality.toString());
    if (options.format) params.set("format", options.format);
    if (options.resize) params.set("resize", options.resize);

    return `${url}?${params.toString()}`;
  }

  private transformSupabaseVideo(url: string, options: any): string {
    // Add video transform parameters
    const params = new URLSearchParams();
    if (options.quality) params.set("quality", options.quality);
    if (options.format) params.set("format", options.format);

    return `${url}?${params.toString()}`;
  }

  private generateThumbnail(url: string): string {
    // Generate thumbnail URL
    return this.transformSupabaseImage(url, {
      width: 150,
      height: 150,
      quality: 70,
      format: "webp",
      resize: "cover",
    });
  }

  private generateVideoThumbnail(url: string): string {
    // Generate video thumbnail
    return `${url}?thumbnail=true&width=300&height=200&quality=80`;
  }

  private generatePlaceholder(url: string): string {
    // Generate sophisticated shimmer placeholder
    return `data:image/svg+xml;base64,${
      btoa(`
      <svg width="1200" height="800" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="shimmer" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" style="stop-color:#1f2937;stop-opacity:1" />
            <stop offset="50%" style="stop-color:#374151;stop-opacity:1" />
            <stop offset="100%" style="stop-color:#1f2937;stop-opacity:1" />
          </linearGradient>
          <linearGradient id="overlay" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" style="stop-color:#000;stop-opacity:0.3" />
            <stop offset="100%" style="stop-color:#000;stop-opacity:0.7" />
          </linearGradient>
        </defs>
        <rect width="1200" height="800" fill="url(#shimmer)" />
        <rect width="1200" height="800" fill="url(#overlay)" />
        <circle cx="600" cy="400" r="30" fill="#6b7280" opacity="0.6" />
        <animateTransform attributeName="transform" type="translate" values="-100 0;1300 0;-100 0" dur="2s" repeatCount="indefinite" />
      </svg>
    `)
    }`;
  }

  private extractVideoThumbnail(url: string): string {
    // Extract thumbnail from video URL (YouTube, Vimeo, etc.)
    if (url.includes("youtube.com") || url.includes("youtu.be")) {
      const videoId = this.extractYouTubeVideoId(url);
      return `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`;
    }

    if (url.includes("vimeo.com")) {
      const videoId = this.extractVimeoVideoId(url);
      return `https://vumbnail.com/${videoId}.jpg`;
    }

    return this.generatePlaceholder(url);
  }

  private extractYouTubeVideoId(url: string): string {
    const match = url.match(
      /(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\n?#]+)/,
    );
    return match ? match[1] : "";
  }

  private extractVimeoVideoId(url: string): string {
    const match = url.match(/vimeo\.com\/(\d+)/);
    return match ? match[1] : "";
  }

  private isLargeFile(url: string): boolean {
    // Check if file is likely large (simplified check)
    return url.includes("original") || url.includes("raw") ||
      url.includes("uncompressed");
  }

  private isOldFormat(url: string): boolean {
    // Check for old formats
    return url.includes(".bmp") || url.includes(".tiff") ||
      url.includes(".gif");
  }

  private isHighResolution(url: string): boolean {
    // Check for high resolution indicators
    return url.includes("4k") || url.includes("1080p") || url.includes("hd");
  }

  private supportsFormat(format: string): boolean {
    if (typeof window === "undefined") return false;

    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");

    if (!ctx) return false;

    switch (format) {
      case "webp":
        return canvas.toDataURL("image/webp").indexOf("image/webp") === 5;
      case "avif":
        return canvas.toDataURL("image/avif").indexOf("image/avif") === 5;
      case "webm":
        const video = document.createElement("video");
        return video.canPlayType("video/webm") !== "";
      default:
        return false;
    }
  }

  private isSecureUrl(url: string): boolean {
    try {
      const urlObj = new URL(url);
      const trustedDomains = [
        "supabase.co",
        "cloudinary.com",
        "amazonaws.com",
        "unsplash.com",
      ];
      return urlObj.protocol === "https:" &&
        trustedDomains.some((domain) => urlObj.hostname.includes(domain));
    } catch {
      return false;
    }
  }
}

// Export singleton instance
export const mediaOptimizer = MediaOptimizationService.getInstance();
