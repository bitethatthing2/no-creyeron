/** @type {import('next').NextConfig} */
const withBundleAnalyzer = require('@next/bundle-analyzer')({
  enabled: process.env.ANALYZE === 'true',
});

const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  
  // Temporarily disable for deployment
  typescript: {
    ignoreBuildErrors: true
  },
  eslint: {
    ignoreDuringBuilds: true
  },
  
  // Image optimization configuration
  images: {
    remotePatterns: [
      {
        protocol: 'http',
        hostname: 'localhost',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'tvnpgbjypnezoasbhbwx.supabase.co',
        port: '',
        pathname: '/storage/v1/object/public/**',
      },
      {
        protocol: 'https',
        hostname: 'api.dicebear.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'example.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'instagram.fsac1-1.fna.fbcdn.net',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: '*.cdninstagram.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'scontent.cdninstagram.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'cdn.pixabay.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'via.placeholder.com',
        port: '',
        pathname: '/**',
      },
    ],
    formats: ['image/avif', 'image/webp'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    minimumCacheTTL: 60 * 60 * 24 * 30, // 30 days
  },
  
  // Skip API routes from build to avoid NextJS 15 type issues
  pageExtensions: ['tsx', 'ts', 'jsx', 'js'],
  
  // Disable experimental features causing issues
  experimental: {
    serverActions: {
      bodySizeLimit: '2mb',
    },
  },
  
  // Better dev server configuration
  devIndicators: {
    position: 'bottom-right',
  },
  
  // Compression
  compress: true,
  
  // Bundle optimization
  webpack: (config, { isServer, dev, webpack }) => {
    // Optimize for production bundles
    if (!dev && !isServer) {
      // Minimize bundle size
      config.optimization = {
        ...config.optimization,
        splitChunks: {
          chunks: 'all',
          cacheGroups: {
            // Vendor chunks
            vendor: {
              test: /[\\/]node_modules[\\/]/,
              name: 'vendors',
              priority: 10,
              reuseExistingChunk: true,
            },
            // React Query separate chunk
            reactQuery: {
              test: /[\\/]node_modules[\\/]@tanstack[\\/]react-query/,
              name: 'react-query',
              priority: 20,
            },
            // Supabase separate chunk
            supabase: {
              test: /[\\/]node_modules[\\/]@supabase/,
              name: 'supabase',
              priority: 20,
            },
            // Common components
            common: {
              name: 'common',
              minChunks: 2,
              priority: 5,
              reuseExistingChunk: true,
            },
          },
        },
      };
    }

    // Only inject Firebase config into service worker in production
    if (!isServer && !dev) {
      config.plugins.push(
        new webpack.DefinePlugin({
          'self.FIREBASE_API_KEY': JSON.stringify(process.env.NEXT_PUBLIC_FIREBASE_API_KEY || ''),
          'self.FIREBASE_AUTH_DOMAIN': JSON.stringify(process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || ''),
          'self.FIREBASE_PROJECT_ID': JSON.stringify(process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || ''),
          'self.FIREBASE_STORAGE_BUCKET': JSON.stringify(process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || ''),
          'self.FIREBASE_MESSAGING_SENDER_ID': JSON.stringify(process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || ''),
          'self.FIREBASE_APp_user_id': JSON.stringify(process.env.NEXT_PUBLIC_FIREBASE_APp_user_id || ''),
          'self.FIREBASE_MEASUREMENT_ID': JSON.stringify(process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID || ''),
        })
      );
    }
    
    return config;
  },

  async headers() {
    return [
      // Service Worker headers
      {
        source: '/sw.js',
        headers: [
          {
            key: 'Service-Worker-Allowed',
            value: '/',
          },
          {
            key: 'Cache-Control',
            value: 'no-cache, no-store, must-revalidate',
          },
        ],
      },
      {
        source: '/firebase-messaging-sw.js',
        headers: [
          {
            key: 'Service-Worker-Allowed',
            value: '/',
          },
        ],
      },
      // Specific headers for service workers
      {
        source: '/firebase-messaging-sw.js',
        headers: [
          {
            key: 'Service-Worker-Allowed',
            value: '/'
          },
          {
            key: 'Content-Type',
            value: 'application/javascript'
          },
          {
            key: 'Cache-Control',
            value: 'no-cache, no-store, must-revalidate'
          }
        ]
      },
      {
        source: '/sw.js',
        headers: [
          {
            key: 'Service-Worker-Allowed',
            value: '/'
          },
          {
            key: 'Content-Type',
            value: 'application/javascript'
          },
          {
            key: 'Cache-Control',
            value: 'no-cache, no-store, must-revalidate'
          }
        ]
      },
      // Static assets caching
      {
        source: '/food-menu-images/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
      {
        source: '/icons/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
      // Font caching
      {
        source: '/fonts/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
      // Security headers with proper CSP for Instagram and Google Maps
      {
        source: '/:path*',
        headers: [
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'Referrer-Policy',
            value: 'origin-when-cross-origin',
          },
          {
            key: 'Content-Security-Policy',
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://www.gstatic.com https://www.instagram.com http://www.instagram.com https://maps.googleapis.com https://apis.google.com https://www.googletagmanager.com https://*.firebaseapp.com https://*.firebase.com https://firestore.googleapis.com https://identitytoolkit.googleapis.com https://fcmregistrations.googleapis.com",
              "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
              "font-src 'self' https://fonts.gstatic.com",
              "img-src 'self' data: https: blob: http:",
              "media-src 'self' blob: https://tvnpgbjypnezoasbhbwx.supabase.co https://scontent.cdninstagram.com https://*.cdninstagram.com https://instagram.fsac1-1.fna.fbcdn.net https://*.fbcdn.net https://commondatastorage.googleapis.com https://*.googleapis.com https://videos.pexels.com https://*.pexels.com",
              "connect-src 'self' https://api.instagram.com https://www.instagram.com https://*.supabase.co https://*.supabase.com wss://*.supabase.co wss://*.supabase.com https://maps.googleapis.com https://fcm.googleapis.com https://firebaseinstallations.googleapis.com https://*.googleapis.com https://*.firebase.com https://*.firebaseio.com https://firestore.googleapis.com https://identitytoolkit.googleapis.com https://fcmregistrations.googleapis.com wss://*.firebaseio.com https://tvnpgbjypnezoasbhbwx.supabase.co wss://tvnpgbjypnezoasbhbwx.supabase.co",
              "worker-src 'self' blob:",
              "child-src 'self' blob:",
              "frame-src 'self' https://www.instagram.com https://instagram.com https://www.google.com https://maps.google.com https://maps.googleapis.com",
            ].join('; ')
          },
        ],
      },
    ];
  },
  
  async rewrites() {
    return [
      {
        source: '/sw.js',
        destination: '/sw.js',
      },
      {
        source: '/firebase-messaging-sw.js',
        destination: '/firebase-messaging-sw.js',      
      },
      {
        source: '/favicon.ico',
        destination: '/favicon.ico',
      },
      {
        source: '/icons/favicon.ico',
        destination: '/favicon.ico',
      },
      {
        source: '/offline.html',
        destination: '/offline.html',
      },
    ];
  },
};

module.exports = withBundleAnalyzer(nextConfig);