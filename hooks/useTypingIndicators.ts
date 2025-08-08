// File: hooks/useTypingIndicators.ts
import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/lib/supabase';

interface TypingUser {
  userId: string;
  displayName: string;
  isTyping: boolean;
  timestamp: number;
}

export function useTypingIndicators(sessionId: string) {
  const [typingUsers, setTypingUsers] = useState<string[]>([]);
  const typingTimeoutRef = useRef<Map<string, NodeJS.Timeout>>(new Map());
  const channelRef = useRef<any>(null);

  useEffect(() => {
    if (!sessionId) return;

    // Create a channel for typing indicators
    const channel = supabase.channel(`typing_${sessionId}`, {
      config: {
        broadcast: { self: true },
      },
    });

    // Listen for typing events
    channel.on('broadcast', { event: 'typing' }, (payload: { payload: TypingUser }) => {
      const { userId, displayName, isTyping } = payload.payload;
      
      // Clear existing timeout for this user
      const existingTimeout = typingTimeoutRef.current.get(userId);
      if (existingTimeout) {
        clearTimeout(existingTimeout);
        typingTimeoutRef.current.delete(userId);
      }

      if (isTyping) {
        // Add user to typing list
        setTypingUsers(prev => {
          if (!prev.includes(displayName)) {
            return [...prev, displayName];
          }
          return prev;
        });

        // Set timeout to remove user after 3 seconds of inactivity
        const timeout = setTimeout(() => {
          setTypingUsers(prev => prev.filter(name => name !== displayName));
          typingTimeoutRef.current.delete(userId);
        }, 3000);

        typingTimeoutRef.current.set(userId, timeout);
      } else {
        // Remove user from typing list immediately
        setTypingUsers(prev => prev.filter(name => name !== displayName));
      }
    });

    // Subscribe to the channel
    channel.subscribe((status) => {
      if (status === 'SUBSCRIBED') {
        console.log('Connected to typing indicators channel');
      }
    });

    channelRef.current = channel;

    return () => {
      // Clean up timeouts
      typingTimeoutRef.current.forEach(timeout => clearTimeout(timeout));
      typingTimeoutRef.current.clear();
      
      // Unsubscribe from channel
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
      }
    };
  }, [sessionId]);

  const sendTyping = (userId: string, displayName: string, isTyping: boolean) => {
    if (!channelRef.current || !sessionId) return;

    channelRef.current.send({
      type: 'broadcast',
      event: 'typing',
      payload: {
        userId,
        displayName,
        isTyping,
        timestamp: Date.now(),
      },
    });
  };

  return {
    typingUsers,
    sendTyping,
  };
}