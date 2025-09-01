"use client";

import * as React from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";
import { debugLog, performanceLog } from "@/lib/debug";
import { RealtimeChannel } from "@supabase/supabase-js";

// Type definitions for typing indicators
interface TypingUser {
  userId: string;
  displayName: string;
  username?: string;
  avatarUrl?: string;
  timestamp: number;
}

interface TypingState {
  [userId: string]: TypingUser;
}

interface UseTypingIndicatorsReturn {
  typingUsers: TypingUser[];
  typingUserNames: string[];
  isAnyoneTyping: boolean;
  sendTyping: (isTyping: boolean) => void;
  clearTyping: () => void;
}

// Constants
const TYPING_TIMEOUT_MS = 3000; // Remove typing indicator after 3 seconds
const TYPING_DEBOUNCE_MS = 1000; // Debounce typing updates to reduce network calls

/**
 * Hook for managing typing indicators in chat conversations
 * Uses Supabase broadcast channels for real-time typing state
 */
export function useTypingIndicators(
  conversationId: string,
  options?: {
    timeoutMs?: number;
    debounceMs?: number;
    excludeSelf?: boolean;
  },
): UseTypingIndicatorsReturn {
  const { currentUser } = useAuth();
  const [typingState, setTypingState] = React.useState<TypingState>({});

  // Configuration
  const timeoutMs = options?.timeoutMs ?? TYPING_TIMEOUT_MS;
  const debounceMs = options?.debounceMs ?? TYPING_DEBOUNCE_MS;
  const excludeSelf = options?.excludeSelf ?? true;

  // Refs for managing timeouts and channel
  const typingTimeoutRef = React.useRef<Map<string, NodeJS.Timeout>>(new Map());
  const channelRef = React.useRef<RealtimeChannel | null>(null);
  const lastTypingSentRef = React.useRef<number>(0);
  const typingDebounceRef = React.useRef<NodeJS.Timeout | null>(null);
  const isTypingRef = React.useRef<boolean>(false);

  // Computed values
  const typingUsers = React.useMemo(() => {
    const users = Object.values(typingState);
    if (excludeSelf && currentUser?.id) {
      return users.filter((user) => user.userId !== currentUser.id);
    }
    return users;
  }, [typingState, currentUser?.id, excludeSelf]);

  const typingUserNames = React.useMemo(() => {
    return typingUsers.map((user) =>
      user.displayName || user.username || "Someone"
    );
  }, [typingUsers]);

  const isAnyoneTyping = typingUsers.length > 0;

  // Clear typing timeout for a specific user
  const clearUserTypingTimeout = React.useCallback((userId: string) => {
    const timeout = typingTimeoutRef.current.get(userId);
    if (timeout) {
      clearTimeout(timeout);
      typingTimeoutRef.current.delete(userId);
    }
  }, []);

  // Remove user from typing state
  const removeUserFromTyping = React.useCallback((userId: string) => {
    clearUserTypingTimeout(userId);
    setTypingState((prev) => {
      const newState = { ...prev };
      delete newState[userId];
      return newState;
    });
    debugLog.messaging("User stopped typing", { conversationId });
  }, [conversationId, clearUserTypingTimeout]);

  // Add or update user in typing state
  const addUserToTyping = React.useCallback((user: TypingUser) => {
    // Clear existing timeout
    clearUserTypingTimeout(user.userId);

    // Update state
    setTypingState((prev) => ({
      ...prev,
      [user.userId]: user,
    }));

    // Set new timeout to remove user after inactivity
    const timeout = setTimeout(() => {
      removeUserFromTyping(user.userId);
    }, timeoutMs);

    typingTimeoutRef.current.set(user.userId, timeout);
    debugLog.messaging("User started typing", {
      conversationId,
    });
  }, [conversationId, timeoutMs, clearUserTypingTimeout, removeUserFromTyping]);

  // Internal function to actually send the typing indicator
  const sendTypingIndicator = React.useCallback((isTyping: boolean) => {
    if (!channelRef.current || !currentUser?.id) return;

    const payload: TypingUser = {
      userId: currentUser.id,
      displayName: currentUser.displayName ||
        `${currentUser.firstName || ""} ${currentUser.lastName || ""}`
          .trim() ||
        currentUser.username ||
        "User",
      username: currentUser.username || undefined,
      avatarUrl: currentUser.avatarUrl || undefined,
      timestamp: Date.now(),
    };

    channelRef.current.send({
      type: "broadcast",
      event: "typing",
      payload: {
        ...payload,
        isTyping,
      },
    }).then(() => {
      lastTypingSentRef.current = Date.now();
      debugLog.success("Sent typing indicator", { isTyping, conversationId });
    }).catch((error) => {
      debugLog.error("Failed to send typing indicator", error, {});
    });
  }, [currentUser, conversationId]);

  // Send typing indicator
  const sendTyping = React.useCallback((isTyping: boolean) => {
    if (!channelRef.current || !conversationId || !currentUser?.id) {
      debugLog.error(
        "Cannot send typing indicator",
        new Error("Cannot send typing indicator"),
        {
          userId: currentUser?.id,
        },
      );
      return;
    }

    // Store typing state
    isTypingRef.current = isTyping;

    // Clear any pending debounce
    if (typingDebounceRef.current) {
      clearTimeout(typingDebounceRef.current);
      typingDebounceRef.current = null;
    }

    if (isTyping) {
      // Debounce typing indicators to reduce network traffic
      const now = Date.now();
      const timeSinceLastSent = now - lastTypingSentRef.current;

      if (timeSinceLastSent < debounceMs) {
        // Debounce the typing indicator
        typingDebounceRef.current = setTimeout(() => {
          if (isTypingRef.current) {
            sendTypingIndicator(true);
          }
        }, debounceMs - timeSinceLastSent);
      } else {
        // Send immediately
        sendTypingIndicator(true);
      }
    } else {
      // Always send stop typing immediately
      sendTypingIndicator(false);
    }
  }, [conversationId, currentUser, debounceMs, sendTypingIndicator]);

  // Clear typing state for current user
  const clearTyping = React.useCallback(() => {
    if (typingDebounceRef.current) {
      clearTimeout(typingDebounceRef.current);
      typingDebounceRef.current = null;
    }
    isTypingRef.current = false;
    sendTyping(false);
  }, [sendTyping]);

  // Set up broadcast channel
  React.useEffect(() => {
    if (!conversationId) {
      debugLog.error(
        "No conversation ID provided for typing indicators",
        new Error("No conversation ID"),
        {},
      );
      return;
    }

    // Copy ref value to local variable to avoid stale closure issues in cleanup
    const initialTimeouts = new Map(typingTimeoutRef.current);

    const startTime = performanceLog.start("setupTypingChannel");

    // Clean up existing channel
    if (channelRef.current) {
      supabase.removeChannel(channelRef.current);
      channelRef.current = null;
    }

    // Create a new channel for this conversation
    const channel = supabase.channel(`typing:${conversationId}`, {
      config: {
        broadcast: {
          self: !excludeSelf, // Whether to receive own typing events
          ack: true, // Request acknowledgment of sent messages
        },
      },
    });

    // Listen for typing events
    channel.on(
      "broadcast",
      { event: "typing" },
      (payload: { payload: TypingUser & { isTyping: boolean } }) => {
        const {
          userId,
          displayName,
          username,
          avatarUrl,
          isTyping,
          timestamp,
        } = payload.payload;

        if (isTyping) {
          addUserToTyping({
            userId,
            displayName,
            username,
            avatarUrl,
            timestamp,
          });
        } else {
          removeUserFromTyping(userId);
        }
      },
    );

    // Subscribe to the channel
    channel.subscribe((status) => {
      if (status === "SUBSCRIBED") {
        debugLog.success("Connected to typing indicators", { conversationId });
        performanceLog.end("setupTypingChannel", startTime);
      } else if (status === "CHANNEL_ERROR") {
        debugLog.error(
          "Failed to connect to typing indicators",
          new Error("Channel subscription failed"),
          {},
        );
      } else if (status === "TIMED_OUT") {
        debugLog.error(
          "Typing indicator channel timed out",
          new Error("Channel timed out"),
          {},
        );
      }
    });

    channelRef.current = channel;

    // Cleanup function
    return () => {
      // Use the local copy of timeouts to avoid stale closure issues
      initialTimeouts.forEach((timeout) => clearTimeout(timeout));
      initialTimeouts.clear();

      // Clear debounce timeout
      if (typingDebounceRef.current) {
        clearTimeout(typingDebounceRef.current);
        typingDebounceRef.current = null;
      }

      // Send stop typing if we were typing
      if (isTypingRef.current && currentUser?.id) {
        // Direct send without using sendTypingIndicator to avoid dependency issues
        if (channelRef.current) {
          channelRef.current.send({
            type: "broadcast",
            event: "typing",
            payload: {
              userId: currentUser.id,
              displayName: currentUser.displayName || "User",
              isTyping: false,
              timestamp: Date.now(),
            },
          });
        }
      }

      // Unsubscribe from channel
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }

      // Clear state
      setTypingState({});

      debugLog.messaging("Cleaned up typing indicators", { conversationId });
    };
  }, [
    conversationId,
    excludeSelf,
    addUserToTyping,
    removeUserFromTyping,
    currentUser?.id,
    currentUser?.displayName,
  ]);

  // Auto-clear typing on unmount
  React.useEffect(() => {
    return () => {
      if (isTypingRef.current) {
        clearTyping();
      }
    };
  }, [clearTyping]);

  return {
    typingUsers,
    typingUserNames,
    isAnyoneTyping,
    sendTyping,
    clearTyping,
  };
}

/**
 * Hook for managing typing indicators with automatic detection
 * Monitors input changes and automatically sends typing indicators
 */
export function useAutoTypingIndicator(
  conversationId: string,
  inputValue: string,
  options?: Parameters<typeof useTypingIndicators>[1] & {
    enabled?: boolean;
  },
): UseTypingIndicatorsReturn {
  const typingIndicators = useTypingIndicators(conversationId, options);
  const { sendTyping } = typingIndicators;

  const enabled = options?.enabled ?? true;
  const previousValueRef = React.useRef(inputValue);
  const typingTimeoutRef = React.useRef<NodeJS.Timeout | null>(null);

  React.useEffect(() => {
    if (!enabled) return;

    // Check if user is typing
    const isTyping = inputValue.length > 0 &&
      inputValue !== previousValueRef.current;
    previousValueRef.current = inputValue;

    if (isTyping) {
      // Send typing indicator
      sendTyping(true);

      // Clear existing timeout
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }

      // Set timeout to stop typing
      typingTimeoutRef.current = setTimeout(() => {
        sendTyping(false);
        typingTimeoutRef.current = null;
      }, TYPING_TIMEOUT_MS);
    } else if (inputValue.length === 0 && typingTimeoutRef.current) {
      // User cleared the input
      clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = null;
      sendTyping(false);
    }

    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
        typingTimeoutRef.current = null;
      }
    };
  }, [inputValue, enabled, sendTyping]);

  return typingIndicators;
}
