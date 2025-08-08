'use client';

import { initializeFirebaseMessaging } from '@/lib/firebase/firebase-sw-inline';

// Firebase config from your existing service worker
const firebaseConfig = {
  apiKey: "AIzaSyAUWCAf5xHLMitmAgI5gfy8d2o48pnjXeo",
  authDomain: "sidehustle-22a6a.firebaseapp.com",
  projectId: "sidehustle-22a6a",
  storageBucket: "sidehustle-22a6a.firebasestorage.app",
  messagingSenderId: "993911155207",
  appId: "1:993911155207:web:610f19ac354d69540bd8a2"
};

class NotificationInitService {
  private initialized = false;
  private registration: ServiceWorkerRegistration | null = null;

  /**
   * Initialize push notifications
   */
  async initialize(): Promise<boolean> {
    if (this.initialized) return true;
    
    try {
      // Check if we're in a browser environment
      if (typeof window === 'undefined') {
        console.log('Not in browser environment, skipping notification init');
        return false;
      }

      // Check for notification support
      if (!('Notification' in window)) {
        console.log('This browser does not support notifications');
        return false;
      }

      // Check for service worker support
      if (!('serviceWorker' in navigator)) {
        console.log('This browser does not support service workers');
        return false;
      }

      // First try to register the existing service worker
      try {
        this.registration = await navigator.serviceWorker.register('/firebase-messaging-sw.js', {
          scope: '/firebase-cloud-messaging-push-scope'
        });
        console.log('Firebase messaging SW registered successfully:', this.registration);
      } catch (swError) {
        console.warn('Static SW registration failed, trying dynamic registration:', swError);
        
        // Fallback to dynamic registration if static fails
        this.registration = await initializeFirebaseMessaging(firebaseConfig);
        
        if (!this.registration) {
          console.error('Both static and dynamic SW registration failed');
          return false;
        }
      }

      // Request notification permission
      const permission = await this.requestPermission();
      
      if (permission !== 'granted') {
        console.log('Notification permission not granted');
        return false;
      }

      this.initialized = true;
      console.log('Notification service initialized successfully');
      return true;

    } catch (error) {
      console.error('Failed to initialize notification service:', error);
      return false;
    }
  }

  /**
   * Request notification permission
   */
  async requestPermission(): Promise<NotificationPermission> {
    try {
      // Check current permission
      if (Notification.permission === 'granted') {
        return 'granted';
      }

      if (Notification.permission === 'denied') {
        console.log('Notification permission is denied');
        return 'denied';
      }

      // Request permission
      const permission = await Notification.requestPermission();
      console.log('Notification permission:', permission);
      
      return permission;
    } catch (error) {
      console.error('Error requesting notification permission:', error);
      return 'denied';
    }
  }

  /**
   * Get FCM token (requires Firebase SDK to be loaded)
   */
  async getToken(): Promise<string | null> {
    try {
      if (!this.initialized) {
        const success = await this.initialize();
        if (!success) return null;
      }

      // This would require the Firebase SDK to be loaded
      // For now, just return null as the service worker handles everything
      console.log('Token retrieval would require Firebase SDK integration');
      return null;
    } catch (error) {
      console.error('Error getting FCM token:', error);
      return null;
    }
  }

  /**
   * Show a test notification
   */
  async showTestNotification(): Promise<boolean> {
    try {
      if (!this.initialized) {
        const success = await this.initialize();
        if (!success) return false;
      }

      if (Notification.permission !== 'granted') {
        console.log('Cannot show notification: permission not granted');
        return false;
      }

      const notification = new Notification('Side Hustle Test', {
        body: 'Push notifications are working!',
        icon: '/icons/favicon-for-public/web-app-manifest-192x192.png',
        badge: '/icons/badge-72x72.png',
        tag: 'test-notification',
        vibrate: [200, 100, 200]
      });

      // Close after 5 seconds
      setTimeout(() => {
        notification.close();
      }, 5000);

      return true;
    } catch (error) {
      console.error('Error showing test notification:', error);
      return false;
    }
  }

  /**
   * Get initialization status
   */
  isInitialized(): boolean {
    return this.initialized;
  }

  /**
   * Get current permission status
   */
  getPermissionStatus(): NotificationPermission {
    if (typeof window === 'undefined' || !('Notification' in window)) {
      return 'denied';
    }
    return Notification.permission;
  }
}

// Export singleton instance
export const notificationService = new NotificationInitService();

// Export for use in components
export default notificationService;