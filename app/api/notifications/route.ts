import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import { z } from "zod";

// Schema matching your actual notifications table
const createNotificationSchema = z.object({
  recipient_id: z.string().uuid(),
  type: z.enum([
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
  ]).default("info"),
  message: z.string().min(1).max(5000),
  title: z.string().optional(),
  related_user_id: z.string().uuid().optional(),
  content_type: z.enum([
    "post",
    "comment",
    "user",
    "order",
    "message",
    "conversation",
    "event",
    "menu_item",
  ]).optional(),
  content_id: z.string().uuid().optional(),
  action_url: z.string().optional(),
  priority: z.enum(["low", "normal", "high", "urgent"]).default("normal"),
  expires_at: z.string().datetime().optional(),
  data: z.record(z.unknown()).optional(),
});

// Schema for bulk notifications
const createBulkNotificationsSchema = z.object({
  recipient_ids: z.array(z.string().uuid()).min(1).max(100),
  type: z.enum([
    "info",
    "warning",
    "error",
    "success",
    "system",
    "promotion",
  ]).default("info"),
  message: z.string().min(1).max(5000),
  title: z.string().optional(),
  action_url: z.string().optional(),
  priority: z.enum(["low", "normal", "high", "urgent"]).default("normal"),
  expires_at: z.string().datetime().optional(),
  data: z.record(z.unknown()).optional(),
});

export async function POST(request: NextRequest) {
  try {
    // Check admin authorization
    const supabase = await createServerClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 },
      );
    }

    // Check if user is admin
    const { data: profile, error: profileError } = await supabase
      .from("users")
      .select("role")
      .eq("auth_id", user.id)
      .single();

    if (profileError || !profile || profile.role !== "admin") {
      return NextResponse.json(
        { error: "Forbidden: Admin access required" },
        { status: 403 },
      );
    }

    // Parse request body
    const body = await request.json();

    // Check if it's a bulk notification
    if (body.recipient_ids && Array.isArray(body.recipient_ids)) {
      // Validate bulk notification data
      const validatedData = createBulkNotificationsSchema.parse(body);

      // Create bulk notifications
      const notifications = validatedData.recipient_ids.map((recipient_id) => ({
        recipient_id,
        type: validatedData.type,
        message: validatedData.message,
        title: validatedData.title || null,
        action_url: validatedData.action_url || null,
        priority: validatedData.priority,
        expires_at: validatedData.expires_at || null,
        data: validatedData.data || {},
        status: "unread",
        is_read: false,
        is_push_sent: false,
        created_at: new Date().toISOString(),
      }));

      const { data: insertedNotifications, error: insertError } = await supabase
        .from("notifications")
        .insert(notifications)
        .select();

      if (insertError) {
        console.error("Error creating bulk notifications:", insertError);
        return NextResponse.json(
          {
            error: "Failed to create notifications",
            details: insertError.message,
          },
          { status: 500 },
        );
      }

      // Optionally trigger push notifications for high priority items
      if (
        validatedData.priority === "high" || validatedData.priority === "urgent"
      ) {
        // You can implement push notification logic here
        // This would involve checking push_tokens table and sending via FCM/APNS
      }

      return NextResponse.json({
        success: true,
        count: insertedNotifications?.length || 0,
        notifications: insertedNotifications,
      });
    } else {
      // Validate single notification data
      const validatedData = createNotificationSchema.parse(body);

      // Create single notification
      const { data: notification, error: insertError } = await supabase
        .from("notifications")
        .insert({
          recipient_id: validatedData.recipient_id,
          type: validatedData.type,
          message: validatedData.message,
          title: validatedData.title || null,
          related_user_id: validatedData.related_user_id || null,
          content_type: validatedData.content_type || null,
          content_id: validatedData.content_id || null,
          action_url: validatedData.action_url || null,
          priority: validatedData.priority,
          expires_at: validatedData.expires_at || null,
          data: validatedData.data || {},
          status: "unread",
          is_read: false,
          is_push_sent: false,
          created_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (insertError) {
        console.error("Error creating notification:", insertError);
        return NextResponse.json(
          {
            error: "Failed to create notification",
            details: insertError.message,
          },
          { status: 500 },
        );
      }

      // Optionally trigger push notification for high priority
      if (
        (validatedData.priority === "high" ||
          validatedData.priority === "urgent") && notification
      ) {
        // Check if user has push tokens
        const { data: pushTokens } = await supabase
          .from("push_tokens")
          .select("token, platform")
          .eq("user_id", validatedData.recipient_id)
          .eq("is_active", true);

        if (pushTokens && pushTokens.length > 0) {
          // Here you would implement your push notification service
          console.log("Would send push notification to tokens:", pushTokens);

          // Update notification to mark push as sent
          await supabase
            .from("notifications")
            .update({
              is_push_sent: true,
              push_sent_at: new Date().toISOString(),
            })
            .eq("id", notification.id);
        }
      }

      return NextResponse.json({
        success: true,
        notification,
      });
    }
  } catch (error) {
    console.error("Error creating notification:", error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation error", details: error.errors },
        { status: 400 },
      );
    }

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

// GET endpoint to fetch notifications for current user
export async function GET(request: NextRequest) {
  try {
    const supabase = await createServerClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 },
      );
    }

    // Get user's database ID
    const { data: profile } = await supabase
      .from("users")
      .select("id")
      .eq("auth_id", user.id)
      .single();

    if (!profile) {
      return NextResponse.json(
        { error: "User profile not found" },
        { status: 404 },
      );
    }

    // Get query parameters
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status") || "unread";
    const limit = parseInt(searchParams.get("limit") || "20");
    const offset = parseInt(searchParams.get("offset") || "0");

    // Fetch notifications
    let query = supabase
      .from("notifications")
      .select(`
        *,
        related_user:users!notifications_related_user_fkey(
          id,
          display_name,
          username,
          profile_image_url
        )
      `)
      .eq("recipient_id", profile.id)
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);

    if (status !== "all") {
      query = query.eq("status", status);
    }

    const { data: notifications, error: fetchError } = await query;

    if (fetchError) {
      console.error("Error fetching notifications:", fetchError);
      return NextResponse.json(
        { error: "Failed to fetch notifications" },
        { status: 500 },
      );
    }

    return NextResponse.json({
      success: true,
      notifications: notifications || [],
      pagination: {
        limit,
        offset,
        hasMore: notifications?.length === limit,
      },
    });
  } catch (error) {
    console.error("Error fetching notifications:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

// PATCH endpoint to mark notifications as read
export async function PATCH(request: NextRequest) {
  try {
    const supabase = await createServerClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 },
      );
    }

    // Get user's database ID
    const { data: profile } = await supabase
      .from("users")
      .select("id")
      .eq("auth_id", user.id)
      .single();

    if (!profile) {
      return NextResponse.json(
        { error: "User profile not found" },
        { status: 404 },
      );
    }

    const body = await request.json();
    const { notification_ids, mark_all = false } = body;

    if (mark_all) {
      // Mark all unread notifications as read
      const { error: updateError } = await supabase
        .from("notifications")
        .update({
          status: "read",
          is_read: true,
          read_at: new Date().toISOString(),
        })
        .eq("recipient_id", profile.id)
        .eq("status", "unread");

      if (updateError) {
        console.error("Error marking all notifications as read:", updateError);
        return NextResponse.json(
          { error: "Failed to mark notifications as read" },
          { status: 500 },
        );
      }

      return NextResponse.json({
        success: true,
        message: "All notifications marked as read",
      });
    } else if (notification_ids && Array.isArray(notification_ids)) {
      // Mark specific notifications as read
      const { error: updateError } = await supabase
        .from("notifications")
        .update({
          status: "read",
          is_read: true,
          read_at: new Date().toISOString(),
        })
        .eq("recipient_id", profile.id)
        .in("id", notification_ids);

      if (updateError) {
        console.error("Error marking notifications as read:", updateError);
        return NextResponse.json(
          { error: "Failed to mark notifications as read" },
          { status: 500 },
        );
      }

      return NextResponse.json({
        success: true,
        message: `${notification_ids.length} notifications marked as read`,
      });
    } else {
      return NextResponse.json(
        { error: "Invalid request: provide notification_ids or mark_all flag" },
        { status: 400 },
      );
    }
  } catch (error) {
    console.error("Error updating notifications:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
