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

interface ConversationData {
  id: string;
  conversation_type: string;
  created_at: string;
  updated_at: string;
}

interface ConversationParticipantRaw {
  conversation_id: string;
  joined_at: string;
  last_read_at: string | null;
  notification_settings: Record<string, unknown> | null;
  chat_conversations: ConversationData | null;
}

interface ParticipantWithUser {
  user_id: string;
  users: User | null;
}

interface MessageWithSender {
  content: string;
  created_at: string;
  sender_id: string;
  sender: User | null;
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

interface SupabaseError {
  message: string;
  details?: string;
  hint?: string;
  code?: string;
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
      .from("chat_participants")
      .select(`
        conversation_id,
        joined_at,
        last_read_at,
        notification_settings,
        chat_conversations(
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
      conversations.map(async (convParticipant: ConversationParticipantRaw) => {
        try {
          const conversationId = convParticipant.conversation_id;
          const conversation = convParticipant.chat_conversations;

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

          // Get the latest message for this conversation WITH sender info
          const { data: latestMessage } = await supabase
            .from("chat_messages")
            .select(`
              content, 
              created_at, 
              sender_id,
              sender:users!wolfpack_messages_sender_id_fkey(
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
            .order("created_at", { ascending: false })
            .limit(1)
            .maybeSingle() as { data: MessageWithSender | null };

          // Initialize variables that will be used throughout
          let otherUser: User | null = null;
          let displayName = "Wolf Pack Member"; // Will be updated if we find user info
          let allParticipants: ParticipantWithUser[] | null = null; // Declare at function scope

          if (conversation.conversation_type === "direct") {
            console.log(`🔍 Direct conversation ${conversationId}:`, {
              hasLatestMessage: !!latestMessage,
              senderId: latestMessage?.sender_id,
              currentUserId: currentUserRecord.id,
              senderIsCurrentUser:
                latestMessage?.sender_id === currentUserRecord.id,
            });

            // FIRST: Try to get the other user from ANY message in the conversation
            // This is the most reliable way since messages always have sender info
            const { data: allMessages, error: messagesError } = await supabase
              .from("chat_messages")
              .select(`
                sender_id,
                sender:users!sender_id(
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
              .limit(10) as {
                data: MessageWithSender[] | null;
                error: SupabaseError | null;
              };

            console.log(`📧 Messages for ${conversationId}:`, {
              messagesCount: allMessages?.length,
              messagesError,
              messages: allMessages?.map((m) => ({
                sender_id: m.sender_id,
                has_sender: !!m.sender,
                sender_data: m.sender,
              })),
            });

            // Find a message from someone other than the current user
            if (allMessages && allMessages.length > 0) {
              for (const msg of allMessages) {
                const senderData = msg.sender;
                console.log(`🔍 Checking message sender:`, {
                  sender_id: msg.sender_id,
                  is_current_user: msg.sender_id === currentUserRecord.id,
                  has_sender_data: !!senderData,
                  sender_data: senderData,
                });

                if (msg.sender_id !== currentUserRecord.id && senderData) {
                  otherUser = senderData;
                  const fullName = `${otherUser.first_name || ""} ${
                    otherUser.last_name || ""
                  }`.trim();
                  displayName = otherUser.display_name ||
                    fullName ||
                    otherUser.username ||
                    "Wolf Pack Member";
                  console.log(
                    `✅ Found other user from messages: ${displayName} (id: ${otherUser.id})`,
                  );
                  break;
                }
              }
            }

            // SECOND FALLBACK: Try participants table if we didn't find from messages
            if (!otherUser) {
              const { data: participantsData, error: participantsError } =
                await supabase
                  .from("chat_participants")
                  .select(`
                  user_id,
                  users(id, display_name, first_name, last_name, avatar_url, profile_image_url, username)
                `)
                  .eq("conversation_id", conversationId) as {
                    data: ParticipantWithUser[] | null;
                    error: SupabaseError | null;
                  };

              allParticipants = participantsData;

              console.log(`🔍 Participants lookup for ${conversationId}:`, {
                allParticipants,
                participantsError,
                currentUserId: currentUserRecord.id,
              });

              // Filter out current user in JavaScript
              const otherParticipants = allParticipants?.filter((p) =>
                p.user_id !== currentUserRecord.id
              );

              if (otherParticipants && otherParticipants.length > 0) {
                const otherParticipant = otherParticipants[0];
                const userData = otherParticipant.users;

                if (userData) {
                  otherUser = userData;
                  const fullName = `${otherUser.first_name || ""} ${
                    otherUser.last_name || ""
                  }`.trim();
                  displayName = otherUser.display_name ||
                    fullName ||
                    otherUser.username ||
                    "Wolf Pack Member";
                  console.log(
                    `✅ Found participant: ${displayName} (id: ${otherUser.id})`,
                  );
                }
              }
            }

            // THIRD FALLBACK: Use latest message sender if available
            if (
              !otherUser && latestMessage?.sender &&
              latestMessage.sender.id !== currentUserRecord.id
            ) {
              otherUser = latestMessage.sender;
              const fullName = `${otherUser.first_name || ""} ${
                otherUser.last_name || ""
              }`.trim();
              displayName = otherUser.display_name ||
                fullName ||
                otherUser.username ||
                "Wolf Pack Member";
              console.log(`✅ Found user from latest message: ${displayName}`);
            }

            // FINAL FALLBACK: If we have a sender_id but no user data, try direct lookup
            if (!otherUser && allMessages && allMessages.length > 0) {
              for (const msg of allMessages) {
                if (
                  msg.sender_id && msg.sender_id !== currentUserRecord.id &&
                  !msg.sender
                ) {
                  console.log(
                    `🔍 Attempting direct user lookup for sender_id: ${msg.sender_id}`,
                  );
                  const { data: directUser, error: directError } =
                    await supabase
                      .from("users")
                      .select(
                        "id, display_name, first_name, last_name, username, avatar_url, profile_image_url",
                      )
                      .eq("id", msg.sender_id)
                      .single();

                  if (directUser) {
                    otherUser = directUser;
                    const fullName = `${otherUser.first_name || ""} ${
                      otherUser.last_name || ""
                    }`.trim();
                    displayName = otherUser.display_name ||
                      fullName ||
                      otherUser.username ||
                      "Wolf Pack Member";
                    console.log(
                      `✅ Found user via direct lookup: ${displayName} (id: ${otherUser.id})`,
                    );
                    break;
                  } else {
                    console.log(
                      `❌ Direct lookup failed for ${msg.sender_id}:`,
                      directError,
                    );

                    // Try looking up by auth_id in case sender_id is actually an auth_id
                    const { data: authUser, error: authError } = await supabase
                      .from("users")
                      .select(
                        "id, display_name, first_name, last_name, username, avatar_url, profile_image_url",
                      )
                      .eq("auth_id", msg.sender_id)
                      .single();

                    if (authUser) {
                      otherUser = authUser;
                      const fullName = `${otherUser.first_name || ""} ${
                        otherUser.last_name || ""
                      }`.trim();
                      displayName = otherUser.display_name ||
                        fullName ||
                        otherUser.username ||
                        "Wolf Pack Member";
                      console.log(
                        `✅ Found user via auth_id lookup: ${displayName} (id: ${otherUser.id})`,
                      );
                      break;
                    } else {
                      console.log(
                        `❌ Auth_id lookup also failed for ${msg.sender_id}:`,
                        authError,
                      );
                    }
                  }
                }
              }
            }

            // Check for broken conversations after attempting to find participants
            if (displayName === "Wolf Pack Member") {
              // If we haven't fetched participants yet, do it now
              if (!allParticipants) {
                const { data: participantsData } = await supabase
                  .from("chat_participants")
                  .select(`
                    user_id,
                    users(id, display_name, first_name, last_name, avatar_url, profile_image_url, username)
                  `)
                  .eq("conversation_id", conversationId) as {
                    data: ParticipantWithUser[] | null;
                    error: SupabaseError | null;
                  };

                allParticipants = participantsData;
              }

              // Check if this is a broken conversation (only has current user)
              const participantCount = allParticipants?.length || 0;

              if (
                participantCount === 1 &&
                allParticipants?.[0].user_id === currentUserRecord.id
              ) {
                // This is a broken conversation - only has the current user
                console.log(
                  `⚠️ BROKEN: Conversation ${conversationId} only has current user as participant - removing from list`,
                );

                // Skip this conversation entirely - it shouldn't exist
                return null;
              } else if (!latestMessage) {
                // This is likely a new conversation with no messages
                displayName = "New Conversation";
                console.log(
                  `📝 New conversation with no messages: ${conversationId}`,
                );
              } else {
                // We have messages but couldn't identify the user
                displayName = "Unknown User";
                console.log(
                  `⚠️ ERROR: Could not determine name for conversation ${conversationId} despite having messages`,
                );
              }
            }
          } else if (conversation.conversation_type === "group") {
            displayName = "WolfPack Team"; // Default group name
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
        } catch (error) {
          console.error(
            `Error processing conversation ${convParticipant?.conversation_id}:`,
            error,
          );
          return null;
        }
      }),
    );

    // Filter out null results (broken conversations) and sort by last message time
    const filteredConversations = transformedConversations
      .filter((conv): conv is TransformedConversation => {
        if (conv === null) {
          console.log("📝 Filtered out broken conversation");
          return false;
        }
        return true;
      })
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
