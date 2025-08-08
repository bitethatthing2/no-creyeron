// Fixed FCM Notification Service that works with existing sw.js
import { initializeApp, getApps } from 'firebase/app';
import { getMessaging, getToken, onMessage } from 'firebase/messaging';

export class FixedNotificationService {
  private messaging: any = null;
  private registration: ServiceWorkerRegistration | null = null;
  private fcmToken: string | null = null;
  private isSupported = typeof window !== 'undefined' && 'serviceWorker' in navigator && 'PushManager' in window;

  constructor() {
    if (typeof window === 'undefined') return;
    this.initialize();
  }

  async initialize() {
    try {
      if (!this.isSupported) {
        console.warn('Push notifications not supported');
        return false;
      }

      // Initialize Firebase if not already done
      if (getApps().length === 0) {
        const firebaseConfig = {
          apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
          authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
          projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
          storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
          messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
          appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
        };
        initializeApp(firebaseConfig);
      }

      // Get messaging instance
      this.messaging = getMessaging();

      // Ensure service worker is registered
      await this.ensureServiceWorkerReady();
      
      // Get FCM token (non-blocking)
      this.getFCMToken().catch(error => {
        console.log("FCM token not available:", error.message);
      });

      // Listen for foreground messages
      if (this.messaging) {
        onMessage(this.messaging, (payload) => {
          console.log("Foreground message received:", payload);
          this.handleForegroundMessage(payload);
        });
      }

      return true;
    } catch (error) {
      console.error("Failed to initialize notification service:", error);
      return false;
    }
  }

  private async ensureServiceWorkerReady() {
    try {
      // Check if service worker is already registered
      this.registration = await navigator.serviceWorker.getRegistration();
      
      if (!this.registration) {
        console.log("No service worker found, waiting for existing registration...");
        // Wait for the existing service worker to be ready
        this.registration = await navigator.serviceWorker.ready;
      }

      if (this.registration) {
        console.log("Service worker ready for FCM");
        return this.registration;
      } else {
        throw new Error("No service worker available");
      }
    } catch (error) {
      console.error("Service worker not ready:", error);
      throw error;
    }
  }

  private async getFCMToken() {
    try {
      if (!this.messaging) {
        throw new Error("Firebase messaging not initialized");
      }

      // Ensure service worker is ready
      if (!this.registration) {
        await this.ensureServiceWorkerReady();
      }

      // Check notification permission
      if (Notification.permission !== "granted") {
        console.log("Notification permission not granted");
        return null;
      }

      console.log("Getting FCM token with service worker...");
      const token = await getToken(this.messaging, {
        vapidKey: process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY,
        serviceWorkerRegistration: this.registration
      });

      if (token) {
        this.fcmToken = token;
        console.log("FCM token obtained successfully");
        await this.storeFCMToken(token);
        return token;
      } else {
        console.log("No FCM token received");
        return null;
      }
    } catch (error) {
      console.error("Error getting FCM token:", error);
      
      // More specific error handling
      if (error instanceof Error) {
        if (error.name === 'AbortError') {
          console.error("FCM token request was aborted - service worker may not be active");
        } else if (error.message.includes('service worker')) {
          console.error("Service worker issue:", error.message);
        } else if (error.message.includes('permission')) {
          console.error("Permission issue:", error.message);
        }
      }
      
      return null;
    }
  }

  private async storeFCMToken(token: string) {
    try {
      const { createClient } = await import('@supabase/supabase-js');
      const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      );

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Get user's internal ID
      const { data: userData } = await supabase
        .from('users')
        .select('id')
        .eq('auth_id', user.id)
        .single();

      if (userData) {
        await supabase
          .from('user_fcm_tokens')
          .upsert({
            user_id: userData.id,
            token: token,
            is_active: true,
            updated_at: new Date().toISOString()
          });
        
        console.log("FCM token stored successfully");
      }
    } catch (error) {
      console.error('Error storing FCM token:', error);
    }
  }

  async requestPermission() {
    try {
      if (!this.isSupported) return false;
      
      const permission = await Notification.requestPermission();
      if (permission === 'granted') {
        console.log('Notification permission granted');
        // Try to get FCM token now that permission is granted
        await this.getFCMToken();
        return true;
      } else {
        console.log('Notification permission denied');
        return false;
      }
    } catch (error) {
      console.error('Error requesting notification permission:', error);
      return false;
    }
  }

  private handleForegroundMessage(payload: any) {
    try {
      const notificationTitle = payload.notification?.title || 'Side Hustle';
      const notificationOptions = {
        body: payload.notification?.body || 'You have a new notification',
        icon: payload.notification?.icon || '/icons/wolf-icon.png',
        badge: '/icons/wolf-icon.png',
        tag: payload.data?.notificationId || 'side-hustle-notification',
        data: payload.data,
        requireInteraction: true,
      };

      // Show notification
      if (this.registration) {
        this.registration.showNotification(notificationTitle, notificationOptions);
      } else {
        // Fallback to browser notification
        new Notification(notificationTitle, notificationOptions);
      }
    } catch (error) {
      console.error('Error handling foreground message:', error);
    }
  }

  getToken() {
    return this.fcmToken;
  }

  isInitialized() {
    return !!this.messaging;
  }
}