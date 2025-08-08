/**
 * Device and platform detection utilities for PWA functionality
 */

/**
 * Extended Navigator interface to include iOS-specific standalone property
 */
interface NavigatorStandalone extends Navigator {
  standalone?: boolean;
}

/**
 * Check if the current device is running iOS
 */
export function isIOS(): boolean {
  if (typeof window === 'undefined') return false;
  
  const userAgent = window.navigator.userAgent.toLowerCase();
  return /iphone|ipad|ipod/.test(userAgent) || 
         (userAgent.includes('mac') && navigator.maxTouchPoints > 0);
}

/**
 * Check if the current device is running Android
 */
export function isAndroid(): boolean {
  if (typeof window === 'undefined') return false;
  
  const userAgent = window.navigator.userAgent.toLowerCase();
  return /android/.test(userAgent);
}

/**
 * Check if the app is running in standalone mode (installed as PWA)
 */
export function isStandalone(): boolean {
  if (typeof window === 'undefined') return false;
  
  return (
    // iOS standalone mode
    ('standalone' in window.navigator && (window.navigator as NavigatorStandalone).standalone === true) ||
    // Modern PWA standalone mode
    (window.matchMedia && (
      window.matchMedia('(display-mode: standalone)').matches ||
      window.matchMedia('(display-mode: window-controls-overlay)').matches ||
      window.matchMedia('(display-mode: minimal-ui)').matches
    ))
  );
}

/**
 * Check if the browser supports PWA installation
 */
export function supportsInstallation(): boolean {
  return (
    typeof window !== 'undefined' && 
    'serviceWorker' in navigator &&
    (
      // Chrome, Edge, Opera, Samsung Internet
      ('BeforeInstallPromptEvent' in window) ||
      // Safari on iOS 
      (isIOS() && !isStandalone())
    )
  );
}

/**
 * Check if the device supports push notifications
 */
export function supportsPushNotifications(): boolean {
  return (
    typeof window !== 'undefined' &&
    'serviceWorker' in navigator &&
    'PushManager' in window
  );
}

/**
 * Get the browser name
 */
export function getBrowserName(): string {
  if (typeof window === 'undefined') return 'unknown';
  
  const userAgent = window.navigator.userAgent;
  
  if (userAgent.indexOf('Chrome') > -1) return 'chrome';
  if (userAgent.indexOf('Safari') > -1) return 'safari';
  if (userAgent.indexOf('Firefox') > -1) return 'firefox';
  if (userAgent.indexOf('MSIE') > -1 || userAgent.indexOf('Trident') > -1) return 'ie';
  if (userAgent.indexOf('Edge') > -1) return 'edge';
  if (userAgent.indexOf('Opera') > -1 || userAgent.indexOf('OPR') > -1) return 'opera';
  
  return 'unknown';
}
