import * as React from "react";
import { useDebounce, useInterval, useLocalStorage } from 'usehooks-ts';
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";
import { debugLog } from "@/lib/debug";

interface TypingUser {
  userId: string;
  displayName: string;
  timestamp: number;
}

interface TypingState {
  [userId: string]: TypingUser;
}

export function useEnhancedTyping(conversationId: string) {
  const { currentUser } = useAuth();
  const [typingState, setTypingState] = React.useState<TypingState>({});
  const [isTyping, setIsTyping] = React.useState(false);
  
  // Use usehooks-ts debounce instead of custom implementation
  const debouncedIsTyping = useDebounce(isTyping, 1000);
  
  // Auto-cleanup typing indicators every 3 seconds
  useInterval(() => {
    const now = Date.now();
    setTypingState(prev => {
      const updated = { ...prev };
      let hasChanges = false;
      
      Object.entries(updated).forEach(([userId, user]) => {
        if (now - user.timestamp > 3000) {
          delete updated[userId];
          hasChanges = true;
        }
      });
      
      return hasChanges ? updated : prev;
    });
  }, 1000);

  // Send typing indicator when debounced value changes
  React.useEffect(() => {
    if (currentUser && conversationId) {
      const channel = supabase.channel(`typing-${conversationId}`)
        .on('broadcast', { event: 'typing' }, (payload) => {
          const { userId, displayName, isTyping: typing } = payload.payload;
          
          if (userId !== currentUser.id) {
            setTypingState(prev => {
              if (typing) {
                return {
                  ...prev,
                  [userId]: { userId, displayName, timestamp: Date.now() }
                };
              } else {
                const updated = { ...prev };
                delete updated[userId];
                return updated;
              }
            });
          }
        })
        .subscribe();

      // Broadcast typing state changes
      channel.send({
        type: 'broadcast',
        event: 'typing',
        payload: {
          userId: currentUser.id,
          displayName: currentUser.display_name || 'User',
          isTyping: debouncedIsTyping
        }
      });

      return () => supabase.removeChannel(channel);
    }
  }, [conversationId, currentUser, debouncedIsTyping]);

  const sendTyping = React.useCallback((typing: boolean) => {
    setIsTyping(typing);
  }, []);

  const typingUsers = Object.values(typingState);
  
  return {
    typingUsers,
    typingUserNames: typingUsers.map(u => u.displayName),
    isAnyoneTyping: typingUsers.length > 0,
    sendTyping,
    clearTyping: () => setIsTyping(false)
  };
}