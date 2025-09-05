// Message operations
import { useCallback } from 'react';
import { getSupabaseBrowserClient } from '@/lib/supabase';
import { success, error as logError } from '@/lib/debug';
import { messageHandlerService } from '@/lib/edge-functions/services/message-handler.service';
import { useAuth } from '@/contexts/AuthContext';
// Removed notificationService import - notifications handled by edge function
import type { MessagingCore } from './useMessagingCore';

export enum MessageType {
  TEXT = "text",
  IMAGE = "image",
  SYSTEM = "system",
  DELETED = "deleted"
}

export enum MediaType {
  IMAGE = "image",
  VIDEO = "video",
  AUDIO = "audio",
  FILE = "file",
  GIF = "gif"
}

export function useMessages(core: MessagingCore) {
  const { currentUser } = useAuth();
  const supabase = getSupabaseBrowserClient();

  const loadMessages = useCallback(async (
    conversationId: string,
    limit = 50,
    before?: string
  ) => {
    core.setLoading(true);
    core.setError(null);

    try {
      const response = await messageHandlerService.getMessages({
        conversation_id: conversationId,
        limit: limit,
        before_message_id: before || undefined
      });
      
      if (!response?.success) {
        throw new Error(response?.error || 'Failed to load messages');
      }

      core.setMessages(response.messages || []);
      success("loadMessages", { count: response.messages?.length });
    } catch (err) {
      logError("loadMessages", err);
      core.setError("Failed to load messages");
    } finally {
      core.setLoading(false);
    }
  }, [core.setLoading, core.setError, core.setMessages, supabase]);

  const sendMessage = useCallback(async (
    conversationId: string,
    content: string,
    messageType = MessageType.TEXT,
    mediaUrl?: string,
    mediaType?: MediaType
  ) => {
    console.log('🔥 sendMessage called:', { conversationId, content, currentUserId: currentUser?.id });
    if (!currentUser?.id || !content.trim()) {
      console.log('🔥 sendMessage early return - no user or content');
      return false;
    }

    try {
      console.log('🔥 Calling MESSAGE_HANDLER edge function...');
      const response = await messageHandlerService.sendMessage({
        conversation_id: conversationId,
        content: content.trim(),
        message_type: messageType.toLowerCase(),
        media_url: mediaUrl || undefined,
        media_type: mediaType?.toLowerCase() || undefined
      });

      console.log('🔥 Edge function response:', response);

      if (!response?.success) {
        throw new Error(response?.error || 'Failed to send message');
      }

      success("sendMessage", { conversationId });
      
      console.log('🔥 Message sent successfully via edge function (notifications handled server-side)');
      
      // ✅ CONFIRMED: MESSAGE_HANDLER edge function creates notifications automatically
      
      // Reload messages to show the new one
      await loadMessages(conversationId);
      return true;
    } catch (err) {
      logError("sendMessage", err);
      core.setError("Failed to send message");
      return false;
    }
  }, [currentUser?.id, core.setError, supabase, loadMessages]);

  const markMessageAsRead = useCallback(async (messageId: string) => {
    if (!currentUser?.id) return false;

    try {
      const { error } = await supabase
        .from('chat_message_receipts')
        .upsert({
          message_id: messageId,
          user_id: currentUser.id,
          read_at: new Date().toISOString()
        }, {
          onConflict: 'message_id,user_id'
        });
      
      return !error;
    } catch (err) {
      logError("markMessageAsRead", err);
      return false;
    }
  }, [currentUser?.id, supabase]);

  const markConversationAsRead = useCallback(async (conversationId: string) => {
    if (!currentUser?.id) return false;

    try {
      const { error } = await supabase
        .from('chat_participants')
        .update({
          last_read_at: new Date().toISOString()
        })
        .eq('conversation_id', conversationId)
        .eq('user_id', currentUser.id);
      
      return !error;
    } catch (err) {
      logError("markConversationAsRead", err);
      return false;
    }
  }, [currentUser?.id, supabase]);

  const editMessage = useCallback(async () => {
    console.warn("editMessage: Not implemented yet");
    return false;
  }, []);

  const deleteMessage = useCallback(async () => {
    console.warn("deleteMessage: Not implemented yet");
    return false;
  }, []);

  const addReaction = useCallback(async (messageId: string, reaction: string) => {
    if (!currentUser?.id) return false;

    try {
      const { error } = await supabase
        .from('chat_message_reactions')
        .insert({
          message_id: messageId,
          user_id: currentUser.id,
          reaction
        });
      
      return !error;
    } catch (err) {
      logError("addReaction", err);
      return false;
    }
  }, [currentUser?.id, supabase]);

  const removeReaction = useCallback(async () => {
    console.warn("removeReaction: Not implemented yet");
    return false;
  }, []);

  return {
    loadMessages,
    sendMessage,
    markMessageAsRead,
    markConversationAsRead,
    editMessage,
    deleteMessage,
    addReaction,
    removeReaction,
  };
}