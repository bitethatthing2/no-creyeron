import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import { initializeFirebaseAdmin, getAdminMessaging } from "@/lib/firebase/admin";
import { z } from "zod";

// Schema for notification payload
const notificationSchema = z.object({
  // Target users
  recipient_ids: z.array(z.string().uuid()).optional(),
  topic: z.string().optional(),
  
  // Notification content
  title: z.string().min(1).max(100),
  body: z.string().min(1).max(500),
  
  // App-specific data
  type: z.enum([
    "message", "post_like", "post_comment", "follow", "system"
  ]).default("system"),
  action_url: z.string().optional(),
  image_url: z.string().optional(),
  
  // FCM options
  priority: z.enum(["low", "normal", "high", "urgent"]).default("normal"),
  silent: z.boolean().default(false)
}).refine(data => data.recipient_ids || data.topic, {
  message: "Either recipient_ids or topic must be provided"
});

export async function POST(request: NextRequest) {
  try {
    // Parse and validate request body
    const body = await request.json();
    const validatedData = notificationSchema.parse(body);
    
    // Initialize Firebase Admin
    const app = initializeFirebaseAdmin();
    if (!app) {
      return NextResponse.json(
        { error: "Firebase Admin not initialized", success: false },
        { status: 503 }
      );
    }
    
    const messaging = getAdminMessaging();
    if (!messaging) {
      return NextResponse.json(
        { error: "Messaging service unavailable", success: false },
        { status: 503 }
      );
    }

    // Create the message payload
    const messagePayload = {
      notification: {
        title: validatedData.title,
        body: validatedData.body,
        ...(validatedData.image_url && { imageUrl: validatedData.image_url })
      },
      data: {
        type: validatedData.type,
        action_url: validatedData.action_url || '/notifications',
        timestamp: Date.now().toString()
      },
      android: {
        notification: {
          icon: '/icons/android-big-icon.png',
          color: '#FF6B35',
          channelId: validatedData.type,
          priority: validatedData.priority === 'urgent' ? 'high' : 'default',
          sound: validatedData.silent ? undefined : 'default'
        }
      },
      apns: {
        payload: {
          aps: {
            sound: validatedData.silent ? undefined : 'default',
            badge: 1,
            category: validatedData.type
          }
        },
        fcmOptions: {
          imageUrl: validatedData.image_url
        }
      },
      webpush: {
        notification: {
          icon: '/icons/wolf-icon.png',
          badge: '/icons/badge-72x72.png',
          image: validatedData.image_url,
          requireInteraction: validatedData.priority === 'urgent',
          vibrate: validatedData.priority === 'urgent' ? [500, 250, 500] : [200, 100, 200]
        },
        fcmOptions: {
          link: validatedData.action_url || '/notifications'
        }
      }
    };

    let result;

    if (validatedData.topic) {
      // Send to topic
      result = await messaging.sendToTopic(validatedData.topic, messagePayload);
    } else if (validatedData.recipient_ids) {
      // Get FCM tokens for recipient users
      const supabase = createServerClient();
      const { data: tokens, error: tokenError } = await supabase
        .from('fcm_tokens')
        .select('token')
        .in('user_id', validatedData.recipient_ids)
        .eq('is_active', true);

      if (tokenError || !tokens?.length) {
        return NextResponse.json(
          { error: "No active FCM tokens found for recipients", success: false },
          { status: 400 }
        );
      }

      // Send multicast message
      const fcmTokens = tokens.map(t => t.token);
      result = await messaging.sendMulticast({
        tokens: fcmTokens,
        ...messagePayload
      });

      // Clean up invalid tokens
      if (result.failureCount > 0) {
        const invalidTokens: string[] = [];
        result.responses.forEach((response, index) => {
          if (!response.success) {
            invalidTokens.push(fcmTokens[index]);
          }
        });

        if (invalidTokens.length > 0) {
          await supabase
            .from('fcm_tokens')
            .update({ is_active: false })
            .in('token', invalidTokens);
        }
      }
    }

    // Store notification in database for recipients
    if (validatedData.recipient_ids) {
      const supabase = createServerClient();
      const notifications = validatedData.recipient_ids.map(recipientId => ({
        recipient_id: recipientId,
        type: validatedData.type,
        title: validatedData.title,
        message: validatedData.body,
        action_url: validatedData.action_url,
        priority: validatedData.priority,
        data: { image_url: validatedData.image_url }
      }));

      await supabase.from('notifications').insert(notifications);
    }

    return NextResponse.json({
      success: true,
      message: "Notification sent successfully",
      result: validatedData.topic ? { messageId: result } : {
        successCount: result.successCount,
        failureCount: result.failureCount
      }
    });

  } catch (error) {
    console.error("Send notification error:", error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid request data", details: error.errors, success: false },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: "Failed to send notification", success: false },
      { status: 500 }
    );
  }
}

// Health check endpoint
export async function GET() {
  try {
    const app = initializeFirebaseAdmin();
    const messaging = getAdminMessaging();
    
    return NextResponse.json({
      status: "active",
      firebase_admin_initialized: !!app,
      messaging_available: !!messaging,
      success: true
    });
  } catch (error) {
    return NextResponse.json(
      { status: "error", error: "Service initialization failed", success: false },
      { status: 503 }
    );
  }
}