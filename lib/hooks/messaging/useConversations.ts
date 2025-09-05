// Conversation operations
import { useCallback } from 'react';
import { getSupabaseBrowserClient } from '@/lib/supabase';
import { success, error as logError } from '@/lib/debug';
import { messageHandlerService } from '@/lib/edge-functions/services/message-handler.service';
import { useAuth } from '@/contexts/AuthContext';
import type { MessagingCore } from './useMessagingCore';

export function useConversations(core: MessagingCore) {
  const { currentUser } = useAuth();
  const supabase = getSupabaseBrowserClient();

  const loadConversations = useCallback(async () => {
    console.log('🔥 loadConversations called, currentUserId:', currentUser?.id);
    if (!currentUser?.id) return;
    
    core.setLoading(true);
    core.setError(null);

    try {
      const response = await messageHandlerService.getConversations({});
      
      if (!response?.success) {
        throw new Error(response?.error || 'Failed to load conversations');
      }

      core.setConversations(response.conversations || []);
      success("loadConversations", { count: response.conversations?.length });
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to load conversations';
      logError("loadConversations", err);
      core.setError(errorMsg);
    } finally {
      core.setLoading(false);
    }
  }, [currentUser?.id, core.setLoading, core.setError, core.setConversations, supabase]);

  const getOrCreateDirectConversation = useCallback(async (otherUserId: string) => {
    if (!currentUser?.id) return null;

    try {
      const { data, error } = await supabase.rpc('rpc_get_or_create_direct_conversation', {
        p_other_user_id: otherUserId
      });

      if (error) throw error;
      
      const response = data as any;
      if (!response?.success) {
        throw new Error(response?.error || 'Failed to create conversation');
      }
      
      success("getOrCreateDirectConversation", { conversationId: response.conversation_id });
      return response.conversation_id || null;
    } catch (err) {
      logError("getOrCreateDirectConversation", err);
      core.setError("Failed to create conversation");
      return null;
    }
  }, [currentUser?.id, core.setError, supabase]);

  const archiveConversation = useCallback(async (conversationId: string) => {
    try {
      const { error } = await supabase
        .from('chat_conversations')
        .update({ is_archived: true })
        .eq('id', conversationId);

      if (error) throw error;
      
      await loadConversations();
      return true;
    } catch (err) {
      logError("archiveConversation", err);
      return false;
    }
  }, [supabase, loadConversations]);

  const createGroupConversation = useCallback(async () => {
    console.warn("createGroupConversation: Not implemented yet");
    return null;
  }, []);

  const updateConversation = useCallback(async () => {
    console.warn("updateConversation: Not implemented yet");
    return false;
  }, []);

  const leaveConversation = useCallback(async () => {
    console.warn("leaveConversation: Not implemented yet");
    return false;
  }, []);

  return {
    loadConversations,
    getOrCreateDirectConversation,
    archiveConversation,
    createGroupConversation,
    updateConversation,
    leaveConversation,
  };
}