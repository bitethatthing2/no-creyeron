// Real-time message subscriptions only
// For typing indicators, use useTypingIndicators hook instead
import { useEffect, useRef, useCallback } from 'react';
import { getSupabaseBrowserClient } from '@/lib/supabase';
import { RealtimeChannel } from '@supabase/supabase-js';

interface RealtimeOptions {
  conversationId?: string;
  onNewMessage?: () => void;
}

export function useMessagingRealtime({
  conversationId,
  onNewMessage
}: RealtimeOptions) {
  const supabase = getSupabaseBrowserClient();
  const channelRef = useRef<RealtimeChannel | null>(null);

  useEffect(() => {
    if (!conversationId) return;

    // Clean up previous subscription
    if (channelRef.current) {
      supabase.removeChannel(channelRef.current);
    }

    // Subscribe to new messages
    const channel = supabase
      .channel(`messages:${conversationId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'chat_messages',
          filter: `conversation_id=eq.${conversationId}`
        },
        () => {
          onNewMessage?.();
        }
      )
      .subscribe();

    channelRef.current = channel;

    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
      }
    };
  }, [conversationId, onNewMessage, supabase]);

  const subscribeToMessages = useCallback((convId: string, onMessage?: () => void) => {
    // Clean up any existing subscription
    if (channelRef.current) {
      supabase.removeChannel(channelRef.current);
    }

    const channel = supabase
      .channel(`messages:${convId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'chat_messages',
          filter: `conversation_id=eq.${convId}`
        },
        () => {
          onMessage?.();
        }
      )
      .subscribe();

    channelRef.current = channel;

    return () => {
      supabase.removeChannel(channel);
      if (channelRef.current === channel) {
        channelRef.current = null;
      }
    };
  }, [supabase]);

  return {
    subscribeToMessages
  };
}