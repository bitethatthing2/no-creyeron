'use client';

import { useEffect } from 'react';

/**
 * Development component that forces complete image refresh
 * by unregistering service workers and clearing all caches
 */
export default function ForceImageRefresh() {
  useEffect(() => {
    // Only run in development
    if (process.env.NODE_ENV !== 'development') return;

    // Add global function to completely bypass all caching
    (window as any).forceRefreshImages = async () => {
      console.log('🔄 Starting aggressive image refresh...');
      
      try {
        // 1. Unregister all service workers temporarily
        const registrations = await navigator.serviceWorker.getRegistrations();
        for (const registration of registrations) {
          await registration.unregister();
          console.log('✅ Unregistered service worker:', registration.scope);
        }
        
        // 2. Clear ALL caches
        if ('caches' in window) {
          const cacheNames = await caches.keys();
          await Promise.all(
            cacheNames.map(name => {
              console.log('🗑️ Deleting cache:', name);
              return caches.delete(name);
            })
          );
        }
        
        // 3. Clear localStorage cache keys
        Object.keys(localStorage).forEach(key => {
          if (key.includes('image') || key.includes('cache')) {
            localStorage.removeItem(key);
          }
        });
        
        // 4. Clear sessionStorage
        sessionStorage.clear();
        
        // 5. Force reload all images with random timestamps
        const images = document.querySelectorAll('img');
        const timestamp = Date.now();
        const random = Math.random();
        
        images.forEach((img, index) => {
          const src = img.getAttribute('src');
          if (src && !src.startsWith('data:') && !src.startsWith('blob:')) {
            // Remove any existing query params
            const cleanSrc = src.split('?')[0];
            // Add aggressive cache busting with both timestamp and random
            const newSrc = `${cleanSrc}?_t=${timestamp}&_r=${random}&_i=${index}`;
            img.setAttribute('src', newSrc);
            
            // Also update srcset if present
            const srcset = img.getAttribute('srcset');
            if (srcset) {
              const newSrcset = srcset.split(',').map(item => {
                const [url, size] = item.trim().split(' ');
                const cleanUrl = url.split('?')[0];
                return `${cleanUrl}?_t=${timestamp}&_r=${random} ${size || ''}`;
              }).join(', ');
              img.setAttribute('srcset', newSrcset);
            }
          }
        });
        
        console.log(`✅ Refreshed ${images.length} images`);
        console.log('⚠️ Service workers unregistered - reload page to re-enable');
        
        // 6. Show notification
        const notification = document.createElement('div');
        notification.style.cssText = `
          position: fixed;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          background: #10b981;
          color: white;
          padding: 20px;
          border-radius: 8px;
          font-weight: bold;
          z-index: 999999;
          box-shadow: 0 4px 6px rgba(0,0,0,0.3);
        `;
        notification.textContent = `Images refreshed! Reload page to re-enable caching.`;
        document.body.appendChild(notification);
        
        setTimeout(() => {
          notification.remove();
        }, 3000);
        
      } catch (error) {
        console.error('❌ Error during force refresh:', error);
      }
    };
    
    // Add keyboard shortcut for emergency refresh (Ctrl+Alt+Shift+R)
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.altKey && e.shiftKey && e.key === 'R') {
        e.preventDefault();
        (window as any).forceRefreshImages();
      }
    };
    
    window.addEventListener('keydown', handleKeyPress);
    
    // Log availability
    console.log('💡 Force refresh available:');
    console.log('   - Run: window.forceRefreshImages()');
    console.log('   - Or press: Ctrl+Alt+Shift+R');
    
    return () => {
      window.removeEventListener('keydown', handleKeyPress);
    };
  }, []);
  
  return null;
}