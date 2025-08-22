import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import { notificationService } from "@/lib/services/unified-notification.service";

export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerClient();

    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      console.log("Send message auth error:", authError);
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 },
      );
    }

    const body = await request.json();
    console.log(
      "🚀 NEW Send message request body:",
      body,
      "at",
      new Date().toISOString(),
    );

    const {
      conversationId,
      receiverId,
      recipientId,
      content,
      messageType = "text",
      mediaUrl,
      mediaType,
      mediaThumbnailUrl,
      attachments,
      mediaMetadata,
      replyToMessageId,
    } = body;

    console.log("Parsed values:", {
      conversationId,
      receiverId,
      recipientId,
      content,
      messageType,
    });

    // If conversationId is provided, use it directly
    if (conversationId && content) {
      // Get the current user's database record
      const { data: currentUserRecord, error: userError } = await supabase
        .from("users")
        .select("id")
        .eq("auth_id", user.id)
        .maybeSingle();

      if (userError || !currentUserRecord) {
        console.error("Current user not found:", userError);
        return NextResponse.json(
          { error: "Current user not found in database" },
          { status: 404 },
        );
      }

      // Insert the message directly
      const { data: message, error: messageError } = await supabase
        .from("chat_messages")
        .insert({
          conversation_id: conversationId,
          sender_id: currentUserRecord.id,
          content,
          message_type: messageType || "text",
          media_url: mediaUrl,
          media_type: mediaType,
          media_thumbnail_url: mediaThumbnailUrl,
          attachments: attachments || [],
          reply_to_id: replyToMessageId,
        })
        .select()
        .single();

      if (messageError) {
        console.error("Error sending message:", messageError);
        return NextResponse.json(
          { error: "Failed to send message", details: messageError.message },
          { status: 500 },
        );
      }

      return NextResponse.json({
        message,
        messageId: message.id,
      });
    }

    // Legacy support for receiverId/recipientId
    const finalRecipientId = receiverId || recipientId;

    if (!finalRecipientId || !content) {
      console.log("Missing required fields:", {
        conversationId: !!conversationId,
        finalRecipientId: !!finalRecipientId,
        content: !!content,
      });
      return NextResponse.json(
        {
          error:
            "Either conversationId or recipient ID and content are required",
        },
        { status: 400 },
      );
    }

    // Get current user's database record
    const { data: currentUserRecord, error: userError } = await supabase
      .from("users")
      .select("id")
      .eq("auth_id", user.id)
      .maybeSingle();

    if (userError || !currentUserRecord) {
      console.error("Current user not found:", userError);
      return NextResponse.json(
        { error: "Current user not found in database" },
        { status: 404 },
      );
    }

    // Use the safe helper function to get or create conversation
    const { data: conversationResult, error: conversationError } =
      await supabase
        .rpc("find_or_create_direct_conversation", {
          other_user_id: finalRecipientId,
        });

    if (conversationError) {
      console.error("Error with conversation function:", conversationError);
      return NextResponse.json(
        {
          error: "Failed to get conversation",
          details: conversationError.message,
        },
        { status: 500 },
      );
    }

    const foundConversationId = conversationResult;

    console.log("Final conversation ID:", foundConversationId);

    // Insert the message
    const { data: message, error: messageError } = await supabase
      .from("chat_messages")
      .insert({
        conversation_id: foundConversationId,
        sender_id: currentUserRecord.id,
        content,
        message_type: messageType || "text",
        media_url: mediaUrl,
        media_type: mediaType,
        media_thumbnail_url: mediaThumbnailUrl,
        attachments: attachments || [],
        reply_to_id: replyToMessageId,
      })
      .select()
      .single();

    if (messageError) {
      console.error("Error sending message:", messageError);
      return NextResponse.json(
        { error: "Failed to send message" },
        { status: 500 },
      );
    }

    // Send notification to recipient
    try {
      // Get sender's profile for notification
      const { data: senderProfile } = await supabase
        .from("users")
        .select("display_name, first_name, last_name, username")
        .eq("auth_id", user.id)
        .single();

      if (senderProfile) {
        const senderName = senderProfile.display_name ||
          `${senderProfile.first_name || ""} ${senderProfile.last_name || ""}`
            .trim() ||
          senderProfile.username || "Someone";

        await notificationService.sendWolfpackMessageNotification(
          finalRecipientId,
          senderName,
          content,
          `/messages/${user.id}`,
        );
      }
    } catch (notificationError) {
      console.error("Error sending notification:", notificationError);
      // Don't fail the message send if notification fails
    }

    return NextResponse.json({ message });
  } catch (error) {
    console.error("Error sending message:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
