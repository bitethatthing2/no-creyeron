import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

export function useWolfpackSession(user: any, locationName: string) {
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [locationId, setLocationId] = useState<string | null>(null);
  const [isActive, setIsActive] = useState(false);

  useEffect(() => {
    if (!user || !locationName) return;

    const initSession = async () => {
      try {
        // Get or create session for this user/location
        const { data, error } = await supabase
          .from('wolfpack_chat_sessions')
          .select('id')
          .eq('user_id', user.id)
          .eq('location_name', locationName)
          .eq('is_active', true)
          .single();

        if (data) {
          setSessionId(data.id);
          setIsActive(true);
        } else if (error?.code === 'PGRST116') {
          // No session exists, create one
          const { data: newSession, error: createError } = await supabase
            .from('wolfpack_chat_sessions')
            .insert({
              user_id: user.id,
              location_name: locationName,
              is_active: true
            })
            .select('id')
            .single();

          if (newSession && !createError) {
            setSessionId(newSession.id);
            setIsActive(true);
          }
        }
      } catch (err) {
        console.error('Error initializing session:', err);
      }
    };

    initSession();
  }, [user, locationName]);

  return { sessionId, locationId, isActive };
}

export function useWolfpack(sessionId: string, locationId: string, options: any) {
  const [state, setState] = useState({
    members: [],
    messages: [],
    isConnected: false
  });

  useEffect(() => {
    if (!sessionId) return;

    const loadMessages = async () => {
      try {
        const { data, error } = await supabase
          .from('wolfpack_chat_messages')
          .select(`
            id,
            content,
            created_at,
            user_id,
            users (display_name, avatar_url)
          `)
          .eq('session_id', sessionId)
          .order('created_at', { ascending: false })
          .limit(50);

        if (data && !error) {
          setState(prev => ({
            ...prev,
            messages: data.reverse(),
            isConnected: true
          }));
        }
      } catch (err) {
        console.error('Error loading messages:', err);
      }
    };

    loadMessages();
  }, [sessionId]);

  const actions = {
    sendMessage: async (message: string) => {
      if (!sessionId) return { success: false };

      try {
        const { error } = await supabase
          .from('wolfpack_chat_messages')
          .insert({
            session_id: sessionId,
            content: message
          });

        return { success: !error };
      } catch (err) {
        console.error('Error sending message:', err);
        return { success: false };
      }
    },
    addReaction: async (messageId: string, emoji: string) => {
      // Implementation would depend on your reactions table structure
      return { success: true };
    },
    removeReaction: async (reactionId: string) => {
      // Implementation would depend on your reactions table structure
      return { success: true };
    }
  };

  return { state, actions };
}

export function useTypingIndicators(sessionId: string) {
  const [typingUsers, setTypingUsers] = useState<string[]>([]);

  const sendTyping = (userId: string, userName: string, isTyping: boolean) => {
    // This would typically use Supabase realtime to broadcast typing status
    console.log('Typing status:', userName, isTyping);
  };

  return { typingUsers, sendTyping };
}