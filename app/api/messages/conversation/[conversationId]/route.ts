import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";

// Type definitions
interface User {
  id: string;
  auth_id: string | null;
  first_name: string | null;
  last_name: string | null;
  display_name: string | null;
  username: string | null;
  avatar_url: string | null;
  profile_image_url: string | null;
  wolfpack_status: string | null;
  is_online: boolean | null;
}

interface MediaMetadata {
  width?: number;
  height?: number;
  duration?: number;
  size?: number;
  mimeType?: string;
  [key: string]: unknown;
}

interface MessageMetadata {
  edited_count?: number;
  forwarded?: boolean;
  [key: string]: unknown;
}

interface Attachment {
  id: string;
  url: string;
  type: string;
  name: string;
  size: number;
}

interface Message {
  id: string;
  content: string;
  sender_id: string;
  conversation_id: string;
  created_at: string;
  edited_at: string | null;
  deleted_at: string | null;
  is_deleted: boolean;
  is_edited: boolean;
  is_read: boolean;
  read_at: string | null;
  delivered_at: string | null;
  media_url: string | null;
  media_type: string | null;
  media_metadata: MediaMetadata | null;
  message_type: string | null;
  metadata: MessageMetadata | null;
  parent_message_id: string | null;
  reactions_count: number | null;
  reply_count: number | null;
  reply_to_id: string | null;
  attachments: Attachment[] | null;
  status: string | null;
}

interface MessageWithSender extends Message {
  sender: User | null;
}

interface TransformedMessage extends Message {
  sender_avatar_url: string;
  sender_display_name: string;
  sender_first_name: string | null;
  sender_last_name: string | null;
  sender_username: string | null;
}

interface ConversationMetadata {
  created_by_admin?: boolean;
  purpose?: string;
  [key: string]: unknown;
}

interface Conversation {
  id: string;
  conversation_type: string;
  name: string | null;
  description: string | null;
  avatar_url: string | null;
  created_at: string;
  updated_at: string;
  created_by: string;
  is_active: boolean;
  last_message_at: string | null;
  last_message_preview: string | null;
  last_message_sender_id: string | null;
  metadata: ConversationMetadata | null;
}

interface NotificationSettings {
  muted?: boolean;
  mentions_only?: boolean;
  [key: string]: unknown;
}

interface Participant {
  user_id: string;
  joined_at: string;
  last_read_at: string | null;
  is_active: boolean;
  role: string | null;
  notification_settings: NotificationSettings | null;
}

interface ParticipantWithUser extends Participant {
  users: User | null;
}

interface Params {
  params: {
    conversationId: string;
  };
}

export async function GET(request: NextRequest, { params }: Params) {
  try {
    const supabase = await createServerClient();
    const { conversationId } = params;

    // Get authenticated user - only call this once
    const { data: { user: authUser }, error: authError } = await supabase.auth
      .getUser();

    if (authError || !authUser) {
      console.error("Authentication error:", authError);
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get the current user's database record
    const { data: currentUserRecord, error: userError } = await supabase
      .from("users")
      .select("id")
      .eq("auth_id", authUser.id)
      .single();

    if (userError || !currentUserRecord) {
      console.error("Error fetching current user:", userError);
      return NextResponse.json({
        error: "User profile not found",
        details: userError?.message,
      }, { status: 404 });
    }

    // Verify user is a participant in this conversation
    const { data: participantCheck, error: participantError } = await supabase
      .from("chat_participants")
      .select("user_id")
      .eq("conversation_id", conversationId)
      .eq("user_id", currentUserRecord.id)
      .single();

    if (participantError || !participantCheck) {
      console.error("User is not a participant in this conversation");
      return NextResponse.json({
        error: "Access denied",
        details: "You are not a participant in this conversation",
      }, { status: 403 });
    }

    // Fetch messages with sender information
    const { data: messagesData, error: messagesError } = await supabase
      .from("chat_messages")
      .select(`
        *,
        sender:users!sender_id(
          id,
          auth_id,
          display_name,
          first_name,
          last_name,
          username,
          avatar_url,
          profile_image_url,
          wolfpack_status,
          is_online
        )
      `)
      .eq("conversation_id", conversationId)
      .eq("is_deleted", false)
      .order("created_at", { ascending: true })
      .returns<MessageWithSender[]>();

    if (messagesError) {
      console.error("Error fetching messages:", messagesError);
      return NextResponse.json({
        error: "Failed to fetch messages",
        details: messagesError.message,
      }, { status: 500 });
    }

    // Type assertion for messages
    const typedMessages = messagesData as MessageWithSender[] | null;

    console.log(
      `Fetched ${
        typedMessages?.length || 0
      } messages for conversation ${conversationId}`,
    );

    // Get conversation metadata
    const { data: conversationData, error: convError } = await supabase
      .from("chat_conversations")
      .select("*")
      .eq("id", conversationId)
      .single();

    // Type assertion for conversation
    const typedConversation = conversationData as Conversation | null;

    if (convError) {
      console.error("Error fetching conversation:", convError);
      return NextResponse.json({
        error: "Conversation not found",
        details: convError.message,
      }, { status: 404 });
    }

    // Get all participants in this conversation
    const { data: participants, error: participantsError } = await supabase
      .from("chat_participants")
      .select(`
        user_id,
        joined_at,
        last_read_at,
        is_active,
        role,
        notification_settings,
        users(
          id,
          auth_id,
          first_name,
          last_name,
          display_name,
          username,
          avatar_url,
          profile_image_url,
          wolfpack_status,
          is_online
        )
      `)
      .eq("conversation_id", conversationId)
      .returns<ParticipantWithUser[]>();

    if (participantsError) {
      console.error("Error fetching participants:", participantsError);
    }

    // Separate current user from other participants
    const otherParticipants = participants?.filter((p) =>
      p.user_id !== currentUserRecord.id
    ) || [];
    const currentUserParticipant = participants?.find((p) =>
      p.user_id === currentUserRecord.id
    );

    console.log(`Participants for conversation ${conversationId}:`, {
      total: participants?.length,
      others: otherParticipants.length,
      currentUser: currentUserParticipant ? "found" : "not found",
    });

    // Update last_read_at for the current user
    if (currentUserParticipant) {
      const { error: updateError } = await supabase
        .from("chat_participants")
        .update({ last_read_at: new Date().toISOString() })
        .eq("conversation_id", conversationId)
        .eq("user_id", currentUserRecord.id);

      if (updateError) {
        console.error("Error updating last_read_at:", updateError);
        // Don't fail the request, just log the error
      }
    }

    // Transform messages to include sender info properly
    const transformedMessages: TransformedMessage[] =
      typedMessages?.map((msg: MessageWithSender) => {
        const sender = msg.sender;

        // Build display name with fallbacks
        let senderDisplayName = "Unknown User";
        if (sender) {
          if (sender.display_name) {
            senderDisplayName = sender.display_name;
          } else {
            const fullName = `${sender.first_name || ""} ${
              sender.last_name || ""
            }`.trim();
            if (fullName) {
              senderDisplayName = fullName;
            } else if (sender.username) {
              senderDisplayName = sender.username;
            }
          }
        }

        return {
          id: msg.id,
          content: msg.content,
          sender_id: msg.sender_id,
          conversation_id: msg.conversation_id,
          created_at: msg.created_at,
          edited_at: msg.edited_at,
          deleted_at: msg.deleted_at,
          is_deleted: msg.is_deleted,
          is_edited: msg.is_edited,
          is_read: msg.is_read || false,
          read_at: msg.read_at,
          delivered_at: msg.delivered_at,
          media_url: msg.media_url,
          media_type: msg.media_type,
          media_metadata: msg.media_metadata,
          message_type: msg.message_type,
          metadata: msg.metadata,
          parent_message_id: msg.parent_message_id,
          reactions_count: msg.reactions_count || 0,
          reply_count: msg.reply_count || 0,
          reply_to_id: msg.reply_to_id,
          attachments: msg.attachments || [],
          status: msg.status,
          // Sender information
          sender_avatar_url: sender?.profile_image_url || sender?.avatar_url ||
            "/icons/wolf-icon.png",
          sender_display_name: senderDisplayName,
          sender_first_name: sender?.first_name || null,
          sender_last_name: sender?.last_name || null,
          sender_username: sender?.username || null,
        };
      }) || [];

    return NextResponse.json({
      messages: transformedMessages,
      conversation: typedConversation,
      participants: otherParticipants,
      currentUserParticipant,
      conversationId,
      totalParticipants: participants?.length || 0,
    });
  } catch (error) {
    console.error("Unexpected error in messages route:", error);
    return NextResponse.json({
      error: "Internal server error",
      details: error instanceof Error ? error.message : "Unknown error",
    }, { status: 500 });
  }
}
