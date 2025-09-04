import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";

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
      "Send message request:",
      {
        ...body,
        content: body.content?.substring(0, 50) + "...", // Log truncated content for privacy
      },
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
      mediaSize,
      mediaDuration,
      attachments,
      mediaMetadata,
      replyToMessageId,
      metadata,
    } = body;

    // Validate message type against database constraint
    const validMessageTypes = ["text", "image", "system", "deleted"];
    if (messageType && !validMessageTypes.includes(messageType)) {
      return NextResponse.json(
        {
          error: `Invalid message type. Must be one of: ${
            validMessageTypes.join(", ")
          }`,
        },
        { status: 400 },
      );
    }

    // Validate media type if provided
    const validMediaTypes = ["image", "video", "audio", "file", "gif"];
    if (mediaType && !validMediaTypes.includes(mediaType)) {
      return NextResponse.json(
        {
          error: `Invalid media type. Must be one of: ${
            validMediaTypes.join(", ")
          }`,
        },
        { status: 400 },
      );
    }

    // Get the current user's database record
    const { data: currentUserRecord, error: userError } = await supabase
      .from("users")
      .select("id, username, display_name")
      .eq("auth_id", user.id)
      .maybeSingle();

    if (userError || !currentUserRecord) {
      console.error("Current user not found:", userError);
      return NextResponse.json(
        { error: "Current user not found in database" },
        { status: 404 },
      );
    }

    let finalConversationId = conversationId;

    // If conversationId is not provided, create or find a direct conversation
    if (!conversationId) {
      const finalRecipientId = receiverId || recipientId;

      if (!finalRecipientId) {
        return NextResponse.json(
          { error: "Either conversationId or recipientId is required" },
          { status: 400 },
        );
      }

      // Import the messaging helpers
      const { messagingHelpers } = await import("@/lib/utils/messaging-helpers");
      
      // Use the helper function to get or create conversation
      const conversationId = await messagingHelpers.createOrGetDirectConversation(
        user.id,
        finalRecipientId
      );

      if (!conversationId) {
        console.error("Failed to create or get conversation");
        return NextResponse.json(
          {
            error: "Failed to get or create conversation",
          },
          { status: 500 },
        );
      }

      finalConversationId = conversationId;
    }

    // Validate that user is a participant in the conversation
    const { data: participantCheck } = await supabase
      .from("chat_participants")
      .select("user_id")
      .eq("conversation_id", finalConversationId)
      .eq("user_id", currentUserRecord.id)
      .maybeSingle();

    if (!participantCheck) {
      // User is not a participant, check if they can join
      const { data: conversationData } = await supabase
        .from("chat_conversations")
        .select("conversation_type, is_active")
        .eq("id", finalConversationId)
        .single();

      if (!conversationData || conversationData.is_active === false) {
        return NextResponse.json(
          { error: "Cannot send message to inactive conversation" },
          { status: 403 },
        );
      }

      // Add user as participant if allowed
      const { error: joinError } = await supabase
        .from("chat_participants")
        .insert({
          conversation_id: finalConversationId,
          user_id: currentUserRecord.id,
          role: "member",
        });

      if (joinError) {
        console.error("Error joining conversation:", joinError);
        return NextResponse.json(
          { error: "Cannot join this conversation" },
          { status: 403 },
        );
      }
    }

    // Validate content
    if (!content || content.trim().length === 0) {
      if (!mediaUrl && (!attachments || attachments.length === 0)) {
        return NextResponse.json(
          { error: "Message must have content, media, or attachments" },
          { status: 400 },
        );
      }
    }

    // Prepare message data
    interface MessageData {
      conversation_id: string;
      sender_id: string;
      content: string;
      message_type: string;
      metadata: Record<string, unknown>;
      media_url?: string;
      media_type?: string;
      media_thumbnail_url?: string;
      media_size?: number;
      media_duration?: number;
      media_metadata?: Record<string, unknown>;
      attachments?: unknown[];
      reply_to_id?: string;
    }

    const messageData: MessageData = {
      conversation_id: finalConversationId,
      sender_id: currentUserRecord.id,
      content: content || "",
      message_type: messageType,
      metadata: metadata || {},
    };

    // Add media fields if provided
    if (mediaUrl) {
      messageData.media_url = mediaUrl;
      messageData.media_type = mediaType;
      messageData.media_thumbnail_url = mediaThumbnailUrl;
      messageData.media_size = mediaSize;
      messageData.media_duration = mediaDuration;
      messageData.media_metadata = mediaMetadata || {};
    }

    // Add attachments if provided
    if (attachments && attachments.length > 0) {
      messageData.attachments = attachments;
    }

    // Add reply reference if provided
    if (replyToMessageId) {
      // Verify the reply-to message exists in the same conversation
      const { data: replyToMessage } = await supabase
        .from("chat_messages")
        .select("id")
        .eq("id", replyToMessageId)
        .eq("conversation_id", finalConversationId)
        .single();

      if (replyToMessage) {
        messageData.reply_to_id = replyToMessageId;
        messageData.metadata = {
          ...messageData.metadata,
          reply_to: replyToMessageId,
        };
      }
    }

    // Insert the message using RPC function for better error handling
    const { data: message, error: messageError } = await supabase
      .rpc("send_message_safe", {
        p_conversation_id: finalConversationId,
        p_content: content || "",
        p_message_type: messageType,
        p_media_url: mediaUrl,
        p_media_type: mediaType,
        p_reply_to_id: replyToMessageId,
      });

    if (messageError) {
      console.error("Error sending message:", messageError);

      // Fallback to direct insert if RPC fails
      const { data: directMessage, error: directError } = await supabase
        .from("chat_messages")
        .insert(messageData)
        .select()
        .single();

      if (directError) {
        return NextResponse.json(
          { error: "Failed to send message", details: directError.message },
          { status: 500 },
        );
      }

      // Update conversation's last message info
      await supabase
        .from("chat_conversations")
        .update({
          last_message_at: new Date().toISOString(),
          last_message_preview: content?.substring(0, 100) || "[Media]",
          last_message_sender_id: currentUserRecord.id,
          message_count: supabase.rpc("increment", { x: 1 }),
        })
        .eq("id", finalConversationId);

      return NextResponse.json({
        message: directMessage,
        messageId: directMessage.id,
        conversationId: finalConversationId,
      });
    }

    // Send push notification to recipients
    try {
      // Get all other participants
      const { data: participants } = await supabase
        .from("chat_participants")
        .select("user_id, notification_settings")
        .eq("conversation_id", finalConversationId)
        .neq("user_id", currentUserRecord.id);

      if (participants && participants.length > 0) {
        // Create notifications for each participant
        const notifications = participants
          .filter((p) => {
            // Check if participant has muted notifications
            const settings = p.notification_settings as Record<string, unknown>;
            return !settings?.muted;
          })
          .map((participant) => ({
            recipient_id: participant.user_id,
            type: "message",
            title: currentUserRecord.display_name ||
              currentUserRecord.username || "New Message",
            message: content?.substring(0, 100) || "Sent you a message",
            content_type: "conversation",
            content_id: finalConversationId,
            related_user_id: currentUserRecord.id,
            data: {
              conversation_id: finalConversationId,
              message_id: message.id,
              sender_name: currentUserRecord.display_name ||
                currentUserRecord.username,
              message_preview: content?.substring(0, 50),
            },
            action_url: `/messages/${finalConversationId}`,
            priority: "normal",
          }));

        if (notifications.length > 0) {
          const { error: notifError } = await supabase
            .from("notifications")
            .insert(notifications);

          if (notifError) {
            console.error("Error creating notifications:", notifError);
            // Don't fail the request if notifications fail
          }
        }
      }
    } catch (notificationError) {
      console.error("Error sending notifications:", notificationError);
      // Don't fail the message send if notification fails
    }

    return NextResponse.json({
      message,
      messageId: message?.id || message,
      conversationId: finalConversationId,
      success: true,
    });
  } catch (error) {
    console.error("Unexpected error sending message:", error);
    return NextResponse.json(
      {
        error: "Internal server error",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}
