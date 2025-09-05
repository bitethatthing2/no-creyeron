// Main messaging hook that combines all modules
import { useMessagingCore } from './useMessagingCore';
import { useConversations } from './useConversations';
import { useMessages } from './useMessages';
// import { useMessagingRealtime } from './useMessagingRealtime'; // Temporarily commented out
import { useAuth } from '@/contexts/AuthContext';
import { useCallback, useState } from 'react';
import type { ParticipantRole } from '@/types/chat';

export { MessageType, MediaType } from './useMessages';

// Notification settings structure
interface NotificationSettings {
  muted?: boolean;
  sound?: string;
  vibrate?: boolean;
  [key: string]: unknown;
}

export function useMessaging(conversationId?: string) {
  const { currentUser } = useAuth();
  const core = useMessagingCore();
  const conversations = useConversations(core);
  const messages = useMessages(core);
  
  // Wire up realtime for the current conversation
  const handleNewMessage = useCallback(() => {
    // This will be called when new messages arrive
    // Components can pass their own reload function
    if (conversationId) {
      messages.loadMessages(conversationId);
    }
  }, [messages, conversationId]);

  // const realtime = useMessagingRealtime({
  //   conversationId,
  //   onNewMessage: handleNewMessage
  // }); // Temporarily commented out

  // Stub implementations for unimplemented features
  const addParticipants = useCallback(async () => {
    console.warn("addParticipants: Not implemented yet");
    return false;
  }, []);

  const removeParticipant = useCallback(async () => {
    console.warn("removeParticipant: Not implemented yet");
    return false;
  }, []);

  const updateParticipantRole = useCallback(async () => {
    console.warn("updateParticipantRole: Not implemented yet");
    return false;
  }, []);

  const getNotificationSettings = useCallback(async () => {
    console.warn("getNotificationSettings: Not implemented yet");
    return null;
  }, []);

  const updateNotificationSettings = useCallback(async () => {
    console.warn("updateNotificationSettings: Not implemented yet");
    return false;
  }, []);

  // const {
  //   subscribeToMessages
  // } = realtime; // Temporarily commented out
  const subscribeToMessages = useCallback(() => {}, []); // Stub function
  
  // Add subscribeToConversation stub
  const subscribeToConversation = useCallback((conversationId: string) => {
    console.log('Subscribing to conversation:', conversationId);
    // Return a no-op unsubscribe function
    return () => {
      console.log('Unsubscribing from conversation:', conversationId);
    };
  }, []);

  return {
    // Core state
    conversations: core.conversations,
    messages: core.messages,
    loading: core.loading,
    error: core.error,
    currentUserId: currentUser?.id || null,
    
    // Conversation operations
    loadConversations: conversations.loadConversations,
    getOrCreateDirectConversation: conversations.getOrCreateDirectConversation,
    archiveConversation: conversations.archiveConversation,
    createGroupConversation: conversations.createGroupConversation,
    updateConversation: conversations.updateConversation,
    leaveConversation: conversations.leaveConversation,
    
    // Message operations
    loadMessages: messages.loadMessages,
    sendMessage: messages.sendMessage,
    markMessageAsRead: messages.markMessageAsRead,
    markConversationAsRead: messages.markConversationAsRead,
    editMessage: messages.editMessage,
    deleteMessage: messages.deleteMessage,
    addReaction: messages.addReaction,
    removeReaction: messages.removeReaction,
    
    // Realtime features
    subscribeToMessages,
    subscribeToConversation,
    
    // Participant actions (stubs)
    addParticipants,
    removeParticipant,
    updateParticipantRole,
    
    // Notification actions (stubs)
    getNotificationSettings,
    updateNotificationSettings,
  };
}