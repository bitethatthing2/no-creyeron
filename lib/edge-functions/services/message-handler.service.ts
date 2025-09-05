import { getSupabaseBrowserClient } from '@/lib/supabase';

class MessageHandlerService {
  private supabase = getSupabaseBrowserClient();
  private baseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL + '/functions/v1/MESSAGE_HANDLER';

  async request(endpoint: string, data: any) {
    const { data: { session } } = await this.supabase.auth.getSession();
    
    const response = await fetch(`${this.baseUrl}/${endpoint}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session?.access_token}`,
      },
      body: JSON.stringify(data),
    });

    return response.json();
  }

  // Core messaging functions
  async sendMessage(params: {
    conversation_id: string;
    content: string;
    message_type?: string;
    media_url?: string;
    media_type?: string;
    media_duration?: number;
    media_size?: number;
    media_thumbnail_url?: string;
    reply_to_id?: string;
    attachments?: any[];
  }) {
    return this.request('send', params);
  }

  async getConversations(params: {
    limit?: number;
    offset?: number;
  } = {}) {
    return this.request('get-conversations', params);
  }

  async getMessages(params: {
    conversation_id: string;
    limit?: number;
    offset?: number;
    before_message_id?: string;
  }) {
    return this.request('get-messages', params);
  }

  async createDirectConversation(params: {
    other_user_id: string;
  }) {
    return this.request('create-dm', params);
  }

  async markConversationAsRead(conversationId: string, messageIds?: string[]) {
    return this.request('mark-read', { 
      conversation_id: conversationId,
      message_ids: messageIds
    });
  }

  async markMessageAsRead(messageId: string) {
    return this.request('mark-read', { 
      message_ids: [messageId]
    });
  }

  async addReaction(messageId: string, reaction: string) {
    return this.request('add-reaction', { 
      message_id: messageId, 
      reaction 
    });
  }

  async setTypingStatus(conversationId: string, isTyping: boolean) {
    return this.request('typing', {
      conversation_id: conversationId,
      is_typing: isTyping
    });
  }
}

export const messageHandlerService = new MessageHandlerService();