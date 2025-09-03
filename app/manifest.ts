import type { MetadataRoute } from 'next'

const APP_NAME = 'Side Hustle'
const APP_DESCRIPTION = 'TikTok-style social feed and restaurant ordering app with offline access'
const SUPABASE_URL = 'https://tvnpgbjypnezoasbhbwx.supabase.co'
const STORAGE_URL = `${SUPABASE_URL}/storage/v1/object/public`

export default function manifest(): MetadataRoute.Manifest {
  return {
    id: '/',
    name: APP_NAME,
    short_name: APP_NAME,
    description: APP_DESCRIPTION,
    start_url: '/?source=pwa',
    scope: '/',
    display: 'standalone',
    orientation: 'portrait',
    theme_color: '#000000',
    background_color: '#ffffff',
    dir: 'ltr',
    lang: 'en-US',
    categories: ['food', 'lifestyle', 'shopping', 'social', 'entertainment'],
    iarc_rating_id: 'e84b072d-71b3-4d3e-86ae-31a8ce4e53b7',
    prefer_related_applications: false,
    
    icons: [
      {
        src: `${STORAGE_URL}/icons/icon-192x192.png`,
        sizes: '192x192',
        type: 'image/png',
        purpose: 'any maskable'
      },
      {
        src: `${STORAGE_URL}/icons/icon-512x512.png`,
        sizes: '512x512',
        type: 'image/png',
        purpose: 'any maskable'
      },
      {
        src: `${STORAGE_URL}/icons/android-lil-icon-white.png`,
        sizes: '96x96',
        type: 'image/png',
        purpose: 'any'
      },
      {
        src: `${STORAGE_URL}/icons/icon-180x180.png`,
        sizes: '180x180',
        type: 'image/png',
        purpose: 'any'
      },
      {
        src: `${STORAGE_URL}/icons/icon-72x72.png`,
        sizes: '72x72',
        type: 'image/png',
        purpose: 'any'
      },
      {
        src: `${STORAGE_URL}/icons/icon-96x96.png`,
        sizes: '96x96',
        type: 'image/png',
        purpose: 'any'
      },
      {
        src: `${STORAGE_URL}/icons/icon-128x128.png`,
        sizes: '128x128',
        type: 'image/png',
        purpose: 'any'
      },
      {
        src: `${STORAGE_URL}/icons/icon-144x144.png`,
        sizes: '144x144',
        type: 'image/png',
        purpose: 'any'
      },
      {
        src: `${STORAGE_URL}/icons/icon-152x152.png`,
        sizes: '152x152',
        type: 'image/png',
        purpose: 'any'
      },
      {
        src: `${STORAGE_URL}/icons/icon-384x384.png`,
        sizes: '384x384',
        type: 'image/png',
        purpose: 'any'
      }
    ],
    
    screenshots: [
      {
        src: '/screenshots/social-feed-mobile.png',
        sizes: '390x844',
        type: 'image/png',
        form_factor: 'narrow',
        label: 'TikTok-style social feed on mobile'
      },
      {
        src: '/screenshots/social-feed-desktop.png', 
        sizes: '1920x1080',
        type: 'image/png',
        form_factor: 'wide',
        label: 'Social feed on desktop'
      },
      {
        src: '/screenshots/menu-mobile.png',
        sizes: '390x844',
        type: 'image/png',
        form_factor: 'narrow',
        label: 'Menu view on mobile'
      },
      {
        src: '/screenshots/menu-desktop.png',
        sizes: '1920x1080',
        type: 'image/png',
        form_factor: 'wide',
        label: 'Menu view on desktop'
      },
      {
        src: '/screenshots/cart-mobile.png',
        sizes: '390x844',
        type: 'image/png',
        form_factor: 'narrow',
        label: 'Cart view on mobile'
      }
    ],
    
    shortcuts: [
      {
        name: 'Social Feed',
        short_name: 'Feed',
        description: 'View TikTok-style social feed',
        url: '/social/feed?source=pwa',
        icons: [{ 
          src: `${STORAGE_URL}/icons/icon-96x96.png`, 
          sizes: '96x96', 
          type: 'image/png' 
        }]
      },
      {
        name: 'Menu',
        short_name: 'Menu',
        description: 'View our menu',
        url: '/menu?source=pwa',
        icons: [{ 
          src: `${STORAGE_URL}/icons/icon-96x96.png`, 
          sizes: '96x96', 
          type: 'image/png' 
        }]
      },
      {
        name: 'My Orders',
        short_name: 'Orders',
        description: 'View your orders',
        url: '/orders?source=pwa',
        icons: [{ 
          src: `${STORAGE_URL}/icons/icon-96x96.png`, 
          sizes: '96x96', 
          type: 'image/png' 
        }]
      },
      {
        name: 'Profile',
        short_name: 'Profile',
        description: 'View your profile',
        url: '/profile?source=pwa',
        icons: [{ 
          src: `${STORAGE_URL}/icons/android-lil-icon-white.png`, 
          sizes: '96x96', 
          type: 'image/png' 
        }]
      }
    ],
    
    share_target: {
      action: '/share',
      method: 'POST',
      enctype: 'multipart/form-data',
      params: {
        title: 'title',
        text: 'text',
        url: 'url',
        files: [
          {
            name: 'file',
            accept: ['image/*', 'video/*']
          }
        ]
      }
    },
    
    launch_handler: {
      client_mode: ['navigate-existing', 'auto']
    },
    
    edge_side_panel: {
      preferred_width: 400
    },
    
    display_override: [
      'window-controls-overlay',
      'standalone', 
      'browser'
    ],
    
    handle_links: 'preferred',
    
    protocol_handlers: [
      {
        protocol: 'web+sidehustle',
        url: '/menu?item=%s'
      }
    ],
    
    related_applications: [],
    
    file_handlers: [
      {
        action: '/upload-media',
        accept: {
          'image/*': ['.jpg', '.jpeg', '.png', '.webp', '.gif'],
          'video/*': ['.mp4', '.webm', '.mov']
        }
      }
    ]
  }
}