import { NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

// Force dynamic rendering for this API route
export const dynamic = 'force-dynamic';

// Define types for better type safety
interface User {
  id: string;
  display_name?: string | null;
  first_name?: string | null;
  last_name?: string | null;
  avatar_url?: string | null;
  profile_image_url?: string | null;
  username?: string | null;
  email?: string | null;
  last_seen_at?: string | null;
}

interface ConversationData {
  id: string;
  conversation_type: string;
  name?: string | null;
  description?: string | null;
  avatar_url?: string | null;
  last_message_at?: string | null;
  last_message_preview?: string | null;
  last_message_sender_id?: string | null;
  message_count: number;
  participant_count: number;
  is_archived: boolean;
  is_pinned: boolean;
  created_at: string;
  updated_at: string;
  metadata?: Record<string, unknown>;
}

interface MessageData {
  id: string;
  content: string;
  created_at: string;
  sender_id: string;
  message_type: string;
  is_deleted: boolean;
  is_edited: boolean;
  users?: User;
}

interface TransformedConversation {
  id: string;
  conversation_id: string;
  conversation_type: string;
  name: string;
  description?: string | null;
  avatar_url: string;
  last_message_at: string | null;
  last_message_preview: string;
  message_count: number;
  participant_count: number;
  is_archived: boolean;
  is_pinned: boolean;
  created_at: string;
  updated_at: string;
  unread_count: number;

  // For direct messages
  other_user?: {
    id: string;
    display_name: string;
    first_name?: string | null;
    last_name?: string | null;
    username?: string | null;
    avatar_url: string;
    is_online: boolean;
  };

  // Participants list for group chats
  participants?: Array<{
    id: string;
    display_name: string;
    username?: string | null;
    avatar_url: string;
  }>;
}

export async function GET() {
  console.log("🔥 CONVERSATIONS API HIT AT:", new Date().toISOString());

  try {
    // Create server client
    const cookieStore = cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return cookieStore.get(name)?.value;
          },
        },
      },
    );

    // Get the authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      console.error("Authentication error:", authError);
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    console.log("🚀 Fetching conversations for auth user:", user.id);

    // Get the current user's database record using auth_id
    const { data: currentUserRecord, error: userError } = await supabase
      .from("users")
      .select(
        "id, display_name, first_name, last_name, username, avatar_url, profile_image_url",
      )
      .eq("auth_id", user.id)
      .single();

    if (userError || !currentUserRecord) {
      console.error("User lookup error:", userError);

      // Check if user profile doesn't exist
      if (userError?.code === "PGRST116") {
        return NextResponse.json({
          error: "User profile not found. Please complete profile setup.",
          code: "PROFILE_MISSING",
        }, { status: 404 });
      }

      return NextResponse.json({
        error: "Failed to verify user profile",
        code: "USER_LOOKUP_FAILED",
      }, { status: 500 });
    }

    console.log("📍 Found current user:", {
      id: currentUserRecord.id,
      auth_id: user.id,
      display_name: currentUserRecord.display_name,
    });

    // Get all conversations where the user is a participant
    const { data: participantRecords, error: convError } = await supabase
      .from("chat_participants")
      .select(`
        id,
        user_id,
        conversation_id,
        role,
        joined_at,
        last_read_at,
        is_active,
        notification_settings,
        chat_conversations (
          id,
          conversation_type,
          name,
          description,
          avatar_url,
          last_message_at,
          last_message_preview,
          last_message_sender_id,
          message_count,
          participant_count,
          is_archived,
          is_pinned,
          created_at,
          updated_at,
          metadata
        )
      `)
      .eq("user_id", currentUserRecord.id)
      .eq("is_active", true)
      .order("joined_at", { ascending: false });

    if (convError) {
      console.error("Error fetching conversations:", convError);
      return NextResponse.json({
        error: "Failed to fetch conversations",
        details: convError.message,
      }, { status: 500 });
    }

    if (!participantRecords || participantRecords.length === 0) {
      console.log("No conversations found for user");
      return NextResponse.json({ conversations: [] });
    }

    console.log(`Found ${participantRecords.length} conversation(s)`);

    // Transform conversations with additional data
    const transformedConversations = await Promise.all(
      participantRecords.map(async (record) => {
        try {
          // Handle both single object and array responses from Supabase
          const conversationRaw = record.chat_conversations;
          const conversation = Array.isArray(conversationRaw)
            ? conversationRaw[0] as ConversationData
            : conversationRaw as ConversationData;

          if (!conversation) {
            console.warn(
              "No conversation data for participant record:",
              record.id,
            );
            return null;
          }

          const conversationId = conversation.id;
          console.log(
            `Processing conversation ${conversationId} (${conversation.conversation_type})`,
          );

          // Get the latest message if there is one
          let lastMessage: MessageData | null = null;
          if (conversation.last_message_at) {
            const { data: messageData } = await supabase
              .from("chat_messages")
              .select(`
                id,
                content,
                created_at,
                sender_id,
                message_type,
                is_deleted,
                is_edited,
                users:sender_id (
                  id,
                  display_name,
                  first_name,
                  last_name,
                  username,
                  avatar_url,
                  profile_image_url
                )
              `)
              .eq("conversation_id", conversationId)
              .eq("is_deleted", false)
              .order("created_at", { ascending: false })
              .limit(1)
              .single();

            lastMessage = messageData as MessageData | null;
          }

          // Calculate unread count (messages since last_read_at)
          let unreadCount = 0;
          if (record.last_read_at) {
            const { count } = await supabase
              .from("chat_messages")
              .select("id", { count: "exact", head: true })
              .eq("conversation_id", conversationId)
              .neq("sender_id", currentUserRecord.id)
              .gt("created_at", record.last_read_at);

            unreadCount = count || 0;
          } else {
            // If never read, count all messages not from current user
            const { count } = await supabase
              .from("chat_messages")
              .select("id", { count: "exact", head: true })
              .eq("conversation_id", conversationId)
              .neq("sender_id", currentUserRecord.id);

            unreadCount = count || 0;
          }

          // Base transformed conversation
          const baseConversation: TransformedConversation = {
            id: conversationId,
            conversation_id: conversationId,
            conversation_type: conversation.conversation_type,
            name: conversation.name || "Unnamed Conversation",
            description: conversation.description,
            avatar_url: conversation.avatar_url || "https://tvnpgbjypnezoasbhbwx.supabase.co/storage/v1/object/public/icons/wolf-512x512.png",
            last_message_at: lastMessage?.created_at ||
              conversation.last_message_at || null,
            last_message_preview: lastMessage?.content ||
              conversation.last_message_preview || "",
            message_count: conversation.message_count,
            participant_count: conversation.participant_count,
            is_archived: conversation.is_archived,
            is_pinned: conversation.is_pinned,
            created_at: conversation.created_at,
            updated_at: conversation.updated_at,
            unread_count: unreadCount,
          };

          // For direct messages, get the other user
          if (conversation.conversation_type === "direct") {
            const { data: allParticipants } = await supabase
              .from("chat_participants")
              .select(`
                user_id,
                users (
                  id,
                  display_name,
                  first_name,
                  last_name,
                  username,
                  avatar_url,
                  profile_image_url,
                  last_seen_at
                )
              `)
              .eq("conversation_id", conversationId)
              .eq("is_active", true);

            if (allParticipants && allParticipants.length > 0) {
              // Find the other user (not current user)
              const otherParticipant = allParticipants.find(
                (p) => p.user_id !== currentUserRecord.id,
              );

              if (otherParticipant?.users) {
                // Handle both single object and array responses
                const userRaw = otherParticipant.users;
                const otherUser = Array.isArray(userRaw)
                  ? userRaw[0] as User
                  : userRaw as User;

                if (otherUser) {
                  console.log("🔍 Other user data:", {
                    id: otherUser.id,
                    first_name: otherUser.first_name,
                    last_name: otherUser.last_name,
                    display_name: otherUser.display_name,
                    username: otherUser.username
                  });
                  
                  const fullName = `${otherUser.first_name || ""} ${
                    otherUser.last_name || ""
                  }`.trim();
                  const displayName = fullName || otherUser.display_name ||
                    otherUser.username || "Wolf Pack Member";

                  // Check if user is online (last seen within 5 minutes)
                  const lastSeen = otherUser.last_seen_at
                    ? new Date(otherUser.last_seen_at)
                    : null;
                  const isOnline = lastSeen
                    ? (Date.now() - lastSeen.getTime()) < 5 * 60 * 1000
                    : false;

                  baseConversation.other_user = {
                    id: otherUser.id,
                    display_name: displayName,
                    first_name: otherUser.first_name,
                    last_name: otherUser.last_name,
                    username: otherUser.username,
                    avatar_url: otherUser.avatar_url ||
                      otherUser.profile_image_url || "https://tvnpgbjypnezoasbhbwx.supabase.co/storage/v1/object/public/icons/wolf-512x512.png",
                    is_online: isOnline,
                  };

                  // Override conversation name and avatar with other user's info for DMs
                  baseConversation.name = displayName;
                  baseConversation.avatar_url =
                    baseConversation.other_user.avatar_url;
                }
              }
            }
          } // For group chats, get all participants
          else if (conversation.conversation_type === "group") {
            const { data: allParticipants } = await supabase
              .from("chat_participants")
              .select(`
                user_id,
                users (
                  id,
                  display_name,
                  first_name,
                  last_name,
                  username,
                  avatar_url,
                  profile_image_url
                )
              `)
              .eq("conversation_id", conversationId)
              .eq("is_active", true)
              .limit(5); // Limit to first 5 participants for preview

            if (allParticipants && allParticipants.length > 0) {
              baseConversation.participants = allParticipants
                .filter((p) => p.users)
                .map((p) => {
                  // Handle both single object and array responses
                  const userRaw = p.users;
                  const user = Array.isArray(userRaw)
                    ? userRaw[0] as User
                    : userRaw as User;

                  if (!user) return null;

                  const fullName = `${user.first_name || ""} ${
                    user.last_name || ""
                  }`.trim();
                  const displayName = fullName || user.display_name ||
                    user.username || "Member";

                  return {
                    id: user.id,
                    display_name: displayName,
                    username: user.username,
                    avatar_url: user.avatar_url || user.profile_image_url ||
                      "https://tvnpgbjypnezoasbhbwx.supabase.co/storage/v1/object/public/icons/wolf-512x512.png",
                  };
                })
                .filter((p): p is NonNullable<typeof p> => p !== null);

              // If no custom name, generate one from participants
              if (!conversation.name) {
                const names = baseConversation.participants
                  .slice(0, 3)
                  .map((p) => p.display_name);
                baseConversation.name = names.join(", ");
                if (allParticipants.length > 3) {
                  baseConversation.name += ` +${allParticipants.length - 3}`;
                }
              }
            }
          }

          return baseConversation;
        } catch (error) {
          console.error(
            `Error processing conversation ${record.conversation_id}:`,
            error,
          );
          return null;
        }
      }),
    );

    // Filter out nulls and sort by last message time (most recent first)
    const validConversations = transformedConversations
      .filter((conv): conv is TransformedConversation => conv !== null)
      .sort((a, b) => {
        // Pinned conversations first
        if (a.is_pinned !== b.is_pinned) {
          return a.is_pinned ? -1 : 1;
        }

        // Then by last message time
        const aTime = a.last_message_at
          ? new Date(a.last_message_at).getTime()
          : 0;
        const bTime = b.last_message_at
          ? new Date(b.last_message_at).getTime()
          : 0;
        return bTime - aTime;
      });

    console.log(`✅ Returning ${validConversations.length} conversations`);

    return NextResponse.json({
      conversations: validConversations,
      total: validConversations.length,
    });
  } catch (error) {
    console.error("Unexpected error in conversations API:", error);
    return NextResponse.json(
      {
        error: "Internal server error",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}
