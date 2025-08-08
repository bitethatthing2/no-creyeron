import { initializeApp, getApps } from 'firebase/app';
import { getMessaging, getToken, onMessage, Messaging } from 'firebase/messaging';
import { firebaseConfig } from '@/config/app.config';
import { FirebaseConfig, FcmMessagePayload } from '@/types/features/firebase';

// Use secure configuration from validated environment
const firebaseClientConfig: FirebaseConfig = firebaseConfig;

// Global initialization flag to prevent multiple attempts
let isInitializing = false;
let initializationError: Error | null = null;

/**
 * Get or initialize the Firebase app
 */
const getFirebaseApp = () => {
  const apps = getApps();
  if (apps.length) return apps[0];
  return initializeApp(firebaseClientConfig);
};

/**
 * Initialize Firebase with improved error handling and retry logic
 */
export const initFirebase = async () => {
  // Prevent multiple simultaneous initialization attempts
  if (isInitializing) {
    console.log('Firebase initialization already in progress, waiting...');
    // Wait for current initialization to complete
    await new Promise(resolve => {
      const checkInterval = setInterval(() => {
        if (!isInitializing) {
          clearInterval(checkInterval);
          resolve(null);
        }
      }, 100);
    });
    
    // If previous initialization failed, throw the error
    if (initializationError) {
      throw initializationError;
    }
    
    return;
  }
  
  // Return if already initialized
  if (getApps().length) {
    console.log('Firebase already initialized');
    return;
  }
  
  isInitializing = true;
  initializationError = null;
  
  try {
    const app = initializeApp(firebaseClientConfig);
    console.log('Firebase initialized successfully');
    return app;
  } catch (error) {
    console.error('Error initializing Firebase:', error);
    initializationError = error instanceof Error ? error : new Error(String(error));
    throw error;
  } finally {
    isInitializing = false;
  }
};

/**
 * Get Firebase messaging instance with improved error handling
 */
export const getMessagingInstance = (): Messaging | null => {
  if (typeof window === 'undefined') return null;
  
  try {
    const app = getFirebaseApp();
    if (!app) return null;
    
    const messaging = getMessaging(app);
    return messaging;
  } catch (error) {
    console.error('Error getting Firebase messaging:', error);
    return null;
  }
};

/**
 * Check if the current browser can support push notifications
 * More specific than just Notification API check
 */
export const canSupportPushNotifications = (): boolean => {
  if (typeof window === 'undefined') return false;
  
  const userAgent = window.navigator.userAgent.toLowerCase();
  const isIOS = /iphone|ipad|ipod/.test(userAgent) || 
                (/mac/.test(userAgent) && navigator.maxTouchPoints > 1);
  
  // Check for Safari - pushManager is now supported in iOS Safari 16.4+
  if (isIOS) {
    // Safari 16.4+ supports push notifications through Push API
    // Check for existence of navigator.serviceWorker and pushManager
    return !!(navigator.serviceWorker && 'PushManager' in window);
  }
  
  // Other browsers - check if service workers, Push API and notifications are supported
  return !!(
    'serviceWorker' in navigator &&
    'PushManager' in window &&
    'Notification' in window
  );
};

/**
 * Request notification permission with improved error handling
 */
export const requestNotificationPermission = async (): Promise<NotificationPermission> => {
  try {
    // Check if notification API is supported
    if (typeof window === 'undefined' || !('Notification' in window)) {
      console.warn('This browser does not support notifications');
      return 'denied';
    }
    
    // Request permission
    const permission = await Notification.requestPermission();
    console.log(`Notification permission status: ${permission}`);
    return permission;
  } catch (error) {
    console.error('Error requesting notification permission:', error);
    return 'denied';
  }
};

/**
 * Check if service worker is registered and active
 */
export const isServiceWorkerActive = async (): Promise<boolean> => {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
    return false;
  }
  
  try {
    const registrations = await navigator.serviceWorker.getRegistrations();
    
    for (const registration of registrations) {
      if (registration.active) {
        console.log('Found active service worker:', registration.scope);
        return true;
      }
    }
    
    console.warn('No active service worker found');
    return false;
  } catch (error) {
    console.error('Error checking service worker status:', error);
    return false;
  }
};

/**
 * Register the Firebase messaging service worker
 */
export const registerServiceWorker = async (): Promise<ServiceWorkerRegistration | null> => {
  if (!('serviceWorker' in navigator)) {
    console.warn('Service workers are not supported in this browser');
    return null;
  }
  
  // Check if a service worker is already registered and controlling the page
  if (navigator.serviceWorker.controller) {
    console.log('Service worker is already registered and controlling the page');
    try {
      // Get the existing service worker registration
      const registration = await navigator.serviceWorker.ready;
      console.log('Using existing service worker registration:', registration.scope);
      return registration;
    } catch (error) {
      console.error('Error getting existing service worker registration:', error);
    }
  }
  
  // If we reach here, there's no service worker controlling the page
  // DO NOT register a new one - let the ServiceWorkerRegister component handle this
  console.log('Deferring service worker registration to ServiceWorkerRegister component');
  return null;
};

/**
 * Get FCM token with improved error handling and retry logic
 */
export const fetchToken = async (maxRetries = 2): Promise<string | null> => {
  if (typeof window === 'undefined') return null;
  
  // Check if this browser supports push notifications
  if (!canSupportPushNotifications()) {
    console.log('This browser does not support push notifications');
    return null;
  }
  
  let retryCount = 0;
  
  while (retryCount <= maxRetries) {
    try {
      // Initialize Firebase if not already initialized
      if (!getApps().length) {
        await initFirebase();
      }
      
      const messaging = getMessagingInstance();
      if (!messaging) {
        throw new Error('Failed to get messaging instance');
      }
      
      // Use the VAPID key from secure configuration
      const vapidKey = firebaseConfig.vapidKey;
      
      console.log(`Attempting to get FCM token (attempt ${retryCount + 1}/${maxRetries + 1})`);
      
      // Check if service worker is active
      const hasActiveServiceWorker = await isServiceWorkerActive();
      
      if (hasActiveServiceWorker) {
        // Get the active service worker registration
        const swRegistration = await navigator.serviceWorker.ready;
        
        // Try to get token with existing registration
        const token = await getToken(messaging, {
          vapidKey,
          serviceWorkerRegistration: swRegistration
        });
        
        if (token) {
          console.log('FCM token received successfully:', token.substring(0, 10) + '...');
          return token;
        }
        
        console.warn('No token received with existing service worker, will try clean registration');
      } else {
        console.log('No active service worker found, registering new one');
      }
      
      // If we get here, we need to try a clean registration
      // Unregister existing service workers
      const registrations = await navigator.serviceWorker.getRegistrations();
      for (const registration of registrations) {
        await registration.unregister();
      }
      
      // Register a new service worker
      const newRegistration = await registerServiceWorker();
      if (!newRegistration) {
        throw new Error('Failed to register service worker');
      }
      
      // Wait for the service worker to be ready
      await navigator.serviceWorker.ready;
      
      // Try to get token with new registration
      const token = await getToken(messaging, {
        vapidKey,
        serviceWorkerRegistration: newRegistration
      });
      
      if (token) {
        console.log('FCM token received successfully after clean registration');
        return token;
      }
      
      throw new Error('Failed to get FCM token after clean registration');
    } catch (error) {
      console.error(`Error getting FCM token (attempt ${retryCount + 1}/${maxRetries + 1}):`, error);
      
      // Last attempt, try fallback method
      if (retryCount === maxRetries) {
        try {
          console.log('Trying fallback method to get FCM token');
          const messaging = getMessagingInstance();
          if (!messaging) return null;
          
          const fallbackToken = await getToken(messaging, { vapidKey: firebaseConfig.vapidKey });
          
          if (fallbackToken) {
            console.log('FCM token received with fallback method');
            return fallbackToken;
          }
        } catch (fallbackError) {
          console.error('Fallback token method failed:', fallbackError);
        }
      }
      
      retryCount++;
      
      if (retryCount <= maxRetries) {
        // Wait before retrying (exponential backoff)
        const waitTime = Math.pow(2, retryCount) * 1000;
        console.log(`Retrying in ${waitTime}ms...`);
        await new Promise(resolve => setTimeout(resolve, waitTime));
      }
    }
  }
  
  console.error('Failed to get FCM token after all retry attempts');
  return null;
};

/**
 * Handle foreground messages with improved error handling
 * and consistent data payload format
 */
export const setupForegroundMessageHandler = (messaging: Messaging, callback?: (payload: FcmMessagePayload) => void) => {
  if (!messaging) {
    console.error('Cannot set up message handler: messaging instance is null');
    return () => {}; // Return no-op unsubscribe function
  }
  
  try {
    return onMessage(messaging, (payload: FcmMessagePayload) => {
      console.log('Foreground message received:', payload);
      
      try {
        // Extract data from the data field (prioritize data over notification)
        // This ensures consistent format with background messages
        const dataObject = payload.data || {};
        
        // Call the callback if provided - this will handle the custom UI notification
        if (callback) {
          // Ensure the data object has the necessary fields, falling back to notification object if needed
          if (!dataObject.title && payload.notification?.title) {
            dataObject.title = payload.notification.title;
          }
          
          if (!dataObject.body && payload.notification?.body) {
            dataObject.body = payload.notification.body;
          }
          
          // Update the payload with the enhanced data object
          const enhancedPayload = {
            ...payload,
            data: dataObject
          };
          
          callback(enhancedPayload);
        }
        
        // For browsers that don't support the callback method (like Safari on iOS),
        // create and show a native notification as a fallback
        if ('Notification' in window && Notification.permission === 'granted') {
          // Only show native notification if the page is not visible
          if (document.visibilityState !== 'visible') {
            // Use consistent data format
            const title = dataObject.title || payload.notification?.title || 'New Message';
            const body = dataObject.body || payload.notification?.body || '';
            // CRITICAL: Always use the exact path for notification icons
            const icon = '/icons/android-big-icon.png';
            const image = dataObject.image || payload.notification?.image;
            
            // Extract link from various possible locations
            const link = 
              dataObject.link || 
              payload.fcmOptions?.link || 
              (payload.notification as { clickAction?: string })?.clickAction || 
              '/';
            
            // Create notification options
            const options: NotificationOptions = {
              body,
              icon,
              badge: '/icons/android-lil-icon-white.png',
              requireInteraction: true,
              data: { url: link }
            };
            
            // Add image if available (supported in modern browsers)
            if (image) {
              // @ts-expect-error - image is valid in modern browsers
              options.image = image;
            }
            
            // Create and show the notification
            const notification = new Notification(title, options);
            
            // Add click handler
            notification.onclick = () => {
              // Focus the window if it's already open
              window.focus();
              
              // Navigate to the URL
              if (link.startsWith('http')) {
                window.open(link, '_blank');
              } else {
                window.location.href = link;
              }
              
              // Close the notification
              notification.close();
            };
          }
        }
      } catch (error) {
        console.error('Error handling foreground message:', error);
      }
    });
  } catch (error) {
    console.error('Error setting up foreground message handler:', error);
    return () => {}; // Return no-op unsubscribe function
  }
};

export { onMessage };
