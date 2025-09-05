// Core state management and configuration
import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import type { ConversationWithParticipants, MessageWithSender } from '@/types/chat';

export interface MessagingCore {
  // State
  conversations: ConversationWithParticipants[];
  messages: MessageWithSender[];
  loading: boolean;
  error: string | null;
  
  // Setters
  setConversations: (conversations: ConversationWithParticipants[]) => void;
  setMessages: (messages: MessageWithSender[]) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
}

export function useMessagingCore(): MessagingCore {
  const [conversations, setConversations] = useState<ConversationWithParticipants[]>([]);
  const [messages, setMessages] = useState<MessageWithSender[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  return {
    conversations,
    messages,
    loading,
    error,
    setConversations,
    setMessages,
    setLoading,
    setError
  };
}