import { supabase } from "@/lib/supabase";
import { toast } from "@/components/ui/use-toast";

// Types matching your existing schema
interface WolfpackNotification {
  id: string;
  recipient_id: string;
  type: string;
  message: string;
  link: string | null;
  status: "unread" | "read" | "dismissed";
  metadata: Record<string, unknown>;
  notification_type?: string;
  related_video_id?: string;
  related_user_id?: string;
  created_at: string;
  updated_at: string;
}

interface NotificationPayload {
  title: string;
  body: string;
  type: string;
  link?: string;
  data?: Record<string, unknown>;
  conversationid?: string;
  sendPush?: boolean;
  showToast?: boolean;
}

class UnifiedNotificationService {
  private fcmToken: string | null = null;
  private messaging: unknown = null;
  private isInitialized = false;

  /**
   * Initialize Firebase messaging
   */
  async initialize() {
    if (this.isInitialized) return;

    try {
      // Import Firebase dynamically (PWA-friendly)
      const { initializeApp, getApps } = await import("firebase/app");
      const { getMessaging, onMessage } = await import(
        "firebase/messaging"
      );

      // Initialize Firebase if not already done
      if (!getApps().length) {
        const firebaseConfig = {
          apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
          authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
          projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
          storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
          messagingSenderId:
            process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_conversation_id,
          appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
        };
        initializeApp(firebaseConfig);
      }

      // Get messaging instance
      this.messaging = getMessaging();

      // Only get FCM token if permission is already granted to avoid permission violations
      if (
        typeof window !== "undefined" && "Notification" in window &&
        Notification.permission === "granted"
      ) {
        this.getFCMToken().catch((error) => {
          console.log("FCM token not available:", error.message);
        });
      } else {
        console.log(
          "Notification permission not granted, skipping FCM token request",
        );
      }

      // Listen for foreground messages
      onMessage(this.messaging, (payload) => {
        console.log("Foreground message received:", payload);
        this.handleForegroundMessage(payload);
      });

      this.isInitialized = true;
    } catch (error) {
      console.error("Failed to initialize Firebase messaging:", error);
      // Mark as initialized anyway so app can continue
      this.isInitialized = true;
    }
  }

  /**
   * Register Firebase messaging service worker
   */
  private async registerFirebaseServiceWorker(): Promise<
    ServiceWorkerRegistration | null
  > {
    try {
      if (!("serviceWorker" in navigator)) {
        console.log("Service Worker not supported");
        return null;
      }

      // Check if Firebase messaging service worker is already registered
      const existingRegistration = await navigator.serviceWorker
        .getRegistration("/firebase-messaging-sw.js");
      if (existingRegistration && existingRegistration.active) {
        console.log("Firebase messaging service worker already registered");
        return existingRegistration;
      }

      // Register Firebase messaging service worker
      console.log("Registering Firebase messaging service worker...");
      const registration = await navigator.serviceWorker.register(
        "/firebase-messaging-sw.js",
        {
          scope: "/",
          updateViaCache: "none",
        },
      );

      // Wait for the service worker to be ready
      await navigator.serviceWorker.ready;
      console.log("Firebase messaging service worker registered successfully");

      return registration;
    } catch (error) {
      console.error("Failed to register Firebase service worker:", error);
      return null;
    }
  }

  /**
   * Get FCM token for push notifications
   */
  private async getFCMToken() {
    try {
      // Skip FCM token if service worker is not available
      if (!("serviceWorker" in navigator)) {
        console.log("Service Worker not supported, skipping FCM token");
        return null;
      }

      // Register Firebase service worker first
      const registration = await this.registerFirebaseServiceWorker();
      if (!registration) {
        console.log(
          "Failed to register Firebase service worker, skipping FCM token",
        );
        return null;
      }

      // Wait a bit for service worker to be fully active
      await new Promise((resolve) => setTimeout(resolve, 1000));

      const { getToken } = await import("firebase/messaging");

      // Check if permission is already granted
      if (Notification.permission === "granted") {
        console.log("Getting FCM token with VAPID key...");
        const token = await getToken(this.messaging, {
          vapidKey: process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY,
          serviceWorkerRegistration: registration,
        });

        if (token) {
          this.fcmToken = token;
          console.log("FCM token obtained successfully");

          // Store token on server
          await this.storeFCMToken(token);
          return token;
        } else {
          console.log("No FCM token received");
          return null;
        }
      } else {
        console.log(
          "Notification permission not granted, skipping FCM token request",
        );
        return null;
      }
    } catch (error) {
      console.error("Error getting FCM token:", error);

      // More specific error handling
      if (error instanceof Error) {
        if (error.name === "AbortError") {
          console.error(
            "FCM token request was aborted - service worker may not be active",
          );
        } else if (error.message.includes("service worker")) {
          console.error("Service worker issue:", error.message);
        } else if (error.message.includes("permission")) {
          console.error("Permission issue:", error.message);
        }
      }

      return null;
    }
  }

  /**
   * Request notification permission (must be called from user gesture)
   */
  async requestNotificationPermission() {
    try {
      const permission = await Notification.requestPermission();
      if (permission === "granted") {
        // Re-initialize to get the token
        await this.getFCMToken();
      }
      return permission;
    } catch (error) {
      console.error("Error requesting notification permission:", error);
      return "denied";
    }
  }

  /**
   * Store FCM token on server
   */
  private async storeFCMToken(token: string) {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        console.warn("No authenticated user found for FCM token storage");
        return;
      }

      // Get the user's profile to get their actual user ID
      const { data: profile, error: profileError } = await supabase
        .from("users")
        .select("id")
        .eq("auth_id", user.id)
        .single();

      if (profileError || !profile) {
        console.error(
          "Error fetching user profile for FCM token:",
          profileError,
        );
        // If user doesn't exist in users table yet, skip FCM token storage
        console.log(
          "User not found in users table, skipping FCM token storage",
        );
        return;
      }

      // Build device info object
      const deviceInfo = {
        userAgent: navigator.userAgent,
        platform: navigator.platform || "web",
        language: navigator.language,
        vendor: navigator.vendor,
        screen: {
          width: window.screen.width,
          height: window.screen.height,
        },
      };

      // Use the upsert function to store the token (handles duplicates automatically)
      const { error } = await supabase
        .rpc("upsert_fcm_token", {
          p_user_id: profile.id,
          p_token: token,
          p_device_info: deviceInfo,
          p_platform: "web",
        });

      if (error) {
        console.error("Error storing FCM token:", error);
        // Log more details for debugging
        console.error("FCM token storage details:", {
          conversationid: profile.id,
          tokenLength: token.length,
          error: error,
        });
      } else {
        console.log("FCM token stored successfully");
      }
    } catch (error) {
      console.error("Error in storeFCMToken:", error);
    }
  }

  /**
   * Handle foreground messages (show toast notifications)
   */
  private handleForegroundMessage(payload: Record<string, unknown>) {
    const title = payload.notification?.title || "Wolfpack Notification";
    const body = payload.notification?.body || "You have a new notification";

    // Show toast notification
    toast({
      title,
      description: body,
      duration: 5000,
    });

    // Play notification sound
    this.playNotificationSound();
  }

  /**
   * Play notification sound
   */
  private playNotificationSound() {
    try {
      const audio = new Audio("/sounds/notification.mp3");
      audio.volume = 0.5;
      audio.play().catch((e) =>
        console.log("Could not play notification sound:", e)
      );
    } catch (error) {
      console.log("Notification sound not available:", error);
    }
  }

  /**
   * Map notification types to database constraint values
   */
  private mapNotificationType(type: string): string {
    const typeMap: Record<string, string> = {
      "wolfpack_message": "info",
      "order_update": "order_ready",
      "dj_event": "info",
      "like": "info",
      "comment": "info",
      "follow": "info",
      "mention": "info",
    };

    // Return mapped type or default to 'info' if not found
    return typeMap[type] || "info";
  }

  /**
   * Create notification in database
   */
  async createNotification(recipientId: string, payload: NotificationPayload) {
    try {
      // Ensure message is provided
      if (!payload.body || payload.body.trim() === "") {
        console.error("Notification message cannot be empty");
        return null;
      }

      // Create notification in database
      const { data, error } = await supabase
        .from("wolfpack_activity_notifications")
        .insert({
          recipient_id: recipientId,
          message: payload.body.trim(),
          type: this.mapNotificationType(payload.type), // Use mapped type
          link: payload.link,
          status: "unread",
          metadata: payload.data || {},
          notification_type: payload.type, // Keep original type in notification_type
        })
        .select()
        .single();

      if (error) {
        console.error("Error creating notification:", error);
        return null;
      }

      // Send push notification if requested
      if (payload.sendPush !== false) {
        await this.sendPushNotification(recipientId, payload);
      }

      return data;
    } catch (error) {
      console.error("Error in createNotification:", error);
      return null;
    }
  }

  /**
   * Send push notification via Firebase
   */
  private async sendPushNotification(
    recipientId: string,
    payload: NotificationPayload,
  ) {
    try {
      const response = await fetch("/api/notifications/send", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          recipientId,
          title: payload.title,
          body: payload.body,
          type: payload.type,
          link: payload.link,
          data: payload.data,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to send push notification");
      }

      console.log("Push notification sent successfully");
    } catch (error) {
      console.error("Error sending push notification:", error);
    }
  }

  /**
   * Mark notification as read
   */
  async markAsRead(notificationId: string) {
    try {
      const { error } = await supabase.rpc("mark_notification_read", {
        p_notification_id: notificationId,
      });

      if (error) {
        console.error("Error marking notification as read:", error);
        return false;
      }

      return true;
    } catch (error) {
      console.error("Error in markAsRead:", error);
      return false;
    }
  }

  /**
   * Get notifications for current user
   */
  async getNotifications(limit = 50, offset = 0) {
    try {
      const { data, error } = await supabase.rpc("fetch_notifications", {
        p_user_id: null,
        p_limit: limit,
        p_offset: offset,
      });

      if (error) {
        console.error("Error fetching notifications:", error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error("Error in getNotifications:", error);
      return [];
    }
  }

  /**
   * Subscribe to real-time notifications
   */
  subscribeToNotifications(
    callback: (notification: WolfpackNotification) => void,
  ) {
    return supabase
      .channel("notifications")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "wolfpack_activity_notifications",
        },
        (payload) => {
          console.log("New notification received:", payload);
          callback(payload.new as WolfpackNotification);
        },
      )
      .subscribe();
  }

  /**
   * Send wolfpack message notification
   */
  async sendWolfpackMessageNotification(
    recipientId: string,
    senderName: string,
    message: string,
    chatLink?: string,
  ) {
    return this.createNotification(recipientId, {
      title: `${senderName} sent you a message`,
      body: message,
      type: "wolfpack_message",
      link: chatLink || "/wolfpack/chat",
      data: {
        senderName,
        messagePreview: message.substring(0, 50),
      },
    });
  }

  /**
   * Send order update notification
   */
  async sendOrderUpdateNotification(
    recipientId: string,
    orderStatus: string,
    orderNumber: string,
  ) {
    return this.createNotification(recipientId, {
      title: "Order Update",
      body: `Your order #${orderNumber} is ${orderStatus}`,
      type: "order_update",
      link: `/orders/${orderNumber}`,
      data: {
        orderNumber,
        status: orderStatus,
      },
    });
  }

  /**
   * Send DJ event notification
   */
  async sendDJEventNotification(
    recipientId: string,
    eventTitle: string,
    eventTime: string,
  ) {
    return this.createNotification(recipientId, {
      title: "DJ Event Starting",
      body: `${eventTitle} starts at ${eventTime}`,
      type: "dj_event",
      link: "/dj",
      data: {
        eventTitle,
        eventTime,
      },
    });
  }
}

// Export singleton instance
export const notificationService = new UnifiedNotificationService();
export default notificationService;
