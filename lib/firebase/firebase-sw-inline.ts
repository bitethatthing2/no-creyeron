// Firebase messaging service worker utilities to avoid CSP issues

export interface FirebaseConfig {
  apiKey: string;
  authDomain: string;
  projectId: string;
  storageBucket: string;
  messagingSenderId: string;
  appId: string;
  measurementId?: string;
}

export const getFirebaseMessagingSWContent = (firebaseConfig: FirebaseConfig) => {
  return `
    // Firebase Messaging Service Worker
    const firebaseConfig = ${JSON.stringify(firebaseConfig)};

    // Instead of importScripts, use fetch to load the scripts
    self.addEventListener('install', async (event) => {
      console.log('Firebase SW installing...');
      
      try {
        // Fetch and eval the Firebase scripts (workaround for CSP)
        const [appResponse, messagingResponse] = await Promise.all([
          fetch('https://www.gstatic.com/firebasejs/10.11.0/firebase-app-compat.js'),
          fetch('https://www.gstatic.com/firebasejs/10.11.0/firebase-messaging-compat.js')
        ]);

        const appScript = await appResponse.text();
        const messagingScript = await messagingResponse.text();

        // Create a function to evaluate the scripts
        const evalScript = new Function(appScript + '\\n' + messagingScript);
        evalScript();

        // Initialize Firebase
        firebase.initializeApp(firebaseConfig);
        const messaging = firebase.messaging();

        // Handle background messages
        messaging.onBackgroundMessage((payload) => {
          console.log('[firebase-messaging-sw.js] Received background message ', payload);
          
          const notificationTitle = payload.notification?.title || 'New Message';
          const notificationOptions = {
            body: payload.notification?.body || 'You have a new message',
            icon: '/icons/favicon-for-public/web-app-manifest-192x192.png',
            badge: '/icons/badge-72x72.png',
            data: payload.data,
            tag: payload.data?.tag || 'default',
            renotify: true,
            actions: [
              {
                action: 'open',
                title: 'Open',
                icon: '/icons/favicon-for-public/web-app-manifest-192x192.png'
              },
              {
                action: 'close',
                title: 'Close',
                icon: '/icons/favicon-for-public/web-app-manifest-192x192.png'
              }
            ]
          };

          self.registration.showNotification(notificationTitle, notificationOptions);
        });

      } catch (error) {
        console.error('Failed to initialize Firebase in SW:', error);
      }
    });

    self.addEventListener('activate', (event) => {
      console.log('Firebase SW activated');
    });

    // Handle notification clicks
    self.addEventListener('notificationclick', (event) => {
      console.log('Notification clicked:', event);
      
      event.notification.close();
      
      if (event.action === 'open' || !event.action) {
        // Open the app
        event.waitUntil(
          clients.openWindow('/')
        );
      }
    });
  `;
};

/**
 * Register the Firebase messaging service worker dynamically to avoid CSP issues
 */
export const registerFirebaseMessagingSW = async (firebaseConfig: FirebaseConfig) => {
  if (!('serviceWorker' in navigator)) {
    console.log('Service workers not supported');
    return null;
  }

  try {
    // Create a blob with the service worker content
    const swContent = getFirebaseMessagingSWContent(firebaseConfig);
    const blob = new Blob([swContent], { type: 'application/javascript' });
    const swUrl = URL.createObjectURL(blob);

    // Register the service worker from the blob URL
    const registration = await navigator.serviceWorker.register(swUrl, {
      scope: '/firebase-cloud-messaging-push-scope'
    });

    console.log('Firebase messaging SW registered:', registration);

    // Clean up the blob URL after registration
    URL.revokeObjectURL(swUrl);

    return registration;
  } catch (error) {
    console.error('Failed to register Firebase messaging SW:', error);
    throw error;
  }
};

/**
 * Alternative: Create a static service worker file with proper config injection
 */
export const createStaticFirebaseSW = async (firebaseConfig: FirebaseConfig) => {
  try {
    const swContent = `
// Firebase Messaging Service Worker
importScripts('https://www.gstatic.com/firebasejs/10.11.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.11.0/firebase-messaging-compat.js');

// Initialize Firebase in the service worker
firebase.initializeApp(${JSON.stringify(firebaseConfig)});

const messaging = firebase.messaging();

// Handle background messages
messaging.onBackgroundMessage((payload) => {
  console.log('[firebase-messaging-sw.js] Received background message ', payload);
  
  const notificationTitle = payload.notification?.title || 'Side Hustle';
  const notificationOptions = {
    body: payload.notification?.body || 'You have a new message',
    icon: '/icons/favicon-for-public/web-app-manifest-192x192.png',
    badge: '/icons/badge-72x72.png',
    data: payload.data,
    tag: payload.data?.tag || 'default',
    renotify: true,
    actions: [
      {
        action: 'open',
        title: 'Open',
        icon: '/icons/favicon-for-public/web-app-manifest-192x192.png'
      },
      {
        action: 'close',
        title: 'Close',
        icon: '/icons/favicon-for-public/web-app-manifest-192x192.png'
      }
    ]
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});

// Handle notification clicks
self.addEventListener('notificationclick', (event) => {
  console.log('Notification clicked:', event);
  
  event.notification.close();
  
  if (event.action === 'open' || !event.action) {
    // Open the app
    event.waitUntil(
      clients.openWindow('/')
    );
  }
});
`;

    return swContent;
  } catch (error) {
    console.error('Failed to create static Firebase SW:', error);
    throw error;
  }
};

/**
 * Initialize Firebase messaging with proper error handling
 */
export const initializeFirebaseMessaging = async (firebaseConfig: FirebaseConfig) => {
  if (typeof window === 'undefined') return null;

  try {
    // Check if notifications are supported
    if (!('Notification' in window)) {
      console.log('This browser does not support notifications');
      return null;
    }

    // Register the service worker
    const registration = await registerFirebaseMessagingSW(firebaseConfig);
    
    if (!registration) {
      console.log('Service worker registration failed');
      return null;
    }

    // Request notification permission
    const permission = await Notification.requestPermission();
    
    if (permission !== 'granted') {
      console.log('Notification permission denied');
      return null;
    }

    console.log('Firebase messaging initialized successfully');
    return registration;

  } catch (error) {
    console.error('Failed to initialize Firebase messaging:', error);
    return null;
  }
};