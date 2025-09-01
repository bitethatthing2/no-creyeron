import '@/app/globals.css';
import React from 'react';
import { Metadata, Viewport } from 'next';
import Script from 'next/script';
import { Playfair_Display, Inter } from 'next/font/google';
import { Providers } from './providers';
import { UnifiedNotificationInit } from '@/components/notifications/UnifiedNotificationInit';
import { PwaInitializer } from '@/components/shared/PwaInitializer';
import { LogoPreloader } from '@/components/shared/LogoPreloader';

// ============================================================================
// Font Configuration
// ============================================================================

const playfair = Playfair_Display({ 
  subsets: ['latin'],
  variable: '--font-playfair',
  display: 'swap',
});

const inter = Inter({ 
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

// ============================================================================
// Metadata Configuration
// ============================================================================

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3001';
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://tvnpgbjypnezoasbhbwx.supabase.co';
const STORAGE_URL = `${SUPABASE_URL}/storage/v1/object/public`;

export const metadata: Metadata = {
  metadataBase: new URL(APP_URL),
  title: {
    default: 'Side Hustle',
    template: '%s | Side Hustle'
  },
  description: 'Order food and drinks at Side Hustle - A faster, app-like experience with offline access',
  manifest: '/manifest.json',
  icons: {
    icon: [
      { url: `${STORAGE_URL}/icons/favicon.png`, type: 'image/png' },
      { url: `${STORAGE_URL}/icons/icon-192x192.png`, sizes: '192x192', type: 'image/png' },
      { url: `${STORAGE_URL}/icons/icon-512x512.png`, sizes: '512x512', type: 'image/png' },
      { url: `${STORAGE_URL}/icons/icon-72x72.png`, sizes: '72x72', type: 'image/png' },
      { url: `${STORAGE_URL}/icons/icon-96x96.png`, sizes: '96x96', type: 'image/png' },
      { url: `${STORAGE_URL}/icons/icon-128x128.png`, sizes: '128x128', type: 'image/png' },
      { url: `${STORAGE_URL}/icons/icon-144x144.png`, sizes: '144x144', type: 'image/png' },
      { url: `${STORAGE_URL}/icons/icon-152x152.png`, sizes: '152x152', type: 'image/png' },
      { url: `${STORAGE_URL}/icons/icon-384x384.png`, sizes: '384x384', type: 'image/png' }
    ],
    apple: [
      { url: `${STORAGE_URL}/icons/icon-180x180.png`, sizes: '180x180', type: 'image/png' }
    ],
    shortcut: [
      { url: `${STORAGE_URL}/icons/favicon.png`, type: 'image/png' }
    ]
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'Side Hustle',
  },
  applicationName: 'Side Hustle',
  formatDetection: {
    telephone: false,
  },
  openGraph: {
    title: 'Side Hustle',
    description: 'Order food and drinks at Side Hustle',
    url: APP_URL,
    siteName: 'Side Hustle',
    images: [
      {
        url: `${STORAGE_URL}/icons/wolf-512x512.png`,
        width: 512,
        height: 512,
        alt: 'Side Hustle Restaurant',
      }
    ],
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Side Hustle',
    description: 'Order food and drinks at Side Hustle',
    images: [`${STORAGE_URL}/icons/wolf-512x512.png`],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  other: {
    'msapplication-TileImage': `${STORAGE_URL}/icons/icon-144x144.png`
  }
};

// ============================================================================
// Viewport Configuration
// ============================================================================

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
  themeColor: '#000000',
  viewportFit: 'cover', // For iPhone X+ notch support
};

// ============================================================================
// Service Worker Component
// ============================================================================

const ServiceWorkerScript: React.FC = () => (
  <Script
    id="service-worker"
    strategy="afterInteractive"
    dangerouslySetInnerHTML={{
      __html: `
        (function() {
          try {
            // Cookie cleanup utilities with proper typing
            window.clearCorruptedCookies = function() {
              const cookies = document.cookie.split(';');
              let cleared = 0;
              
              cookies.forEach(function(cookie) {
                const parts = cookie.split('=');
                const name = parts[0] ? parts[0].trim() : '';
                const value = parts[1] ? parts[1].trim() : '';
                
                if (name && (name.includes('supabase') || name.includes('sb-'))) {
                  if (value && (value.includes('undefined') || value.includes('null') || value === '')) {
                    document.cookie = name + '=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
                    document.cookie = name + '=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; domain=' + window.location.hostname + ';';
                    document.cookie = name + '=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; domain=.' + window.location.hostname + ';';
                    cleared++;
                  }
                }
              });
              
              console.log('Cleared ' + cleared + ' corrupted cookies');
              return cleared;
            };
            
            window.clearAllCookies = function() {
              const cookies = document.cookie.split(';');
              let cleared = 0;
              
              cookies.forEach(function(cookie) {
                const parts = cookie.split('=');
                const name = parts[0] ? parts[0].trim() : '';
                
                if (name && (name.includes('supabase') || name.includes('sb-'))) {
                  document.cookie = name + '=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
                  document.cookie = name + '=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; domain=' + window.location.hostname + ';';
                  document.cookie = name + '=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; domain=.' + window.location.hostname + ';';
                  cleared++;
                }
              });
              
              // Clear localStorage
              const localStorageKeys = Object.keys(localStorage);
              localStorageKeys.forEach(function(key) {
                if (key.includes('supabase') || key.includes('sb-')) {
                  localStorage.removeItem(key);
                }
              });
              
              // Clear sessionStorage
              const sessionStorageKeys = Object.keys(sessionStorage);
              sessionStorageKeys.forEach(function(key) {
                if (key.includes('supabase') || key.includes('sb-')) {
                  sessionStorage.removeItem(key);
                }
              });
              
              console.log('Cleared all auth cookies and storage');
              return cleared;
            };

            // Check for corrupted cookies on load
            window.clearCorruptedCookies();

            // Unregister existing service workers for dev
            if ('serviceWorker' in navigator) {
              navigator.serviceWorker.getRegistrations().then(function(registrations) {
                registrations.forEach(function(registration) {
                  registration.unregister();
                  console.log('ServiceWorker unregistered for dev mode');
                });
              });
            }
            
            // Register Firebase messaging service worker if needed
            if ('serviceWorker' in navigator && 'PushManager' in window) {
              navigator.serviceWorker.register('/firebase-messaging-sw.js')
                .then(function(registration) {
                  console.log('Firebase SW registered');
                })
                .catch(function(error) {
                  console.log('Firebase SW registration failed:', error);
                });
            }

            // Performance monitoring
            if ('PerformanceObserver' in window) {
              try {
                const observer = new PerformanceObserver(function(list) {
                  const entries = list.getEntries();
                  entries.forEach(function(entry) {
                    if (entry.entryType === 'largest-contentful-paint') {
                      console.log('LCP:', entry.startTime);
                    }
                    if (entry.entryType === 'first-input') {
                      const fidEntry = entry;
                      console.log('FID:', fidEntry.processingStart - fidEntry.startTime);
                    }
                    if (entry.entryType === 'layout-shift' && !entry.hadRecentInput) {
                      console.log('CLS:', entry.value);
                    }
                  });
                });
                
                observer.observe({ entryTypes: ['largest-contentful-paint', 'first-input', 'layout-shift'] });
              } catch (e) {
                console.log('Performance monitoring not supported');
              }
            }

            console.log('Cookie utilities available: clearCorruptedCookies(), clearAllCookies()');
          } catch (error) {
            console.error('ServiceWorker script error:', error);
          }
        })();
      `,
    }}
  />
);

// ============================================================================
// Structured Data Component
// ============================================================================

interface RestaurantStructuredData {
  '@context': string;
  '@type': string;
  name: string;
  description: string;
  servesCuisine: string;
  priceRange: string;
  acceptsReservations: string;
  address: {
    '@type': string;
    streetAddress: string;
    addressLocality: string;
    addressRegion: string;
    postalCode: string;
    addressCountry: string;
  };
}

const structuredData: RestaurantStructuredData = {
  '@context': 'https://schema.org',
  '@type': 'Restaurant',
  name: 'Side Hustle',
  description: 'Mexican food and drinks',
  servesCuisine: 'Mexican',
  priceRange: '$$',
  acceptsReservations: 'False',
  address: {
    '@type': 'PostalAddress',
    streetAddress: 'Your Street Address',
    addressLocality: 'Your City',
    addressRegion: 'Your State',
    postalCode: 'Your Zip',
    addressCountry: 'US'
  }
};

type RootLayoutProps = {
  children: React.ReactNode;
};

export default function RootLayout({ children }: RootLayoutProps): JSX.Element {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* Preconnect to external domains */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        {/* DNS Prefetch for performance */}
        {process.env.NEXT_PUBLIC_SUPABASE_URL && (
          <link rel="dns-prefetch" href={process.env.NEXT_PUBLIC_SUPABASE_URL} />
        )}
        <link rel="icon" type="image/png" sizes="152x152" href={`${STORAGE_URL}/icons/icon-152x152.png`} />
        <link rel="icon" type="image/png" sizes="192x192" href={`${STORAGE_URL}/icons/icon-192x192.png`} />
        <link rel="icon" type="image/png" sizes="384x384" href={`${STORAGE_URL}/icons/icon-384x384.png`} />
        <link rel="icon" type="image/png" sizes="512x512" href={`${STORAGE_URL}/icons/icon-512x512.png`} />

        {/* Android Notification Icon */}
        <meta name="msapplication-TileImage" content={`${STORAGE_URL}/icons/icon-144x144.png`} />
        
        {/* Note: Apple splash screens would need to be uploaded to Supabase if you want to use them */}
        {/* For now, commenting them out since they're not in your icons bucket */}
      </head>
      <body 
        className={`${inter.variable} ${playfair.variable} min-h-screen font-sans antialiased bg-black m-0 p-0`}
      >
        <Providers>
          <LogoPreloader />
          <PwaInitializer />
          <UnifiedNotificationInit />
          <main>{children}</main>
        </Providers>
        
        {/* Service Worker Registration */}
        <ServiceWorkerScript />
        
        {/* Structured Data for SEO */}
        <Script
          id="structured-data"
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(structuredData)
          }}
        />
      </body>
    </html>
  );
}

// ============================================================================
// Type Extensions for Window
// ============================================================================

declare global {
  interface Window {
    clearCorruptedCookies?: () => number;
    clearAllCookies?: () => void;
  }
  
  interface PerformanceEntry {
    processingStart?: number;
    hadRecentInput?: boolean;
    value?: number;
  }
}