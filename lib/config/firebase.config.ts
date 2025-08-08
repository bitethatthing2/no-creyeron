// Firebase Configuration for Push Notifications
import { initializeApp } from 'firebase/app';
import { getMessaging, getToken, onMessage, MessagePayload } from 'firebase/messaging';

// Firebase config - matches existing service worker config
const firebaseConfig = {
  apiKey: "AIzaSyAUWCAf5xHLMitmAgI5gfy8d2o48pnjXeo",
  authDomain: "sidehustle-22a6a.firebaseapp.com",
  projectId: "sidehustle-22a6a",
  storageBucket: "sidehustle-22a6a.firebasestorage.app",
  messagingSenderId: "993911155207",
  appId: "1:993911155207:web:610f19ac354d69540bd8a2",
  measurementId: "G-RHT2310KWW"
};

// VAPID key for web push notifications
export const VAPID_KEY = process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY;

let app: any;
let messaging: any;

// Initialize Firebase
export const initializeFirebase = () => {
  if (typeof window !== 'undefined' && !app) {
    app = initializeApp(firebaseConfig);
    
    if ('serviceWorker' in navigator) {
      messaging = getMessaging(app);
    }
  }
  return { app, messaging };
};

// Get FCM registration token
export const getFCMToken = async (): Promise<string | null> => {
  try {
    if (!messaging) {
      const { messaging: msg } = initializeFirebase();
      if (!msg) return null;
      messaging = msg;
    }

    // Request notification permission
    const permission = await Notification.requestPermission();
    if (permission !== 'granted') {
      console.log('Notification permission denied');
      return null;
    }

    // Get registration token
    const token = await getToken(messaging, { 
      vapidKey: VAPID_KEY 
    });
    
    return token || null;
  } catch (error) {
    console.error('Error getting FCM token:', error);
    return null;
  }
};

// Listen for foreground messages
export const onForegroundMessage = (callback: (payload: MessagePayload) => void) => {
  if (!messaging) {
    const { messaging: msg } = initializeFirebase();
    if (!msg) return () => {};
    messaging = msg;
  }

  return onMessage(messaging, callback);
};

// Notification types
export interface NotificationData {
  type: 'event' | 'order' | 'chat' | 'social' | 'announcement' | 'general';
  id?: string;
  link?: string;
  priority?: 'low' | 'normal' | 'high' | 'urgent';
  [key: string]: any;
}

// Platform detection
export const getPlatform = (): 'web' | 'ios' | 'android' => {
  if (typeof window === 'undefined') return 'web';
  
  const userAgent = navigator.userAgent;
  
  if (/iPad|iPhone|iPod/.test(userAgent)) {
    return 'ios';
  } else if (/Android/.test(userAgent)) {
    return 'android';
  }
  
  return 'web';
};

// Device info
export const getDeviceInfo = () => {
  if (typeof window === 'undefined') {
    return {
      name: 'Server',
      model: 'Unknown',
      version: '1.0.0'
    };
  }

  return {
    name: navigator.userAgent.includes('Mobile') ? 'Mobile Device' : 'Desktop',
    model: navigator.userAgent,
    version: process.env.NEXT_PUBLIC_APP_VERSION || '1.0.0'
  };
};