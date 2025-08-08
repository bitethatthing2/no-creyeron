import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from '@/lib/supabase/server';
import { z } from "zod";
import { createNotification, createBulkNotifications } from "@/lib/actions/notification-actions";

// Schema for single notification
const createNotificationSchema = z.object({
  userId: z.string().uuid(),
  type: z.enum(["info", "warning", "error"]).default("info"),
  body: z.string().min(1).max(5000),
  link: z.string().url().optional(),
  expiresAt: z.string().datetime().optional().transform(val => val ? new Date(val) : undefined),
});

// Schema for bulk notifications
const createBulkNotificationsSchema = z.object({
  userIds: z.array(z.string().uuid()).min(1),
  type: z.enum(["info", "warning", "error"]).default("info"),
  body: z.string().min(1).max(5000),
  link: z.string().url().optional(),
  expiresAt: z.string().datetime().optional().transform(val => val ? new Date(val) : undefined),
});

export async function POST(request: NextRequest) {
  try {
    // Check admin authorization
    const supabase = await createServerClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
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
        { status: 403 }
      );
    }
    
    // Parse request body
    const body = await request.json();
    
    // Check if it's a bulk notification
    if (body.userIds && Array.isArray(body.userIds)) {
      // Validate bulk notification data
      const validatedData = createBulkNotificationsSchema.parse(body);
      
      // Create bulk notifications
      const result = await createBulkNotifications(
        validatedData.userIds,
        {
          type: validatedData.type,
          body: validatedData.body,
          link: validatedData.link,
          expiresAt: validatedData.expiresAt,
        }
      );
      
      if (!result.success) {
        return NextResponse.json(
          { error: result.error },
          { status: 500 }
        );
      }
      
      return NextResponse.json({
        success: true,
        count: result.count,
      });
    } else {
      // Validate single notification data
      const validatedData = createNotificationSchema.parse(body);
      
      // Create notification
      const result = await createNotification({
        userId: validatedData.userId,
        type: validatedData.type,
        body: validatedData.body,
        link: validatedData.link,
        expiresAt: validatedData.expiresAt,
      });
      
      if (!result.success) {
        return NextResponse.json(
          { error: result.error },
          { status: 500 }
        );
      }
      
      return NextResponse.json({
        success: true,
        notification: result.notification,
      });
    }
  } catch (error) {
    console.error("Error creating notification:", error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation error", details: error.errors },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}