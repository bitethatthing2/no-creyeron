import '@/app/globals.css';
import React from 'react';
import { Metadata, Viewport } from 'next';
import Script from 'next/script';
import { Playfair_Display, Inter } from 'next/font/google';
import { Providers } from './providers';
import { UnifiedNotificationInit } from '@/components/notifications/UnifiedNotificationInit';
import { PwaInitializer } from '@/components/shared/PwaInitializer';
import { LogoPreloader } from '@/components/shared/LogoPreloader';
import dynamic from 'next/dynamic';

// Dev components removed during cleanup

// Configure fonts
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

// Define metadata for the app, including PWA-related tags
export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3001'),
  title: 'Side Hustle',
  description: 'Order food and drinks at Side Hustle - A faster, app-like experience with offline access',
  manifest: '/manifest.json',
  icons: {
    icon: [
      { url: '/favicon.ico', type: 'image/x-icon' },
      { url: '/icons/favicon-for-public/web-app-manifest-192x192.png', sizes: '192x192', type: 'image/png' },
      { url: '/icons/favicon-for-public/web-app-manifest-512x512.png', sizes: '512x512', type: 'image/png' }
    ],
    apple: [
      { url: '/icons/apple-touch-icon.png', sizes: '180x180', type: 'image/png' }
    ],
    shortcut: [
      { url: '/favicon.ico', type: 'image/x-icon' }
    ]
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'Side Hustle',
  },
  applicationName: "Side Hustle",
  formatDetection: {
    telephone: false,
  },
  other: {
    "apple-mobile-web-app-capable": "yes",
    "apple-mobile-web-app-status-bar-style": "black-translucent",
    "mobile-web-app-capable": "yes",
    "msapplication-TileImage": "/icons/favicon-for-public/web-app-manifest-192x192.png",
    "msapplication-TileColor": "#000000"
  },
  // Open Graph tags for better sharing
  openGraph: {
    title: 'Side Hustle',
    description: 'Order food and drinks at Side Hustle',
    url: 'https://yourdomain.com',
    siteName: 'Side Hustle',
    images: [
      {
        url: '/icons/og-image.png',
        width: 1200,
        height: 630,
      }
    ],
    locale: 'en_US',
    type: 'website',
  },
  // Twitter Card tags
  twitter: {
    card: 'summary_large_image',
    title: 'Side Hustle',
    description: 'Order food and drinks at Side Hustle',
    images: ['/icons/og-image.png'],
  },
};

// Define viewport configuration separately as recommended by Next.js
export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
  themeColor: '#000000',
  viewportFit: 'cover', // For iPhone X+ notch support
};

// Service Worker registration script with cookie cleanup utilities
const ServiceWorkerScript = () => (
  <Script
    id="service-worker"
    strategy="afterInteractive"
    dangerouslySetInnerHTML={{
      __html: `
        (function() {
          try {
            // Cookie cleanup utilities
            window.clearCorruptedCookies = function() {
              const cookies = document.cookie.split(';');
              let cleared = 0;
              
              cookies.forEach(cookie => {
                const [name, value] = cookie.split('=').map(s => s.trim());
                
                if (name && (name.includes('supabase') || name.includes('sb-'))) {
                  // Check if cookie value contains corruption indicators
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
              
              cookies.forEach(cookie => {
                const name = cookie.split('=')[0].trim();
                
                if (name && (name.includes('supabase') || name.includes('sb-'))) {
                  document.cookie = name + '=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
                  document.cookie = name + '=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; domain=' + window.location.hostname + ';';
                  document.cookie = name + '=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; domain=.' + window.location.hostname + ';';
                  cleared++;
                }
              });
              
              // Also clear localStorage
              Object.keys(localStorage).forEach(key => {
                if (key.includes('supabase') || key.includes('sb-')) {
                  localStorage.removeItem(key);
                }
              });
              
              // Clear sessionStorage
              Object.keys(sessionStorage).forEach(key => {
                if (key.includes('supabase') || key.includes('sb-')) {
                  sessionStorage.removeItem(key);
                }
              });
              
              console.log('Cleared all auth cookies and storage');
              return cleared;
            };

            // Check for corrupted cookies on load
            window.clearCorruptedCookies();

            // Service Worker Registration
            if ('serviceWorker' in navigator) {
              window.addEventListener('load', function() {
                navigator.serviceWorker.register('/sw.js').then(
                  function(registration) {
                    console.log('ServiceWorker registration successful');
                  },
                  function(err) {
                    console.log('ServiceWorker registration failed: ', err);
                  }
                ).catch(function(error) {
                  console.log('ServiceWorker registration error:', error);
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
                const observer = new PerformanceObserver((list) => {
                  const entries = list.getEntries();
                  entries.forEach((entry) => {
                    if (entry.entryType === 'largest-contentful-paint') {
                      console.log('LCP:', entry.startTime);
                    }
                    if (entry.entryType === 'first-input') {
                      console.log('FID:', entry.processingStart - entry.startTime);
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

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* Preconnect to external domains */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        
        {/* DNS Prefetch for performance - using actual Supabase URL */}
        {process.env.NEXT_PUBLIC_SUPABASE_URL && (
          <link rel="dns-prefetch" href={process.env.NEXT_PUBLIC_SUPABASE_URL} />
        )}
        
        {/* PWA splash screens for iOS */}
        <link
          rel="apple-touch-startup-image"
          href="/icons/apple-splash-2048-2732.jpg"
          media="(device-width: 1024px) and (device-height: 1366px) and (-webkit-device-pixel-ratio: 2) and (orientation: portrait)"
        />
        <link
          rel="apple-touch-startup-image"
          href="/icons/apple-splash-1668-2388.jpg"
          media="(device-width: 834px) and (device-height: 1194px) and (-webkit-device-pixel-ratio: 2) and (orientation: portrait)"
        />
        <link
          rel="apple-touch-startup-image"
          href="/icons/apple-splash-1536-2048.jpg"
          media="(device-width: 768px) and (device-height: 1024px) and (-webkit-device-pixel-ratio: 2) and (orientation: portrait)"
        />
        <link
          rel="apple-touch-startup-image"
          href="/icons/apple-splash-1125-2436.jpg"
          media="(device-width: 375px) and (device-height: 812px) and (-webkit-device-pixel-ratio: 3) and (orientation: portrait)"
        />
        <link
          rel="apple-touch-startup-image"
          href="/icons/apple-splash-1242-2688.jpg"
          media="(device-width: 414px) and (device-height: 896px) and (-webkit-device-pixel-ratio: 3) and (orientation: portrait)"
        />
        <link
          rel="apple-touch-startup-image"
          href="/icons/apple-splash-828-1792.jpg"
          media="(device-width: 414px) and (device-height: 896px) and (-webkit-device-pixel-ratio: 2) and (orientation: portrait)"
        />
        <link
          rel="apple-touch-startup-image"
          href="/icons/apple-splash-1170-2532.jpg"
          media="(device-width: 390px) and (device-height: 844px) and (-webkit-device-pixel-ratio: 3) and (orientation: portrait)"
        />
        <link
          rel="apple-touch-startup-image"
          href="/icons/apple-splash-1080-1920.jpg"
          media="(device-width: 360px) and (device-height: 640px) and (-webkit-device-pixel-ratio: 3) and (orientation: portrait)"
        />
        <link
          rel="apple-touch-startup-image"
          href="/icons/apple-splash-750-1334.jpg"
          media="(device-width: 375px) and (device-height: 667px) and (-webkit-device-pixel-ratio: 2) and (orientation: portrait)"
        />
        <link
          rel="apple-touch-startup-image"
          href="/icons/apple-splash-640-1136.jpg"
          media="(device-width: 320px) and (device-height: 568px) and (-webkit-device-pixel-ratio: 2) and (orientation: portrait)"
        />
      </head>
      <body className={`${inter.variable} ${playfair.variable} min-h-screen font-sans antialiased bg-black m-0 p-0`}>
        <Providers>
          <LogoPreloader />
          <PwaInitializer />
          <UnifiedNotificationInit />
          {/* Dev components removed during cleanup */}
          <main>
            {children}
          </main>
        </Providers>
        
        {/* Service Worker Registration */}
        <ServiceWorkerScript />
        
        {/* Structured Data for SEO */}
        <Script
          id="structured-data"
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "Restaurant",
              "name": "Side Hustle",
              "description": "Mexican food and drinks",
              "servesCuisine": "Mexican",
              "priceRange": "$$",
              "acceptsReservations": "False",
              "address": {
                "@type": "PostalAddress",
                "streetAddress": "Your Street Address",
                "addressLocality": "Your City",
                "addressRegion": "Your State",
                "postalCode": "Your Zip",
                "addressCountry": "US"
              }
            })
          }}
        />
        
        {/* Instagram Embed Script - Temporarily disabled to fix embed errors */}
        {/* <Script
          src="https://www.instagram.com/embed.js"
          strategy="lazyOnload"
        /> */}
      </body>
    </html>
  );
}