import { Database } from '@/lib/supabase/types';

// Exact database types from your schema
export type ChatMessage = Database['public']['Tables']['chat_messages']['Row'];
export type ChatConversation = Database['public']['Tables']['chat_conversations']['Row'];
export type ChatMessageReaction = Database['public']['Tables']['chat_message_reactions']['Row'];
export type ChatParticipant = Database['public']['Tables']['chat_participants']['Row'];
export type User = Database['public']['Tables']['users']['Row'];

// Extended types for components with proper joins
export interface MessageWithSender extends ChatMessage {
  sender: Pick<User, 'display_name' | 'username' | 'avatar_url'> | null;
  message_reactions: ChatMessageReaction[];
}

export interface ConversationWithParticipants extends ChatConversation {
  participants: Array<{
    user: Pick<User, 'id' | 'display_name' | 'username' | 'avatar_url'>;
  }>;
}

// Component prop interfaces matching your database functions
export interface ChatInputProps {
  conversationId: string;
  onSendMessage: (
    conversationId: string, 
    content: string, 
    messageType?: string, 
    mediaUrl?: string, 
    replyToId?: string
  ) => Promise<void>;
  disabled?: boolean;
  placeholder?: string;
  replyToId?: string;
  className?: string;
}

export interface MessageItemProps {
  message: MessageWithSender;
  currentUserId?: string;
  onReactionAdd?: (messageId: string, reaction: string) => Promise<void>;
  onReactionRemove?: (reactionId: string) => Promise<void>;
  className?: string;
}

export interface ConversationListProps {
  conversations: ConversationWithParticipants[];
  currentUserId: string;
  onStartNewChat?: () => void;
  loading?: boolean;
  className?: string;
}

// Database function parameter types (matching your SQL functions)
export interface SendMessageParams {
  p_conversation_id: string;
  p_content: string;
  p_message_type?: string;
  p_media_url?: string;
  p_reply_to_id?: string;
}

export interface GetConversationMessagesParams {
  p_conversation_id: string;
  p_limit?: number;
  p_before_message_id?: string;
}

export interface GetOrCreateDMParams {
  other_user_id: string;
}

// Chat component exports
export { ChatInput } from '../components/wolfpack/shared/ChatInput';
export { MessageItem } from '../components/wolfpack/shared/MessageItem';  
export { ConversationList } from '../components/ConversationList';