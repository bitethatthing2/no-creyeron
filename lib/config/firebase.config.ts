/**
 * Firebase Configuration for Push Notifications
 * Integrates with Supabase backend for token storage
 */

import { FirebaseApp, initializeApp } from "firebase/app";
import {
  getMessaging,
  getToken,
  MessagePayload,
  Messaging,
  onMessage,
} from "firebase/messaging";
import { supabase } from "@/lib/supabase";

// Firebase configuration
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY ||
    "AIzaSyAUWCAf5xHLMitmAgI5gfy8d2o48pnjXeo",
  authDomain: "sidehustle-22a6a.firebaseapp.com",
  projectId: "sidehustle-22a6a",
  storageBucket: "sidehustle-22a6a.firebasestorage.app",
  messagingSenderId: "993911155207",
  appId: "1:993911155207:web:610f19ac354d69540bd8a2",
  measurementId: "G-RHT2310KWW",
};

// VAPID key for web push notifications
const VAPID_KEY = process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY || "";

// Singleton instances
let firebaseApp: FirebaseApp | null = null;
let messaging: Messaging | null = null;

/**
 * Initialize Firebase app and messaging
 */
export const initializeFirebase = (): {
  app: FirebaseApp | null;
  messaging: Messaging | null;
} => {
  if (typeof window === "undefined") {
    return { app: null, messaging: null };
  }

  if (!firebaseApp) {
    firebaseApp = initializeApp(firebaseConfig);
  }

  if (!messaging && "serviceWorker" in navigator && "Notification" in window) {
    try {
      messaging = getMessaging(firebaseApp);
    } catch (error) {
      console.error("Failed to initialize Firebase Messaging:", error);
    }
  }

  return { app: firebaseApp, messaging };
};

/**
 * Platform detection
 */
export type Platform = "web" | "ios" | "android";

export const getPlatform = (): Platform => {
  if (typeof window === "undefined") return "web";

  const userAgent = navigator.userAgent.toLowerCase();

  if (
    /ipad|iphone|ipod/.test(userAgent) &&
    !("MSStream" in (window as unknown as Record<string, unknown>))
  ) {
    return "ios";
  } else if (/android/.test(userAgent)) {
    return "android";
  }

  return "web";
};

/**
 * Get device information
 */
export interface DeviceInfo {
  name: string;
  model: string;
  version: string;
  browser?: string;
  os?: string;
}

export const getDeviceInfo = (): DeviceInfo => {
  if (typeof window === "undefined") {
    return {
      name: "Server",
      model: "Unknown",
      version: process.env.NEXT_PUBLIC_APP_VERSION || "1.0.0",
    };
  }

  const userAgent = navigator.userAgent;
  const platform = getPlatform();

  // Parse browser info
  let browser = "Unknown";
  if (userAgent.includes("Chrome")) browser = "Chrome";
  else if (userAgent.includes("Safari")) browser = "Safari";
  else if (userAgent.includes("Firefox")) browser = "Firefox";
  else if (userAgent.includes("Edge")) browser = "Edge";

  return {
    name: platform === "web" ? "Desktop" : "Mobile Device",
    model: navigator.platform || "Unknown",
    version: process.env.NEXT_PUBLIC_APP_VERSION || "1.0.0",
    browser,
    os: platform,
  };
};

/**
 * Get FCM registration token and save to Supabase
 */
export const getFCMToken = async (): Promise<string | null> => {
  try {
    // Check if we're in a browser environment
    if (typeof window === "undefined") {
      return null;
    }

    // Initialize Firebase if needed
    if (!messaging) {
      const { messaging: msg } = initializeFirebase();
      if (!msg) {
        console.error("Firebase Messaging not available");
        return null;
      }
      messaging = msg;
    }

    // Request notification permission
    const permission = await Notification.requestPermission();
    if (permission !== "granted") {
      console.log("Notification permission denied");
      return null;
    }

    // Get registration token
    if (!VAPID_KEY) {
      console.error("VAPID key not configured");
      return null;
    }

    const token = await getToken(messaging, {
      vapidKey: VAPID_KEY,
    });

    if (!token) {
      console.error("Failed to get FCM token");
      return null;
    }

    // Save token to Supabase
    await savePushToken(token);

    return token;
  } catch (error) {
    console.error("Error getting FCM token:", error);
    return null;
  }
};

/**
 * Save push token to Supabase database
 */
export const savePushToken = async (token: string): Promise<boolean> => {
  try {
    // Get authenticated user
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      console.error("No authenticated user to save push token");
      return false;
    }

    // Get public user profile
    const { data: publicUser, error: userError } = await supabase
      .from("users")
      .select("id")
      .eq("auth_id", user.id)
      .single();

    if (userError || !publicUser) {
      console.error("Failed to get public user profile:", userError);
      return false;
    }

    const platform = getPlatform();
    const deviceInfo = getDeviceInfo();

    // Check if token already exists for this user and device
    const { data: existingToken } = await supabase
      .from("push_tokens")
      .select("id")
      .eq("user_id", publicUser.id)
      .eq("token", token)
      .single();

    if (existingToken) {
      // Update last_used_at
      const { error: updateError } = await supabase
        .from("push_tokens")
        .update({
          last_used_at: new Date().toISOString(),
          is_active: true,
          device_info: deviceInfo,
          platform,
        })
        .eq("id", existingToken.id);

      if (updateError) {
        console.error("Failed to update push token:", updateError);
        return false;
      }
    } else {
      // Insert new token
      const { error: insertError } = await supabase
        .from("push_tokens")
        .insert({
          user_id: publicUser.id,
          token,
          platform,
          device_info: deviceInfo,
          is_active: true,
        });

      if (insertError) {
        console.error("Failed to save push token:", insertError);
        return false;
      }
    }

    console.log("Push token saved successfully");
    return true;
  } catch (error) {
    console.error("Error saving push token:", error);
    return false;
  }
};

/**
 * Remove push token from Supabase
 */
export const removePushToken = async (token?: string): Promise<boolean> => {
  try {
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return false;
    }

    // Get public user profile
    const { data: publicUser } = await supabase
      .from("users")
      .select("id")
      .eq("auth_id", user.id)
      .single();

    if (!publicUser) {
      return false;
    }

    if (token) {
      // Deactivate specific token
      const { error } = await supabase
        .from("push_tokens")
        .update({
          is_active: false,
          updated_at: new Date().toISOString(),
        })
        .eq("user_id", publicUser.id)
        .eq("token", token);

      if (error) {
        console.error("Failed to remove push token:", error);
        return false;
      }
    } else {
      // Deactivate all tokens for this user on this platform
      const platform = getPlatform();
      const { error } = await supabase
        .from("push_tokens")
        .update({
          is_active: false,
          updated_at: new Date().toISOString(),
        })
        .eq("user_id", publicUser.id)
        .eq("platform", platform);

      if (error) {
        console.error("Failed to remove push tokens:", error);
        return false;
      }
    }

    return true;
  } catch (error) {
    console.error("Error removing push token:", error);
    return false;
  }
};

/**
 * Listen for foreground messages
 */
export const onForegroundMessage = (
  callback: (payload: MessagePayload) => void,
): () => void => {
  if (!messaging) {
    const { messaging: msg } = initializeFirebase();
    if (!msg) {
      console.error("Firebase Messaging not available");
      return () => {};
    }
    messaging = msg;
  }

  return onMessage(messaging, callback);
};

/**
 * Notification data interface
 */
export interface NotificationData {
  type:
    | "info"
    | "warning"
    | "error"
    | "success"
    | "order_new"
    | "order_ready"
    | "order_cancelled"
    | "follow"
    | "unfollow"
    | "like"
    | "comment"
    | "mention"
    | "share"
    | "post_like"
    | "post_comment"
    | "message"
    | "friend_request"
    | "system"
    | "promotion"
    | "achievement";
  id?: string;
  action_url?: string;
  content_type?: string;
  content_id?: string;
  related_user_id?: string;
  priority?: "low" | "normal" | "high" | "urgent";
  [key: string]: unknown;
}

/**
 * Handle incoming notification
 */
export const handleNotification = async (
  payload: MessagePayload,
): Promise<void> => {
  console.log("Received foreground message:", payload);

  // Extract notification data
  const { notification, data } = payload;

  if (!notification) return;

  // Get authenticated user
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;

  // Get public user profile
  const { data: publicUser } = await supabase
    .from("users")
    .select("id")
    .eq("auth_id", user.id)
    .single();

  if (!publicUser) return;

  // Save notification to database
  const notificationData: NotificationData = {
    type: (data?.type as NotificationData["type"]) || "system",
    action_url: data?.action_url,
    content_type: data?.content_type,
    content_id: data?.content_id,
    related_user_id: data?.related_user_id,
    priority: (data?.priority as NotificationData["priority"]) || "normal",
    ...data,
  };

  await supabase
    .from("notifications")
    .insert({
      recipient_id: publicUser.id,
      type: notificationData.type,
      title: notification.title || null,
      message: notification.body || "",
      action_url: notificationData.action_url,
      content_type: notificationData.content_type,
      content_id: notificationData.content_id,
      related_user_id: notificationData.related_user_id,
      priority: notificationData.priority,
      data: notificationData,
      status: "unread",
      is_read: false,
      is_push_sent: true,
      push_sent_at: new Date().toISOString(),
    });

  // Show browser notification if page is in background
  if (
    document.hidden && "Notification" in window &&
    Notification.permission === "granted"
  ) {
    const notif = new Notification(notification.title || "New Notification", {
      body: notification.body,
      icon: notification.icon || "/icons/icon-192x192.png",
      badge: "/icons/icon-72x72.png",
      tag: data?.id || "default",
      data: notificationData,
    });

    notif.onclick = () => {
      window.focus();
      if (notificationData.action_url) {
        window.location.href = notificationData.action_url;
      }
    };
  }
};

// Auto-initialize on import (client-side only)
if (typeof window !== "undefined") {
  initializeFirebase();
}
