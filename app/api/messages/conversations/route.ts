import { NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

// Define types for better type safety
interface User {
  id: string;
  display_name?: string | null;
  first_name?: string | null;
  last_name?: string | null;
  avatar_url?: string | null;
  profile_image_url?: string | null;
  username?: string | null;
}

interface ConversationParticipant {
  conversation_id: string;
  joined_at: string;
  last_read_at: string | null;
  notification_settings: Record<string, unknown> | null;
  wolfpack_conversations: {
    id: string;
    conversation_type: string;
    created_at: string;
    updated_at: string;
  } | null;
}

interface TransformedConversation {
  id: string;
  conversation_id: string;
  conversation_type: string;
  name: string;
  last_message_at: string | null;
  last_message_preview: string;
  created_at: string;
  updated_at: string;
  unread_count: number;
  other_user_id: string | null;
  other_user_name: string;
  other_user_avatar: string;
  other_user_username: string | null;
  other_user_is_online: boolean;
  user_id: string | null;
  display_name: string;
  username: string | null;
  avatar_url: string;
  last_message: string;
  last_message_time: string | null;
  is_online: boolean;
}

export async function GET() {
  console.log("🔥 CONVERSATIONS API HIT AT:", new Date().toISOString());
  try {
    // Create server client using the same pattern as other API routes
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

    console.log(
      "🚀 API UPDATED - Fetching conversations for auth user:",
      user.id,
      "at",
      new Date().toISOString(),
    );

    // Get the current user's database record first
    const { data: currentUserRecord, error: userError } = await supabase
      .from("users")
      .select("id, display_name")
      .eq("auth_id", user.id)
      .maybeSingle();

    if (userError || !currentUserRecord) {
      console.error("Current user not found in database:", userError);

      // Provide more specific error information
      if (userError?.code === "PGRST116") {
        return NextResponse.json({
          error: "User profile not found. Please complete profile setup.",
          code: "PROFILE_MISSING",
          details: userError.message,
        }, { status: 404 });
      }

      return NextResponse.json({
        error: "Failed to verify user profile",
        code: "USER_LOOKUP_FAILED",
        details: userError?.message || "Unknown error",
      }, { status: 500 });
    }

    console.log("📍 Found current user record:", {
      id: currentUserRecord.id,
      auth_id: user.id,
      display_name: currentUserRecord.display_name || "N/A",
    });

    // Query conversations directly and join with participant data using correct table names
    const { data: conversations, error } = await supabase
      .from("wolfpack_conversation_participants")
      .select(`
        conversation_id,
        joined_at,
        last_read_at,
        notification_settings,
        wolfpack_conversations(
          id,
          conversation_type,
          created_at,
          updated_at
        )
      `)
      .eq("user_id", currentUserRecord.id)
      .order("joined_at", { ascending: false });

    if (error) {
      console.error("Error fetching conversations:", error);
      return NextResponse.json({
        error: "Failed to fetch conversations",
        code: "CONVERSATION_FETCH_FAILED",
        details: error.message,
      }, { status: 500 });
    }

    console.log("✅ Raw conversations data:", conversations);

    if (!conversations || conversations.length === 0) {
      return NextResponse.json({ conversations: [] });
    }

    // For each conversation, get additional data including messages and participants
    const transformedConversations = await Promise.all(
      conversations.map(async (convParticipant: ConversationParticipant) => {
        const conversationId = convParticipant.conversation_id;
        const conversation = convParticipant.wolfpack_conversations;

        if (!conversation) {
          console.warn(
            `No conversation data for participant:`,
            convParticipant,
          );
          return null;
        }

        console.log(`🎯 Processing conversation:`, {
          conversation_id: conversationId,
          conversation_type: conversation.conversation_type,
        });

        // Get the latest message for this conversation
        const { data: latestMessage } = await supabase
          .from("wolfpack_messages")
          .select("content, created_at, sender_id")
          .eq("conversation_id", conversationId)
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle();

        // For direct conversations, find the other participant
        let otherUser: User | null = null;
        let displayName = "Wolf Pack Member"; // Will be updated if we find user info

        if (conversation.conversation_type === "direct") {
          console.log(`🔍 Direct conversation ${conversationId}:`, {
            hasLatestMessage: !!latestMessage,
            senderId: latestMessage?.sender_id,
            currentUserId: currentUserRecord.id,
            senderIsCurrentUser:
              latestMessage?.sender_id === currentUserRecord.id,
          });

          // Try to get other user from message sender
          if (
            latestMessage && latestMessage.sender_id !== currentUserRecord.id
          ) {
            console.log(
              `🔍 Looking up message sender: ${latestMessage.sender_id}`,
            );
            const { data: messageUser, error: userError } = await supabase
              .from("users")
              .select(
                "id, display_name, first_name, last_name, avatar_url, profile_image_url, username",
              )
              .eq("id", latestMessage.sender_id)
              .single();

            console.log(`🔍 Message user lookup result:`, {
              messageUser,
              userError,
            });

            if (messageUser) {
              otherUser = messageUser;
              displayName = messageUser.display_name ||
                messageUser.first_name ||
                messageUser.last_name ||
                messageUser.username ||
                "Wolf Pack Member";
              console.log(`✅ Found user from message: ${displayName}`);
            }
          }

          // If no message sender or sender is current user, try participants table
          if (!otherUser) {
            const { data: otherParticipants } = await supabase
              .from("wolfpack_conversation_participants")
              .select(`
                user_id,
                users(id, display_name, first_name, last_name, avatar_url, profile_image_url, username)
              `)
              .eq("conversation_id", conversationId)
              .neq("user_id", currentUserRecord.id);

            if (otherParticipants && otherParticipants.length > 0) {
              // Access the first participant
              const otherParticipant = otherParticipants[0];
              // When joining with users table, Supabase returns it as a property
              const userData = (otherParticipant as { users: unknown }).users;

              // Check if userData exists and is not an array (should be single object for foreign key)
              if (userData && !Array.isArray(userData)) {
                otherUser = userData as User;
                displayName = otherUser.display_name ||
                  otherUser.first_name ||
                  otherUser.last_name ||
                  otherUser.username ||
                  "Wolf Pack Member";
              }
            }
          }
        } else if (conversation.conversation_type === "group") {
          displayName = "WolfPack Team"; // Default group name
        }

        // If still showing generic name for direct conversation, make it more meaningful
        if (
          conversation.conversation_type === "direct" &&
          displayName === "Wolf Pack Member"
        ) {
          const shortId = conversationId.slice(0, 8);
          displayName = `Wolf Pack Chat ${shortId}`;
        }

        console.log(
          `📝 Conversation ${conversationId} display name: ${displayName}`,
        );

        // Safely access otherUser properties
        const userId = otherUser?.id || null;
        const userAvatar = otherUser?.profile_image_url ||
          otherUser?.avatar_url || "/icons/wolf-icon.png";
        const userUsername = otherUser?.username || null;

        return {
          id: conversationId,
          conversation_id: conversationId,
          conversation_type: conversation.conversation_type,
          name: displayName,
          last_message_at: latestMessage?.created_at || null,
          last_message_preview: latestMessage?.content || "",
          created_at: conversation.created_at,
          updated_at: conversation.updated_at,
          unread_count: 0, // Calculate properly later if needed

          // Other participant info
          other_user_id: userId,
          other_user_name: displayName,
          other_user_avatar: userAvatar,
          other_user_username: userUsername,
          other_user_is_online: false, // Can be enhanced later

          // Legacy format for backward compatibility
          user_id: userId,
          display_name: displayName,
          username: userUsername,
          avatar_url: userAvatar,
          last_message: latestMessage?.content || "",
          last_message_time: latestMessage?.created_at || null,
          is_online: false,
        };
      }),
    );

    // Filter out null results and sort by last message time
    const filteredConversations = transformedConversations
      .filter((conv): conv is TransformedConversation => conv !== null)
      .sort((a, b) => {
        const aTime = a.last_message_at
          ? new Date(a.last_message_at).getTime()
          : 0;
        const bTime = b.last_message_at
          ? new Date(b.last_message_at).getTime()
          : 0;
        return bTime - aTime;
      });

    console.log(
      "🎯 FINAL transformed conversations COUNT:",
      filteredConversations.length,
    );
    console.log(
      "🎯 FINAL transformed conversations:",
      JSON.stringify(filteredConversations, null, 2),
    );

    return NextResponse.json({
      conversations: filteredConversations,
    });
  } catch (error) {
    console.error("Conversation fetch error:", error);
    return NextResponse.json({ error: "Internal server error" }, {
      status: 500,
    });
  }
}
