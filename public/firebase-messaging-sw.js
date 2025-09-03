// Firebase Cloud Messaging Service Worker
// Updated to work with environment variables and NEW SIDEHUSTLE Supabase backend types

importScripts('https://www.gstatic.com/firebasejs/10.11.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.11.0/firebase-messaging-compat.js');

// Firebase configuration will be injected by next.config.js
// This ensures credentials are not hardcoded in public files
const firebaseConfig = {
  apiKey: "${NEXT_PUBLIC_FIREBASE_API_KEY}",
  authDomain: "${NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN}",
  projectId: "${NEXT_PUBLIC_FIREBASE_PROJECT_ID}",
  storageBucket: "${NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET}",
  messagingSenderId: "${NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID}",
  appId: "${NEXT_PUBLIC_FIREBASE_APP_ID}"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);

// Get messaging instance
const messaging = firebase.messaging();

/**
 * Notification types based on the Supabase notifications table
 * type field check constraint
 */
const NotificationTypes = {
  INFO: 'info',
  WARNING: 'warning',
  ERROR: 'error',
  SUCCESS: 'success',
  ORDER_NEW: 'order_new',
  ORDER_READY: 'order_ready',
  ORDER_CANCELLED: 'order_cancelled',
  FOLLOW: 'follow',
  UNFOLLOW: 'unfollow',
  LIKE: 'like',
  COMMENT: 'comment',
  MENTION: 'mention',
  SHARE: 'share',
  POST_LIKE: 'post_like',
  POST_COMMENT: 'post_comment',
  MESSAGE: 'message',
  FRIEND_REQUEST: 'friend_request',
  SYSTEM: 'system',
  PROMOTION: 'promotion',
  ACHIEVEMENT: 'achievement'
};

/**
 * Content types based on the Supabase notifications table
 * content_type field check constraint
 */
const ContentTypes = {
  POST: 'post',
  COMMENT: 'comment',
  USER: 'user',
  ORDER: 'order',
  MESSAGE: 'message',
  CONVERSATION: 'conversation',
  EVENT: 'event',
  MENU_ITEM: 'menu_item'
};

/**
 * Get the appropriate icon for the notification type
 */
function getNotificationIcon() {
  // Use the wolf icon as default (as specified in users table)
  return '/icons/wolf-icon.png';
}

/**
 * Get the appropriate URL to open based on notification type
 */
function getNotificationUrl(notificationData) {
  const { type, content_type, content_id, action_url, data } = notificationData || {};
  
  // If action_url is provided, use it
  if (action_url) {
    return action_url;
  }
  
  // Route based on notification type
  switch (type) {
    // Social feed related notifications
    case NotificationTypes.FOLLOW:
    case NotificationTypes.UNFOLLOW:
      return data?.follower_id ? `/profile/${data.follower_id}` : '/social/feed';
    
    case NotificationTypes.POST_LIKE:
    case NotificationTypes.POST_COMMENT:
    case NotificationTypes.LIKE:
    case NotificationTypes.COMMENT:
    case NotificationTypes.MENTION:
    case NotificationTypes.SHARE:
      if (content_id && content_type === ContentTypes.POST) {
        return `/social/post/${content_id}`;
      }
      return '/social/feed';
    
    // Message related notifications
    case NotificationTypes.MESSAGE:
      if (content_id && content_type === ContentTypes.CONVERSATION) {
        return `/messages/conversation/${content_id}`;
      }
      return '/messages';
    
    // Order related notifications
    case NotificationTypes.ORDER_NEW:
    case NotificationTypes.ORDER_READY:
    case NotificationTypes.ORDER_CANCELLED:
      if (content_id && content_type === ContentTypes.ORDER) {
        return `/orders/${content_id}`;
      }
      return '/orders';
    
    // System notifications
    case NotificationTypes.SYSTEM:
    case NotificationTypes.PROMOTION:
    case NotificationTypes.ACHIEVEMENT:
      return '/notifications';
    
    // Friend request
    case NotificationTypes.FRIEND_REQUEST:
      return data?.requester_id ? `/profile/${data.requester_id}` : '/social/friends';
    
    // Default to notifications page
    default:
      return '/notifications';
  }
}

/**
 * Format the notification message with user info
 */
function formatNotificationBody(payload) {
  const { type, message, data } = payload.data || {};
  
  // If message is provided, use it
  if (message) {
    return message;
  }
  
  // Generate message based on type
  switch (type) {
    case NotificationTypes.FOLLOW:
      return data?.follower_name 
        ? `${data.follower_name} started following you`
        : 'You have a new follower';
    
    case NotificationTypes.POST_LIKE:
      return data?.liker_name
        ? `${data.liker_name} liked your post`
        : 'Someone liked your post';
    
    case NotificationTypes.POST_COMMENT:
      return data?.commenter_name
        ? `${data.commenter_name} commented on your post`
        : 'New comment on your post';
    
    case NotificationTypes.MESSAGE:
      return data?.sender_name
        ? `New message from ${data.sender_name}`
        : 'You have a new message';
    
    case NotificationTypes.ORDER_NEW:
      return data?.order_number
        ? `New order #${data.order_number} received`
        : 'New order received';
    
    case NotificationTypes.ORDER_READY:
      return data?.order_number
        ? `Order #${data.order_number} is ready`
        : 'Your order is ready';
    
    default:
      return 'You have a new notification';
  }
}

// Handle background messages
messaging.onBackgroundMessage(function(payload) {
  console.log('[firebase-messaging-sw.js] Received background message:', payload);
  
  // Extract notification data
  const notificationData = {
    ...payload.data,
    ...(payload.notification || {})
  };
  
  // Parse JSON data if it's a string
  if (typeof notificationData.data === 'string') {
    try {
      notificationData.data = JSON.parse(notificationData.data);
    } catch (e) {
      console.error('Failed to parse notification data:', e);
    }
  }
  
  const notificationTitle = notificationData.title || 'Side Hustle';
  const notificationBody = formatNotificationBody(notificationData);
  
  const notificationOptions = {
    body: notificationBody,
    icon: getNotificationIcon(notificationData.type),
    badge: '/icons/badge-72x72.png',
    tag: notificationData.id || notificationData.notificationId || 'side-hustle-notification',
    data: notificationData,
    actions: [
      {
        action: 'open',
        title: 'Open',
        icon: '/icons/action-open.png'
      },
      {
        action: 'dismiss',
        title: 'Dismiss',
        icon: '/icons/action-dismiss.png'
      }
    ],
    requireInteraction: notificationData.priority === 'urgent' || notificationData.priority === 'high',
    silent: notificationData.priority === 'low',
    vibrate: notificationData.priority === 'urgent' ? [500, 250, 500] : [200, 100, 200]
  };
  
  // Add image for post notifications
  if (notificationData.type === NotificationTypes.POST_LIKE || 
      notificationData.type === NotificationTypes.POST_COMMENT) {
    if (notificationData.data?.post_thumbnail_url) {
      notificationOptions.image = notificationData.data.post_thumbnail_url;
    }
  }
  
  self.registration.showNotification(notificationTitle, notificationOptions);
});

// Handle notification clicks
self.addEventListener('notificationclick', function(event) {
  console.log('[firebase-messaging-sw.js] Notification click received:', event);
  
  event.notification.close();
  
  // Handle dismiss action
  if (event.action === 'dismiss') {
    return;
  }
  
  // Get the URL to open
  const urlToOpen = getNotificationUrl(event.notification.data);
  
  event.waitUntil(
    clients.matchAll({
      type: 'window',
      includeUncontrolled: true
    }).then(function(clientList) {
      // Check if there's already a window/tab open
      for (let i = 0; i < clientList.length; i++) {
        const client = clientList[i];
        // If we have a matching client, focus it
        if (client.url.includes(self.registration.scope) && 'focus' in client) {
          return client.focus().then(function(focusedClient) {
            // Navigate to the specific page
            if (focusedClient && 'navigate' in focusedClient) {
              return focusedClient.navigate(urlToOpen);
            }
          });
        }
      }
      // If no client is open, open a new window
      if (clients.openWindow) {
        return clients.openWindow(urlToOpen);
      }
    })
  );
});

// Handle push event (additional handler for edge cases)
self.addEventListener('push', function(event) {
  if (event.data) {
    try {
      const data = event.data.json();
      console.log('[firebase-messaging-sw.js] Push event received:', data);
      
      // If the notification wasn't handled by onBackgroundMessage
      if (!data.notification && !messaging._bgMessageHandler) {
        const notificationData = {
          ...data,
          data: typeof data.data === 'string' ? JSON.parse(data.data) : data.data
        };
        
        const notificationTitle = notificationData.title || 'Side Hustle';
        const notificationBody = formatNotificationBody(notificationData);
        
        const notificationOptions = {
          body: notificationBody,
          icon: getNotificationIcon(notificationData.type),
          badge: '/icons/badge-72x72.png',
          tag: notificationData.id || 'side-hustle-notification',
          data: notificationData,
          requireInteraction: notificationData.priority === 'urgent' || notificationData.priority === 'high',
          vibrate: [200, 100, 200]
        };
        
        event.waitUntil(
          self.registration.showNotification(notificationTitle, notificationOptions)
        );
      }
    } catch (error) {
      console.error('[firebase-messaging-sw.js] Error processing push event:', error);
    }
  }
});

// Service worker activation
self.addEventListener('activate', function(event) {
  console.log('[firebase-messaging-sw.js] Service worker activated');
  event.waitUntil(self.clients.claim());
});

// Service worker installation
self.addEventListener('install', function() {
  console.log('[firebase-messaging-sw.js] Service worker installed');
  self.skipWaiting();
});