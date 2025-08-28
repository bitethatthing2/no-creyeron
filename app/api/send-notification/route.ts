import { NextRequest, NextResponse } from "next/server";
// import { createClient } from "@/lib/supabase";
// import {
//   getAdminMessaging,
//   initializeFirebaseAdmin,
//   isFirebaseAdminInitialized,
// } from "@/lib/firebase/admin";
// import { NOTIFICATION_TOPICS } from "@/types/features/firebase";
// import type {
//   BulkNotificationResult,
//   FcmResponse,
//   NotificationTopicKey,
// } from "@/types/features/firebase";
// import type { MulticastMessage, TopicMessage } from "firebase-admin/messaging";

// Notification service temporarily disabled during rebuild

/**
 * API route to send push notifications
 * Currently disabled during rebuild - notifications temporarily unavailable
 */
export async function POST(request: NextRequest) {
  return NextResponse.json(
    { 
      error: "Notification service temporarily disabled during rebuild",
      success: false
    },
    { status: 503 }
  );
}

/**
 * Handle GET requests - return service status
 */
export async function GET() {
  return NextResponse.json({
    error: "Notification service temporarily disabled during rebuild",
    status: "disabled",
    success: false
  });
}
