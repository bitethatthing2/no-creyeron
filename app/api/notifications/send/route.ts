import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import admin from "firebase-admin";
import type { Message } from "firebase-admin/messaging";

// Initialize Firebase Admin if not already initialized
let firebaseInitialized = false;

if (!admin.apps.length) {
  // Check if Firebase credentials are available
  if (process.env.FIREBASE_CLIENT_EMAIL && process.env.FIREBASE_PRIVATE_KEY) {
    try {
      // Use existing Firebase project config
      admin.initializeApp({
        credential: admin.credential.cert({
          projectId: "sidehustle-22a6a",
          clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
          privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, "\n"),
        }),
      });
      firebaseInitialized = true;
      console.log("Firebase Admin initialized successfully");
    } catch (error) {
      console.error("Firebase admin initialization error:", error);
    }
  } else {
    console.warn(
      "Firebase credentials not configured - push notifications disabled",
    );
  }
} else {
  // Firebase already initialized
  firebaseInitialized = true;
}

// Valid notification types based on database constraint
const VALID_NOTIFICATION_TYPES = [
  "info",
  "warning",
  "error",
  "success",
  "order_new",
  "order_ready",
  "order_cancelled",
  "follow",
  "unfollow",
  "like",
  "comment",
  "mention",
  "share",
  "post_like",
  "post_comment",
  "message",
  "friend_request",
  "system",
  "promotion",
  "achievement",
] as const;

type NotificationType = typeof VALID_NOTIFICATION_TYPES[number];

// Valid priority levels
const VALID_PRIORITIES = ["low", "normal", "high", "urgent"] as const;
type PriorityLevel = typeof VALID_PRIORITIES[number];

export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const {
      recipientId,
      title,
      body: messageBody,
      type = "info" as NotificationType,
      link,
      data,
      priority = "normal" as PriorityLevel,
      contentType,
      contentId,
    } = body;

    if (!recipientId || !title || !messageBody) {
      return NextResponse.json({
        error: "Missing required fields",
        details: "recipientId, title, and body are required",
      }, { status: 400 });
    }

    // Validate notification type
    if (!VALID_NOTIFICATION_TYPES.includes(type as NotificationType)) {
      return NextResponse.json({
        error: "Invalid notification type",
        validTypes: VALID_NOTIFICATION_TYPES,
      }, { status: 400 });
    }

    // Validate priority
    if (!VALID_PRIORITIES.includes(priority as PriorityLevel)) {
      return NextResponse.json({
        error: "Invalid priority level",
        validPriorities: VALID_PRIORITIES,
      }, { status: 400 });
    }

    // Get sender's user record
    const { data: senderRecord, error: senderError } = await supabase
      .from("users")
      .select("id, username, display_name")
      .eq("auth_id", user.id)
      .single();

    if (senderError) {
      console.error("Error fetching sender record:", senderError);
    }

    // Get recipient's user record
    // recipientId could be either a user.id (UUID) or auth_id
    let recipientRecord;

    // First try as user.id
    const { data: userByIdRecord } = await supabase
      .from("users")
      .select("id, auth_id, email_notifications, push_notifications")
      .eq("id", recipientId)
      .single();

    if (userByIdRecord) {
      recipientRecord = userByIdRecord;
    } else {
      // Try as auth_id
      const { data: userByAuthIdRecord } = await supabase
        .from("users")
        .select("id, auth_id, email_notifications, push_notifications")
        .eq("auth_id", recipientId)
        .single();

      if (userByAuthIdRecord) {
        recipientRecord = userByAuthIdRecord;
      } else {
        return NextResponse.json({
          error: "Recipient user not found",
        }, { status: 404 });
      }
    }

    // Check if recipient has push notifications enabled
    if (recipientRecord.push_notifications === false) {
      return NextResponse.json({
        message: "User has disabled push notifications",
        notificationSaved: false,
      }, { status: 200 });
    }

    // Create notification record in database
    const { data: notificationRecord, error: notificationError } =
      await supabase
        .from("notifications")
        .insert({
          recipient_id: recipientRecord.id,
          type,
          title,
          message: messageBody,
          status: "unread",
          priority,
          content_type: contentType,
          content_id: contentId,
          related_user_id: senderRecord?.id,
          data: {
            ...data,
            sender_name: senderRecord?.display_name || senderRecord?.username,
            link,
          },
          action_url: link,
        })
        .select()
        .single();

    if (notificationError) {
      console.error("Error creating notification record:", notificationError);
      return NextResponse.json({
        error: "Failed to create notification",
        details: notificationError.message,
      }, { status: 500 });
    }

    // Get recipient's FCM tokens from push_tokens table
    const { data: tokens, error: tokensError } = await supabase
      .from("push_tokens")
      .select("token, platform, device_info")
      .eq("user_id", recipientRecord.id)
      .eq("is_active", true);

    if (tokensError) {
      console.error("Error fetching push tokens:", tokensError);
    }

    console.log(
      "Found push tokens for user:",
      recipientRecord.id,
      "count:",
      tokens?.length || 0,
    );

    if (!tokens || tokens.length === 0) {
      // Notification saved but no push tokens
      return NextResponse.json({
        success: true,
        message: "Notification saved but no push tokens found",
        notificationId: notificationRecord.id,
        pushSent: false,
      }, { status: 200 });
    }

    // Check if Firebase is initialized
    if (!firebaseInitialized || !admin.apps.length) {
      console.warn(
        "Firebase not initialized - notification saved but push not sent",
      );
      return NextResponse.json({
        success: true,
        message: "Notification saved but push service not configured",
        notificationId: notificationRecord.id,
        pushSent: false,
      }, { status: 200 });
    }

    // Determine icon based on notification type
    const getNotificationIcon = (): string => {
      if (type.startsWith("order_")) return "/icons/order-icon.png";
      if (["follow", "unfollow"].includes(type)) return "/icons/user-icon.png";
      if (["like", "post_like"].includes(type)) return "/icons/heart-icon.png";
      if (["comment", "post_comment"].includes(type)) {
        return "/icons/comment-icon.png";
      }
      if (type === "message") return "/icons/message-icon.png";
      return "/icons/wolf-icon.png"; // Default icon
    };

    // Determine Android priority based on our priority level
    const getAndroidPriority = (): "high" | "default" => {
      return (priority === "urgent" || priority === "high")
        ? "high"
        : "default";
    };

    // Send notification to all user's devices
    const notifications = tokens.map(async (tokenRecord) => {
      try {
        // Build the message object with proper typing
        const message: Message = {
          token: tokenRecord.token,
          notification: {
            title: title,
            body: messageBody,
          },
          data: {
            type: type,
            notificationId: notificationRecord.id,
            link: link || "/notifications",
            priority: priority,
            ...(data
              ? Object.entries(data).reduce((acc, [key, value]) => {
                acc[key] = String(value);
                return acc;
              }, {} as Record<string, string>)
              : {}),
          },
          webpush: {
            fcmOptions: {
              link: link || "/notifications",
            },
            notification: {
              title: title,
              body: messageBody,
              icon: getNotificationIcon(),
              badge: "/icons/badge-72x72.png",
              tag: `notification-${notificationRecord.id}`,
              requireInteraction: priority === "urgent" || priority === "high",
              silent: priority === "low",
              vibrate: priority === "urgent"
                ? [500, 250, 500]
                : [200, 100, 200],
              actions: [
                {
                  action: "open",
                  title: "Open",
                  icon: "/icons/action-open.png",
                },
                {
                  action: "dismiss",
                  title: "Dismiss",
                  icon: "/icons/action-dismiss.png",
                },
              ],
            },
          },
          android: {
            notification: {
              priority: getAndroidPriority(),
              channelId: type.includes("message") ? "messages" : "default",
            },
          },
          apns: {
            payload: {
              aps: {
                sound: priority === "urgent" ? "critical" : "default",
                badge: 1,
              },
            },
          },
        };

        await admin.messaging().send(message);
        return { success: true, token: tokenRecord.token };
      } catch (error: unknown) {
        console.error("Error sending to token:", tokenRecord.token, error);

        // If token is invalid, mark it as inactive
        if (
          typeof error === "object" &&
            error !== null &&
            "code" in error &&
            (error as { code: string }).code ===
              "messaging/invalid-registration-token" ||
          (error as { code: string }).code ===
            "messaging/registration-token-not-registered"
        ) {
          await supabase
            .from("push_tokens")
            .update({ is_active: false })
            .eq("token", tokenRecord.token);
        }

        return {
          success: false,
          error:
            typeof error === "object" && error !== null && "message" in error
              ? (error as { message: string }).message
              : String(error),
        };
      }
    });

    const results = await Promise.all(notifications);
    const successful = results.filter((result) => result.success).length;

    // Update notification record with push status
    const { error: updateError } = await supabase
      .from("notifications")
      .update({
        is_push_sent: successful > 0,
        push_sent_at: successful > 0 ? new Date().toISOString() : null,
      })
      .eq("id", notificationRecord.id);

    if (updateError) {
      console.error("Error updating notification push status:", updateError);
    }

    return NextResponse.json({
      success: true,
      notificationId: notificationRecord.id,
      pushSent: successful > 0,
      sentTo: successful,
      total: tokens.length,
      failed: tokens.length - successful,
    });
  } catch (error) {
    console.error("Unexpected error in notification API:", error);
    return NextResponse.json({
      error: "Internal server error",
      details: error instanceof Error ? error.message : "Unknown error",
    }, { status: 500 });
  }
}
