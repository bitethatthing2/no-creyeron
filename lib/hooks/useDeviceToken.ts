"use client";

import * as React from "react";
import { getMessaging, getToken, onMessage } from "firebase/messaging";
import { supabase } from "@/lib/supabase";
import type {
  DeviceInfo,
  DeviceToken,
  FCMTokenData,
} from "@/types/global/notifications";

/**
 * Detect device information for token registration
 */
function getDeviceInfo(): DeviceInfo {
  if (typeof window === "undefined") {
    return { type: "web", name: "Server" };
  }

  const ua = navigator.userAgent;
  const isStandalone =
    window.matchMedia("(display-mode: standalone)").matches ||
    (window.navigator as { standalone?: boolean }).standalone === true;

  if (/iPad|iPhone|iPod/.test(ua)) {
    return {
      type: "ios",
      name: `iOS ${
        /OS (\d+_\d+)/.exec(ua)?.[1]?.replace("_", ".") || "Unknown"
      }`,
      version: process.env.NEXT_PUBLIC_APP_VERSION,
      isStandalone,
    };
  }

  if (/Android/.test(ua)) {
    return {
      type: "android",
      name: `Android ${/Android (\d+\.\d+)/.exec(ua)?.[1] || "Unknown"}`,
      version: process.env.NEXT_PUBLIC_APP_VERSION,
      isStandalone,
    };
  }

  return {
    type: "web",
    name: `${navigator.platform} - ${
      /Chrome|Firefox|Safari|Edge|Opera/.exec(ua)?.[0] || "Browser"
    }`,
    version: process.env.NEXT_PUBLIC_APP_VERSION,
    isStandalone,
  };
}

export function useDeviceToken(authUserId?: string) {
  const [fcmToken, setFcmToken] = React.useState<string | null>(null);
  const [deviceToken, setDeviceToken] = React.useState<DeviceToken | null>(
    null,
  );
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [permission, setPermission] = React.useState<NotificationPermission>(
    "default",
  );
  const [dbUserId, setDbUserId] = React.useState<string | null>(null);

  // Removed mapAuthIdToUserId - we'll use auth ID directly for FCM tokens

  /**
   * Request notification permission and get FCM token
   */
  const requestPermissionAndToken = React.useCallback(
    async (): Promise<string | null> => {
      if (typeof window === "undefined") return null;

      try {
        // Check if notifications are supported
        if (!("Notification" in window)) {
          throw new Error("This browser does not support notifications");
        }

        // Request permission
        const permission = await Notification.requestPermission();
        setPermission(permission);

        if (permission !== "granted") {
          throw new Error("Notification permission denied");
        }

        // Initialize Firebase messaging
        const messaging = getMessaging();
        const vapidKey = process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY;

        if (!vapidKey) {
          throw new Error("VAPID key not configured");
        }

        // Get FCM token
        const token = await getToken(messaging, { vapidKey });

        if (!token) {
          throw new Error("No registration token available");
        }

        return token;
      } catch (err) {
        const errorMessage = err instanceof Error
          ? err.message
          : "Failed to get FCM token";
        setError(errorMessage);
        console.error("Error getting FCM token:", err);
        return null;
      }
    },
    [],
  );

  /**
   * Save device token to database
   */
  const saveDeviceToken = React.useCallback(
    async (
      tokenData: FCMTokenData,
      userId: string,
    ): Promise<DeviceToken | null> => {
      try {
        if (!userId) {
          throw new Error("User ID is required");
        }

        const deviceInfo = getDeviceInfo();

        // Check if token already exists
        const { data: existingToken } = await supabase
          .from("user_fcm_tokens")
          .select("*")
          .eq("token", tokenData.token)
          .single();

        if (existingToken) {
          // Update existing token
          const { data: updatedToken, error: updateError } = await supabase
            .from("user_fcm_tokens")
            .update({
              user_id: userId,
              platform: deviceInfo.type,
              device_info: JSON.stringify({
                type: deviceInfo.type,
                name: deviceInfo.name,
                version: deviceInfo.version ||
                  process.env.NEXT_PUBLIC_APP_VERSION,
                isStandalone: deviceInfo.isStandalone,
                browser: typeof window !== "undefined"
                  ? navigator.userAgent
                  : "unknown",
                platform: typeof window !== "undefined"
                  ? navigator.platform
                  : "unknown",
              }),
              is_active: true,
              updated_at: new Date().toISOString(),
            })
            .eq("token", tokenData.token)
            .select()
            .single();

          if (updateError) {
            throw new Error(updateError.message);
          }

          console.log("FCM token updated successfully");
          return updatedToken;
        } else {
          // Insert new token
          const { data: newToken, error: insertError } = await supabase
            .from("user_fcm_tokens")
            .insert({
              user_id: userId,
              token: tokenData.token,
              platform: deviceInfo.type,
              device_info: JSON.stringify({
                type: deviceInfo.type,
                name: deviceInfo.name,
                version: deviceInfo.version ||
                  process.env.NEXT_PUBLIC_APP_VERSION,
                isStandalone: deviceInfo.isStandalone,
                browser: typeof window !== "undefined"
                  ? navigator.userAgent
                  : "unknown",
                platform: typeof window !== "undefined"
                  ? navigator.platform
                  : "unknown",
              }),
              is_active: true,
            })
            .select()
            .single();

          if (insertError) {
            throw new Error(insertError.message);
          }

          console.log("FCM token saved successfully");
          return newToken;
        }
      } catch (err) {
        const errorMessage = err instanceof Error
          ? err.message
          : "Failed to save device token";
        setError(errorMessage);
        console.error("Error saving device token:", err);
        return null;
      }
    },
    [],
  );

  /**
   * Load existing device token for user
   */
  const loadDeviceToken = React.useCallback(
    async (userId: string): Promise<DeviceToken | null> => {
      try {
        const { data, error } = await supabase
          .from("user_fcm_tokens")
          .select("*")
          .eq("user_id", userId)
          .eq("is_active", true)
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle();

        if (error) {
          throw new Error(error.message);
        }

        return data as DeviceToken | null;
      } catch (err) {
        const errorMessage = err instanceof Error
          ? err.message
          : "Failed to load device token";
        setError(errorMessage);
        console.error("Error loading device token:", err);
        return null;
      }
    },
    [],
  );

  /**
   * Initialize FCM token management
   */
  const initializeToken = React.useCallback(async (authId: string) => {
    setLoading(true);
    setError(null);

    try {
      // Check current permission status first
      if (typeof window !== "undefined" && "Notification" in window) {
        setPermission(Notification.permission);
      }

      // Use auth ID directly for FCM tokens
      const userId = authId;
      setDbUserId(userId);
      const finalUserId = userId;

      // First, load existing token from database
      const existingToken = await loadDeviceToken(finalUserId);

      if (existingToken) {
        setDeviceToken(existingToken);
        setFcmToken(existingToken.token);

        // Update last used timestamp
        if (existingToken.id) {
          await supabase
            .from("user_fcm_tokens")
            .update({
              last_used_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            })
            .eq("id", existingToken.id);
        }
      } else if (Notification.permission === "granted") {
        // If permission is granted but no token exists, try to get token without requesting permission
        console.log(
          "Permission granted but no token found, attempting to get token...",
        );
        try {
          // Skip permission request since it's already granted
          if (typeof window !== "undefined" && "Notification" in window) {
            // Initialize Firebase messaging
            const messaging = getMessaging();
            const vapidKey = process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY;

            if (vapidKey) {
              // Get FCM token directly
              const token = await getToken(messaging, { vapidKey });
              if (token) {
                const tokenData: FCMTokenData = {
                  token,
                  deviceType: getDeviceInfo().type,
                  deviceName: getDeviceInfo().name,
                  appVersion: process.env.NEXT_PUBLIC_APP_VERSION,
                };
                const savedToken = await saveDeviceToken(
                  tokenData,
                  finalUserId,
                );
                if (savedToken) {
                  setDeviceToken(savedToken);
                  setFcmToken(token);
                }
              }
            }
          }
        } catch (tokenError) {
          console.error("Error auto-registering token:", tokenError);
        }
      }
    } catch (err) {
      const errorMessage = err instanceof Error
        ? err.message
        : "Failed to initialize token";
      setError(errorMessage);
      console.error("Error initializing token:", err);
    } finally {
      setLoading(false);
    }
  }, [loadDeviceToken, saveDeviceToken]);

  /**
   * Register new FCM token
   */
  const registerToken = React.useCallback(
    async (): Promise<boolean> => {
      try {
        if (!dbUserId) {
          throw new Error("No database user ID available");
        }

        const token = await requestPermissionAndToken();

        if (!token) {
          return false;
        }

        const tokenData: FCMTokenData = {
          token,
          deviceType: getDeviceInfo().type,
          deviceName: getDeviceInfo().name,
          appVersion: process.env.NEXT_PUBLIC_APP_VERSION,
        };

        const savedToken = await saveDeviceToken(tokenData, dbUserId);

        if (savedToken) {
          setDeviceToken(savedToken);
          setFcmToken(token);
          return true;
        }

        return false;
      } catch (err) {
        const errorMessage = err instanceof Error
          ? err.message
          : "Failed to register token";
        setError(errorMessage);
        console.error("Error registering token:", err);
        return false;
      }
    },
    [requestPermissionAndToken, saveDeviceToken, dbUserId],
  );

  /**
   * Deactivate current device token
   */
  const deactivateToken = React.useCallback(async (): Promise<boolean> => {
    if (!deviceToken) return false;

    try {
      if (!deviceToken.id) {
        throw new Error("Device token ID is missing");
      }

      const { error } = await supabase
        .from("user_fcm_tokens")
        .update({
          is_active: false,
          updated_at: new Date().toISOString(),
        })
        .eq("id", deviceToken.id);

      if (error) {
        throw new Error(error.message);
      }

      setDeviceToken(null);
      setFcmToken(null);
      return true;
    } catch (err) {
      const errorMessage = err instanceof Error
        ? err.message
        : "Failed to deactivate token";
      setError(errorMessage);
      console.error("Error deactivating token:", err);
      return false;
    }
  }, [deviceToken]);

  // Initialize token when authUserId is available
  React.useEffect(() => {
    if (authUserId) {
      initializeToken(authUserId);
    } else {
      setLoading(false);
    }
  }, [authUserId, initializeToken]);

  // Set up FCM message listener
  React.useEffect(() => {
    if (typeof window === "undefined" || !fcmToken) return;

    try {
      const messaging = getMessaging();

      const unsubscribe = onMessage(messaging, (payload) => {
        console.log("Foreground message received:", payload);

        // Handle foreground notifications
        if (payload.notification) {
          const { title, body } = payload.notification;

          // Show browser notification if permission is granted
          if (Notification.permission === "granted") {
            new Notification(title || "Side Hustle Bar", {
              body: body || "",
              icon: "/icons/icon-192x192.png",
              badge: "/icons/icon-72x72.png",
              data: payload.data,
            });
          }
        }
      });

      return unsubscribe;
    } catch (err) {
      console.error("Error setting up message listener:", err);
    }
  }, [fcmToken]);

  return {
    fcmToken,
    deviceToken,
    loading,
    error,
    permission,
    registerToken: dbUserId ? registerToken : null,
    deactivateToken,
    refresh: authUserId ? () => initializeToken(authUserId) : null,
    isSupported: typeof window !== "undefined" && "Notification" in window,
    deviceInfo: getDeviceInfo(),
  };
}
