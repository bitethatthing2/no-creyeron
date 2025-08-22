import * as React from "react";
import { supabase } from "@/lib/supabase";
import type { User } from "@supabase/supabase-js";

/**
 * ⚠️  NEEDS UPDATE: This hook uses the old wolfpack_chat_* tables
 * that were migrated to the unified messaging system.
 * Should be updated to use:
 * - chat_conversations
 * - chat_messages
 * - chat_participants
 */

// Define exact database types based on your Supabase schema
interface WolfpackChatSession {
  id: string;
  user_id: string;
  location_name: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

interface WolfpackChatMessage {
  id: string;
  session_id: string;
  user_id: string;
  content: string;
  created_at: string;
  users: {
    display_name: string;
    avatar_url: string | null;
  };
}

interface WolfpackChatMember {
  id: string;
  session_id: string;
  user_id: string;
  joined_at: string;
  left_at: string | null;
  users: {
    display_name: string;
    avatar_url: string | null;
  };
}

interface SessionState {
  members: WolfpackChatMember[];
  messages: WolfpackChatMessage[];
  isConnected: boolean;
}

interface MessageActions {
  sendMessage: (
    message: string,
  ) => Promise<{ success: boolean; error?: string }>;
  addReaction: (
    messageId: string,
    emoji: string,
  ) => Promise<{ success: boolean; error?: string }>;
  removeReaction: (
    reactionId: string,
  ) => Promise<{ success: boolean; error?: string }>;
}

// Hook 1: Session Management
export function useWolfpackSession(user: User | null, locationName: string) {
  const [sessionId, setSessionId] = React.useState<string | null>(null);
  const [isLoading, setIsLoading] = React.useState(false);
  const [isActive, setIsActive] = React.useState(false);

  React.useEffect(() => {
    if (!user || !locationName) {
      setSessionId(null);
      setIsActive(false);
      return;
    }

    const initSession = async () => {
      setIsLoading(true);
      try {
        // Get or create session for this user/location
        const { data, error } = await supabase
          .from("wolfpack_chat_sessions")
          .select("id")
          .eq("user_id", user.id)
          .eq("location_name", locationName)
          .eq("is_active", true)
          .maybeSingle(); // Use maybeSingle instead of single to avoid error when no rows

        if (data) {
          setSessionId(data.id);
          setIsActive(true);
        } else if (!data && !error) {
          // No session exists, create one
          const { data: newSession, error: createError } = await supabase
            .from("wolfpack_chat_sessions")
            .insert({
              user_id: user.id,
              location_name: locationName,
              is_active: true,
            })
            .select("id")
            .single();

          if (newSession && !createError) {
            setSessionId(newSession.id);
            setIsActive(true);
          } else if (createError) {
            console.error("Error creating session:", createError);
          }
        } else if (error) {
          console.error("Error fetching session:", error);
        }
      } catch (err) {
        console.error("Error initializing session:", err);
      } finally {
        setIsLoading(false);
      }
    };

    initSession();
  }, [user, locationName]);

  return { sessionId, isLoading, isActive };
}

// Hook 2: Chat Management
export function useWolfpackChat(sessionId: string | null) {
  const [state, setState] = React.useState<SessionState>({
    members: [],
    messages: [],
    isConnected: false,
  });

  React.useEffect(() => {
    if (!sessionId) {
      setState({
        members: [],
        messages: [],
        isConnected: false,
      });
      return;
    }

    const loadMessages = async () => {
      try {
        const { data, error } = await supabase
          .from("wolfpack_chat_messages")
          .select(`
            id,
            content,
            created_at,
            user_id,
            session_id,
            users!inner (
              display_name,
              avatar_url
            )
          `)
          .eq("session_id", sessionId)
          .order("created_at", { ascending: false })
          .limit(50);

        if (data && !error) {
          // Type assertion is safe here because we know the shape from our select
          const typedMessages = data as WolfpackChatMessage[];
          setState((prev) => ({
            ...prev,
            messages: typedMessages.reverse(),
            isConnected: true,
          }));
        } else if (error) {
          console.error("Error loading messages:", error);
          setState((prev) => ({
            ...prev,
            isConnected: false,
          }));
        }
      } catch (err) {
        console.error("Error loading messages:", err);
        setState((prev) => ({
          ...prev,
          isConnected: false,
        }));
      }
    };

    loadMessages();

    // Set up realtime subscription
    const channel = supabase
      .channel(`chat:${sessionId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "wolfpack_chat_messages",
          filter: `session_id=eq.${sessionId}`,
        },
        async (payload) => {
          // Fetch the complete message with user data
          const { data } = await supabase
            .from("wolfpack_chat_messages")
            .select(`
              id,
              content,
              created_at,
              user_id,
              session_id,
              users!inner (
                display_name,
                avatar_url
              )
            `)
            .eq("id", payload.new.id)
            .single();

          if (data) {
            setState((prev) => ({
              ...prev,
              messages: [...prev.messages, data as WolfpackChatMessage],
            }));
          }
        },
      )
      .subscribe();

    return () => {
      channel.unsubscribe();
    };
  }, [sessionId]);

  const actions: MessageActions = {
    sendMessage: async (message: string) => {
      if (!sessionId) {
        return { success: false, error: "No active session" };
      }

      try {
        const { error } = await supabase
          .from("wolfpack_chat_messages")
          .insert({
            session_id: sessionId,
            content: message,
          });

        if (error) {
          return { success: false, error: error.message };
        }
        return { success: true };
      } catch (err) {
        console.error("Error sending message:", err);
        return { success: false, error: "Failed to send message" };
      }
    },

    addReaction: async (messageId: string, emoji: string) => {
      if (!sessionId) {
        return { success: false, error: "No active session" };
      }

      try {
        const { error } = await supabase
          .from("wolfpack_chat_reactions")
          .insert({
            message_id: messageId,
            emoji: emoji,
          });

        if (error) {
          return { success: false, error: error.message };
        }
        return { success: true };
      } catch (err) {
        console.error("Error adding reaction:", err);
        return { success: false, error: "Failed to add reaction" };
      }
    },

    removeReaction: async (reactionId: string) => {
      try {
        const { error } = await supabase
          .from("wolfpack_chat_reactions")
          .delete()
          .eq("id", reactionId);

        if (error) {
          return { success: false, error: error.message };
        }
        return { success: true };
      } catch (err) {
        console.error("Error removing reaction:", err);
        return { success: false, error: "Failed to remove reaction" };
      }
    },
  };

  return { state, actions };
}

// Hook 3: Typing Indicators
interface TypingUser {
  userId: string;
  userName: string;
  timestamp: number;
}

export function useTypingIndicators(sessionId: string | null) {
  const [typingUsers, setTypingUsers] = React.useState<TypingUser[]>([]);
  const typingTimeoutRef = React.useRef<Map<string, NodeJS.Timeout>>(new Map());

  React.useEffect(() => {
    if (!sessionId) return;

    const channel = supabase
      .channel(`typing:${sessionId}`)
      .on("broadcast", { event: "typing" }, (payload) => {
        const { userId, userName, isTyping } = payload.payload as {
          userId: string;
          userName: string;
          isTyping: boolean;
        };

        if (isTyping) {
          // Clear existing timeout for this user
          const existingTimeout = typingTimeoutRef.current.get(userId);
          if (existingTimeout) {
            clearTimeout(existingTimeout);
          }

          // Add/update typing user
          setTypingUsers((prev) => {
            const filtered = prev.filter((u) => u.userId !== userId);
            return [...filtered, { userId, userName, timestamp: Date.now() }];
          });

          // Set timeout to remove after 3 seconds
          const timeout = setTimeout(() => {
            setTypingUsers((prev) => prev.filter((u) => u.userId !== userId));
            typingTimeoutRef.current.delete(userId);
          }, 3000);

          typingTimeoutRef.current.set(userId, timeout);
        } else {
          // Remove user from typing list
          const timeout = typingTimeoutRef.current.get(userId);
          if (timeout) {
            clearTimeout(timeout);
            typingTimeoutRef.current.delete(userId);
          }
          setTypingUsers((prev) => prev.filter((u) => u.userId !== userId));
        }
      })
      .subscribe();

    return () => {
      // Clear all timeouts on cleanup
      typingTimeoutRef.current.forEach((timeout) => clearTimeout(timeout));
      typingTimeoutRef.current.clear();
      channel.unsubscribe();
    };
  }, [sessionId]);

  const sendTyping = React.useCallback(
    (userId: string, userName: string, isTyping: boolean) => {
      if (!sessionId) return;

      supabase
        .channel(`typing:${sessionId}`)
        .send({
          type: "broadcast",
          event: "typing",
          payload: { userId, userName, isTyping },
        });
    },
    [sessionId],
  );

  return { typingUsers, sendTyping };
}
