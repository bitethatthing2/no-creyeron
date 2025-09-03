import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";

// Type definitions based on actual database schema
interface User {
  id: string;
  auth_id: string | null;
  email: string;
  username: string;
  first_name: string | null;
  last_name: string | null;
  display_name: string | null;
  avatar_url: string | null;
  profile_image_url: string | null;
  bio: string | null;
  is_verified: boolean | null;
  is_private: boolean | null;
  account_status: string | null;
  last_seen_at: string | null;
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
  forwarded_from?: string;
  reply_preview?: {
    id: string;
    content: string;
    sender_name: string;
  };
  mentions?: string[];
  [key: string]: unknown;
}

interface Attachment {
  id: string;
  type: "image" | "video" | "audio" | "file" | "gif";
  url: string;
  thumbnail_url?: string;
  name?: string;
  size?: number;
  mime_type?: string;
  width?: number;
  height?: number;
  duration?: number;
}

interface Message {
  id: string;
  content: string;
  sender_id: string;
  conversation_id: string;
  created_at: string;
  edited_at: string | null;
  deleted_at: string | null;
  deleted_by: string | null;
  is_deleted: boolean | null;
  is_edited: boolean | null;
  message_type: string | null;
  media_url: string | null;
  media_type: string | null;
  media_thumbnail_url: string | null;
  media_size: number | null;
  media_duration: number | null;
  media_metadata: MediaMetadata | null;
  metadata: MessageMetadata | null;
  reply_count: number | null;
  reply_to_id: string | null;
  attachments: Attachment[] | null;
}

interface MessageReaction {
  id: string;
  message_id: string;
  user_id: string;
  reaction: string;
  created_at: string;
}

interface MessageReceipt {
  id: string;
  message_id: string;
  user_id: string;
  delivered_at: string | null;
  read_at: string | null;
}

interface MessageWithRelations extends Message {
  sender: User | null;
  reactions?: MessageReaction[];
  receipts?: MessageReceipt[];
}

interface TransformedMessage extends Message {
  sender_avatar_url: string;
  sender_display_name: string;
  sender_first_name: string | null;
  sender_last_name: string | null;
  sender_username: string | null;
  sender_is_verified: boolean;
  is_own_message: boolean;
  is_read: boolean;
  read_at: string | null;
  delivered_at: string | null;
  reactions: Array<{
    reaction: string;
    count: number;
    users: string[];
    has_reacted: boolean;
  }>;
}

interface ConversationMetadata {
  created_from?: "app" | "web" | "api";
  is_support?: boolean;
  tags?: string[];
  custom_data?: Record<string, unknown>;
  [key: string]: unknown;
}

interface ConversationSettings {
  muted?: boolean;
  notifications?: "all" | "mentions" | "none";
  theme?: string;
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
  created_by: string | null;
  is_active: boolean | null;
  last_message_at: string | null;
  last_message_preview: string | null;
  last_message_sender_id: string | null;
  metadata: ConversationMetadata | null;
  settings: ConversationSettings | null;
  participant_count: number | null;
  message_count: number | null;
  is_archived: boolean | null;
  is_pinned: boolean | null;
}

interface NotificationSettings {
  muted: boolean;
  muted_until?: string;
  mentions_only?: boolean;
  [key: string]: unknown;
}

interface Participant {
  user_id: string;
  conversation_id: string;
  joined_at: string | null;
  left_at: string | null;
  last_read_at: string | null;
  is_active: boolean | null;
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

    // Get authenticated user
    const { data: { user: authUser }, error: authError } = await supabase.auth
      .getUser();

    if (authError || !authUser) {
      console.error("Authentication error:", authError);
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get the current user's database record
    const { data: currentUserRecord, error: userError } = await supabase
      .from("users")
      .select("id, username, display_name, avatar_url, profile_image_url")
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
      .select("user_id, last_read_at")
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

    // Fetch messages with sender information and reactions
    const { data: messagesData, error: messagesError } = await supabase
      .from("chat_messages")
      .select(`
        *,
        sender:users!sender_id(
          id,
          auth_id,
          email,
          username,
          display_name,
          first_name,
          last_name,
          avatar_url,
          profile_image_url,
          bio,
          is_verified,
          is_private,
          account_status,
          last_seen_at
        )
      `)
      .eq("conversation_id", conversationId)
      .is("deleted_at", null) // Only get non-deleted messages
      .order("created_at", { ascending: true })
      .returns<MessageWithRelations[]>();

    if (messagesError) {
      console.error("Error fetching messages:", messagesError);
      return NextResponse.json({
        error: "Failed to fetch messages",
        details: messagesError.message,
      }, { status: 500 });
    }

    // Fetch reactions for all messages
    const messageIds = messagesData?.map((m) => m.id) || [];
    const { data: reactionsData } = await supabase
      .from("chat_message_reactions")
      .select("*")
      .in("message_id", messageIds);

    // Fetch read receipts for all messages
    const { data: receiptsData } = await supabase
      .from("chat_message_receipts")
      .select("*")
      .in("message_id", messageIds);

    // Group reactions and receipts by message
    const reactionsByMessage = new Map<string, MessageReaction[]>();
    const receiptsByMessage = new Map<string, MessageReceipt[]>();

    reactionsData?.forEach((reaction) => {
      const existing = reactionsByMessage.get(reaction.message_id) || [];
      existing.push(reaction);
      reactionsByMessage.set(reaction.message_id, existing);
    });

    receiptsData?.forEach((receipt) => {
      const existing = receiptsByMessage.get(receipt.message_id) || [];
      existing.push(receipt);
      receiptsByMessage.set(receipt.message_id, existing);
    });

    console.log(
      `Fetched ${
        messagesData?.length || 0
      } messages for conversation ${conversationId}`,
    );

    // Get conversation metadata
    const { data: conversationData, error: convError } = await supabase
      .from("chat_conversations")
      .select("*")
      .eq("id", conversationId)
      .single();

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
        conversation_id,
        joined_at,
        left_at,
        last_read_at,
        is_active,
        role,
        notification_settings,
        users(
          id,
          auth_id,
          email,
          username,
          first_name,
          last_name,
          display_name,
          avatar_url,
          profile_image_url,
          bio,
          is_verified,
          is_private,
          account_status,
          last_seen_at
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

    // Transform messages to include sender info and reactions
    const transformedMessages: TransformedMessage[] =
      messagesData?.map((msg: MessageWithRelations) => {
        const sender = msg.sender;
        const messageReactions = reactionsByMessage.get(msg.id) || [];
        const messageReceipts = receiptsByMessage.get(msg.id) || [];

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

        // Group reactions by type
        const reactionGroups = new Map<
          string,
          { count: number; users: string[] }
        >();
        messageReactions.forEach((reaction) => {
          const existing = reactionGroups.get(reaction.reaction) ||
            { count: 0, users: [] };
          existing.count++;
          existing.users.push(reaction.user_id);
          reactionGroups.set(reaction.reaction, existing);
        });

        // Check if message is read
        const currentUserReceipt = messageReceipts.find((r) =>
          r.user_id === currentUserRecord.id
        );
        const isRead = !!currentUserReceipt?.read_at;
        const deliveredAt = currentUserReceipt?.delivered_at;

        return {
          // Message fields
          id: msg.id,
          content: msg.content,
          sender_id: msg.sender_id,
          conversation_id: msg.conversation_id,
          created_at: msg.created_at,
          edited_at: msg.edited_at,
          deleted_at: msg.deleted_at,
          deleted_by: msg.deleted_by,
          is_deleted: msg.is_deleted || false,
          is_edited: msg.is_edited || false,
          message_type: msg.message_type,
          media_url: msg.media_url,
          media_type: msg.media_type,
          media_thumbnail_url: msg.media_thumbnail_url,
          media_size: msg.media_size,
          media_duration: msg.media_duration,
          media_metadata: msg.media_metadata,
          metadata: msg.metadata,
          reply_count: msg.reply_count || 0,
          reply_to_id: msg.reply_to_id,
          attachments: msg.attachments || [],
          // Sender information
          sender_avatar_url: sender?.avatar_url || sender?.profile_image_url ||
            "/default-avatar.png",
          sender_display_name: senderDisplayName,
          sender_first_name: sender?.first_name || null,
          sender_last_name: sender?.last_name || null,
          sender_username: sender?.username || null,
          sender_is_verified: sender?.is_verified || false,
          is_own_message: msg.sender_id === currentUserRecord.id,
          // Read status
          is_read: isRead,
          read_at: currentUserReceipt?.read_at || null,
          delivered_at: deliveredAt || null,
          // Reactions
          reactions: Array.from(reactionGroups.entries()).map((
            [reaction, data],
          ) => ({
            reaction,
            count: data.count,
            users: data.users,
            has_reacted: data.users.includes(currentUserRecord.id),
          })),
        };
      }) || [];

    // Mark messages as delivered
    const undeliveredMessageIds = messagesData
      ?.filter((msg) => {
        const receipt = receiptsByMessage.get(msg.id)?.find((r) =>
          r.user_id === currentUserRecord.id
        );
        return !receipt?.delivered_at && msg.sender_id !== currentUserRecord.id;
      })
      .map((msg) => msg.id) || [];

    if (undeliveredMessageIds.length > 0) {
      // Create delivery receipts for undelivered messages
      const deliveryReceipts = undeliveredMessageIds.map((messageId) => ({
        message_id: messageId,
        user_id: currentUserRecord.id,
        delivered_at: new Date().toISOString(),
      }));

      const { error: deliveryError } = await supabase
        .from("chat_message_receipts")
        .upsert(deliveryReceipts, { onConflict: "message_id,user_id" });

      if (deliveryError) {
        console.error("Error marking messages as delivered:", deliveryError);
      }
    }

    return NextResponse.json({
      messages: transformedMessages,
      conversation: conversationData,
      participants: otherParticipants,
      currentUserParticipant,
      conversationId,
      totalParticipants: participants?.length || 0,
      unreadCount: transformedMessages.filter((m) =>
        !m.is_own_message && !m.is_read
      ).length,
    });
  } catch (error) {
    console.error("Unexpected error in messages route:", error);
    return NextResponse.json({
      error: "Internal server error",
      details: error instanceof Error ? error.message : "Unknown error",
    }, { status: 500 });
  }
}
