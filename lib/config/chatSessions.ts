/**
 * Chat Sessions Configuration
 * Integrates with Supabase chat_conversations table
 */

import { Database } from "@/types/database.types";
import { supabase } from "@/lib/supabase";

// Type from database
export type ChatConversation =
  Database["public"]["Tables"]["chat_conversations"]["Row"];

// Extended type for frontend use
export interface ChatSession {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  conversation_type: "direct" | "group" | "location" | "broadcast";
  avatar_url: string | null;
  metadata: {
    locationId?: string;
    icon?: string;
    isDefault?: boolean;
    [key: string]: unknown;
  };
  participant_count: number;
  message_count: number;
  last_message_at: string | null;
  last_message_preview: string | null;
  is_active: boolean;
  is_pinned: boolean;
}

// Default chat sessions (for initial setup or fallback)
export const DEFAULT_CHAT_SESSIONS: Partial<ChatSession>[] = [
  {
    slug: "general",
    name: "General Chat",
    description: "Main community chat for all locations",
    conversation_type: "broadcast",
    metadata: {
      icon: "🌍",
      isDefault: true,
    },
  },
  {
    slug: "salem",
    name: "Salem Location",
    description: "Salem location chat",
    conversation_type: "location",
    metadata: {
      locationId: "50d17782-3f4a-43a1-b6b6-608171ca3c7c",
      icon: "📍",
    },
  },
  {
    slug: "portland",
    name: "Portland Location",
    description: "Portland location chat",
    conversation_type: "location",
    metadata: {
      locationId: "ec1e8869-454a-49d2-93e5-ed05f49bb932",
      icon: "📍",
    },
  },
  {
    slug: "events",
    name: "Events",
    description: "Event discussions and announcements",
    conversation_type: "group",
    metadata: {
      icon: "🎉",
    },
  },
  {
    slug: "music",
    name: "Music Requests",
    description: "DJ song requests and music chat",
    conversation_type: "group",
    metadata: {
      icon: "🎵",
    },
  },
];

/**
 * Get all chat sessions from database
 */
export const getAllSessions = async (): Promise<ChatSession[]> => {
  try {
    const { data, error } = await supabase
      .from("chat_conversations")
      .select("*")
      .in("conversation_type", ["group", "location", "broadcast"])
      .eq("is_active", true)
      .order("is_pinned", { ascending: false })
      .order("name", { ascending: true });

    if (error) {
      console.error("Error fetching chat sessions:", error);
      return mapDefaultSessions();
    }

    return (data || []).map(mapConversationToSession);
  } catch (error) {
    console.error("Failed to get chat sessions:", error);
    return mapDefaultSessions();
  }
};

/**
 * Get session by slug
 */
export const getSessionBySlug = async (
  slug: string,
): Promise<ChatSession | null> => {
  try {
    const { data, error } = await supabase
      .from("chat_conversations")
      .select("*")
      .eq("slug", slug)
      .eq("is_active", true)
      .single();

    if (error || !data) {
      // Try to find in default sessions
      const defaultSession = DEFAULT_CHAT_SESSIONS.find((s) => s.slug === slug);
      return defaultSession ? mapDefaultToSession(defaultSession) : null;
    }

    return mapConversationToSession(data);
  } catch (error) {
    console.error("Failed to get chat session:", error);
    return null;
  }
};

/**
 * Get session by ID
 */
export const getSessionById = async (
  id: string,
): Promise<ChatSession | null> => {
  try {
    const { data, error } = await supabase
      .from("chat_conversations")
      .select("*")
      .eq("id", id)
      .eq("is_active", true)
      .single();

    if (error || !data) {
      return null;
    }

    return mapConversationToSession(data);
  } catch (error) {
    console.error("Failed to get chat session:", error);
    return null;
  }
};

/**
 * Get session by location ID
 */
export const getSessionByLocationId = async (
  locationId: string,
): Promise<ChatSession | null> => {
  try {
    const { data, error } = await supabase
      .from("chat_conversations")
      .select("*")
      .eq("conversation_type", "location")
      .eq("is_active", true);

    if (error || !data) {
      // Try to find in default sessions
      const defaultSession = DEFAULT_CHAT_SESSIONS.find(
        (s) => s.metadata?.locationId === locationId,
      );
      return defaultSession ? mapDefaultToSession(defaultSession) : null;
    }

    // Define a type for metadata
    type Metadata = {
      locationId?: string;
      icon?: string;
      isDefault?: boolean;
      [key: string]: unknown;
    };

    // Find session with matching locationId in metadata
    const session = data.find((conv) =>
      (conv.metadata as Metadata)?.locationId === locationId
    );

    return session ? mapConversationToSession(session) : null;
  } catch (error) {
    console.error("Failed to get session by location:", error);
    return null;
  }
};

/**
 * Create or ensure default sessions exist in database
 */
export const ensureDefaultSessions = async (): Promise<void> => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    // Get public user profile
    const { data: publicUser } = await supabase
      .from("users")
      .select("id")
      .eq("auth_id", user.id)
      .single();

    if (!publicUser) return;

    for (const session of DEFAULT_CHAT_SESSIONS) {
      // Check if session exists
      const { data: existing } = await supabase
        .from("chat_conversations")
        .select("id")
        .eq("slug", session.slug!)
        .single();

      if (!existing) {
        // Create the session
        const { error } = await supabase
          .from("chat_conversations")
          .insert({
            slug: session.slug,
            name: session.name,
            description: session.description,
            conversation_type: session.conversation_type,
            metadata: session.metadata || {},
            created_by: publicUser.id,
            is_active: true,
            is_pinned: session.metadata?.isDefault || false,
          });

        if (error) {
          console.error(`Failed to create session ${session.slug}:`, error);
        }
      }
    }
  } catch (error) {
    console.error("Failed to ensure default sessions:", error);
  }
};

/**
 * Join a chat session
 */
export const joinSession = async (sessionId: string): Promise<boolean> => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return false;

    // Get public user profile
    const { data: publicUser } = await supabase
      .from("users")
      .select("id")
      .eq("auth_id", user.id)
      .single();

    if (!publicUser) return false;

    // Check if already a participant
    const { data: existing } = await supabase
      .from("chat_participants")
      .select("id")
      .eq("conversation_id", sessionId)
      .eq("user_id", publicUser.id)
      .single();

    if (existing) {
      // Update to active if was inactive
      await supabase
        .from("chat_participants")
        .update({
          is_active: true,
          joined_at: new Date().toISOString(),
        })
        .eq("id", existing.id);
    } else {
      // Add as participant
      const { error } = await supabase
        .from("chat_participants")
        .insert({
          conversation_id: sessionId,
          user_id: publicUser.id,
          role: "member",
          is_active: true,
        });

      if (error) {
        console.error("Failed to join session:", error);
        return false;
      }
    }

    // Update participant count
    try {
      await supabase.rpc("increment_participant_count", {
        conversation_id: sessionId,
      });
    } catch {
      // Fallback if RPC doesn't exist
      // Fallback: increment participant_count manually
      const { data: conv, error: convError } = await supabase
        .from("chat_conversations")
        .select("participant_count")
        .eq("id", sessionId)
        .single();

      if (!convError && conv) {
        await supabase
          .from("chat_conversations")
          .update({
            participant_count: (conv.participant_count || 0) + 1,
          })
          .eq("id", sessionId);
      }
    }

    return true;
  } catch (error) {
    console.error("Failed to join session:", error);
    return false;
  }
};

// Helper functions

type Metadata = {
  locationId?: string;
  icon?: string;
  isDefault?: boolean;
  [key: string]: unknown;
};

function mapConversationToSession(conv: ChatConversation): ChatSession {
  return {
    id: conv.id,
    slug: conv.slug || conv.id,
    name: conv.name || "Unnamed Chat",
    description: conv.description,
    conversation_type: conv
      .conversation_type as ChatSession["conversation_type"],
    avatar_url: conv.avatar_url,
    metadata: (conv.metadata as Metadata) || {},
    participant_count: conv.participant_count || 0,
    message_count: conv.message_count || 0,
    last_message_at: conv.last_message_at,
    last_message_preview: conv.last_message_preview,
    is_active: conv.is_active || true,
    is_pinned: conv.is_pinned || false,
  };
}

function mapDefaultToSession(
  defaultSession: Partial<ChatSession>,
): ChatSession {
  return {
    id: defaultSession.slug || "",
    slug: defaultSession.slug || "",
    name: defaultSession.name || "",
    description: defaultSession.description || null,
    conversation_type: defaultSession.conversation_type || "group",
    avatar_url: null,
    metadata: defaultSession.metadata || {},
    participant_count: 0,
    message_count: 0,
    last_message_at: null,
    last_message_preview: null,
    is_active: true,
    is_pinned: false,
    ...defaultSession,
  };
}

function mapDefaultSessions(): ChatSession[] {
  return DEFAULT_CHAT_SESSIONS.map(mapDefaultToSession);
}
