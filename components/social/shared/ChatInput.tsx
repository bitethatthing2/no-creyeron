'use client';

import { useState, useEffect, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useMessaging } from '@/lib/hooks/useMessaging';
import { ArrowLeft, Send, MoreVertical } from 'lucide-react';
import Image from 'next/image';
import { ConnectionStatus } from '@/components/shared/ConnectionStatus';
import { debugLog } from '@/lib/debug';
import { supabase } from '@/lib/supabase';

// TypeScript interfaces aligned with database schema

interface ChatConversation {
  id: string;
  conversation_type: string;
  name?: string;
  description?: string;
  avatar_url?: string;
  created_by?: string;
  last_message_at?: string;
  last_message_preview?: string;
  last_message_sender_id?: string;
  participant_count?: number;
  message_count?: number;
  is_archived?: boolean;
  is_pinned?: boolean;
  is_active?: boolean;
  settings?: Record<string, unknown>;
  metadata?: Record<string, unknown>;
}

interface ChatParticipant {
  id: string;
  user_id: string;
  conversation_id: string;
  role?: string;
  joined_at?: string;
  left_at?: string;
  last_read_at?: string;
  is_active?: boolean;
  notification_settings?: Record<string, unknown>;
  // Joined user data
  user?: {
    id: string;
    display_name?: string;
    first_name?: string;
    last_name?: string;
    username?: string;
    avatar_url?: string;
    profile_image_url?: string;
  };
}

interface ConversationData {
  conversation: ChatConversation;
  participants: ChatParticipant[];
}

export default function ConversationPage() {
  const params = useParams();
  const router = useRouter();
  const conversationId = params.conversationId as string;
  
  // Use our unified messaging hook
  const { 
    messages, 
    currentUserId,
    loading, 
    error, 
    loadMessages, 
    sendMessage,
    subscribeToConversation 
  } = useMessaging();
  
  const [newMessage, setNewMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [conversationData, setConversationData] = useState<ConversationData | null>(null);
  const [loadingConversation, setLoadingConversation] = useState(true);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Load conversation data and messages
  useEffect(() => {
    if (conversationId) {
      debugLog.messaging('ConversationPage mount', { conversationId });
      loadMessages(conversationId);
      loadConversationData(conversationId);
      
      // Subscribe to real-time updates
      const unsubscribe = subscribeToConversation(conversationId);
      
      return () => {
        debugLog.messaging('ConversationPage unmount', { conversationId });
        unsubscribe();
      };
    }
  }, [conversationId, loadMessages, subscribeToConversation]);

  const loadConversationData = async (convId: string) => {
    try {
      setLoadingConversation(true);
      
      // Load conversation details with participants
      const { data: conversationData, error: convError } = await supabase
        .from('chat_conversations')
        .select(`
          *,
          chat_participants(
            *,
            user:users(
              id,
              display_name,
              first_name,
              last_name,
              username,
              avatar_url,
              profile_image_url
            )
          )
        `)
        .eq('id', convId)
        .single();

      if (convError) throw convError;

      if (conversationData) {
        setConversationData({
          conversation: conversationData,
          participants: conversationData.chat_participants || []
        });
      }
    } catch (error) {
      console.error('Error loading conversation data:', error);
    } finally {
      setLoadingConversation(false);
    }
  };

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async () => {
    if (!newMessage.trim() || sending) return;

    const messageText = newMessage.trim();
    setNewMessage(''); // Clear input immediately for better UX
    setSending(true);

    try {
      // Use the sendMessage function from the hook
      const success = await sendMessage(conversationId, messageText);
      
      if (success) {
        inputRef.current?.focus();
      } else {
        // If the hook's sendMessage fails, try direct approach
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error('Not authenticated');

        // Direct insert as fallback
        const { error: insertError } = await supabase
          .from('chat_messages')
          .insert({
            conversation_id: conversationId,
            sender_id: user.id,
            content: messageText,
            message_type: 'text'
          });

        if (insertError) throw insertError;
        
        inputRef.current?.focus();
      }
    } catch (error) {
      console.error('Error sending message:', error);
      setNewMessage(messageText); // Restore message on error
    } finally {
      setSending(false);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const getDisplayName = () => {
    if (!conversationData?.conversation) return 'Loading...';
    
    const { conversation, participants } = conversationData;
    
    // For direct conversations, show the other participant's name
    if (conversation.conversation_type === 'direct' && participants.length > 0) {
      // Find the other participant (not the current user)
      const otherParticipant = participants.find(p => p.user_id !== currentUserId);
      
      if (otherParticipant?.user) {
        const user = otherParticipant.user;
        const fullName = `${user.first_name || ''} ${user.last_name || ''}`.trim();
        
        return user.display_name || 
               fullName ||
               user.username ||
               'Wolf Pack Member';
      }
    }
    
    // For group conversations
    if (conversation.conversation_type === 'group') {
      return conversation.name || 'Wolf Pack Group';
    }
    
    // Default fallback
    return conversation.name || 'Wolf Pack Chat';
  };

  const getAvatarUrl = () => {
    if (!conversationData) return 'https://tvnpgbjypnezoasbhbwx.supabase.co/storage/v1/object/public/icons/wolf-512x512.png';
    
    const { conversation, participants } = conversationData;
    
    // For direct conversations, use the other participant's avatar
    if (conversation.conversation_type === 'direct' && participants.length > 0) {
      const otherParticipant = participants.find(p => p.user_id !== currentUserId);
      if (otherParticipant?.user) {
        return otherParticipant.user.avatar_url || 
               otherParticipant.user.profile_image_url || 
               'https://tvnpgbjypnezoasbhbwx.supabase.co/storage/v1/object/public/icons/wolf-512x512.png';
      }
    }
    
    // For group conversations or fallback
    return conversation.avatar_url || 'https://tvnpgbjypnezoasbhbwx.supabase.co/storage/v1/object/public/icons/wolf-512x512.png';
  };

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) {
      // Today - show time
      return date.toLocaleTimeString([], { 
        hour: '2-digit', 
        minute: '2-digit' 
      });
    } else if (diffDays === 1) {
      // Yesterday
      return 'Yesterday';
    } else if (diffDays < 7) {
      // This week - show day name
      return date.toLocaleDateString([], { weekday: 'short' });
    } else {
      // Older - show date
      return date.toLocaleDateString([], { 
        month: 'short', 
        day: 'numeric' 
      });
    }
  };

  if (loading || loadingConversation) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-black text-white flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 bg-black border-b border-gray-800">
          <div className="flex items-center gap-3">
            <button 
              onClick={() => router.back()}
              className="text-white hover:text-gray-300 transition-colors"
              aria-label="Go back"
            >
              <ArrowLeft className="h-6 w-6" />
            </button>
            <h1 className="text-white font-semibold text-lg">Messages</h1>
          </div>
        </div>

        {/* Error Display */}
        <div className="flex-1 flex items-center justify-center p-4">
          <div className="text-center max-w-md">
            <div className="w-16 h-16 bg-red-600 rounded-full flex items-center justify-center mb-4 mx-auto">
              <span className="text-2xl">⚠️</span>
            </div>
            <h2 className="text-white text-xl font-semibold mb-2">Connection Error</h2>
            <p className="text-gray-400 text-sm mb-6">{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="px-6 py-3 bg-red-600 hover:bg-red-700 text-white rounded-full transition-colors"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white flex flex-col">
      <ConnectionStatus />
      
      {/* TikTok-Style Header */}
      <div className="flex items-center justify-between p-4 bg-black border-b border-gray-900">
        <div className="flex items-center gap-3">
          <button 
            onClick={() => router.back()}
            className="text-white hover:text-gray-300 transition-colors"
            aria-label="Go back"
          >
            <ArrowLeft className="h-6 w-6" />
          </button>
          
          <div className="w-10 h-10 rounded-full overflow-hidden bg-gray-800">
            <Image
              src={getAvatarUrl()}
              alt={getDisplayName()}
              width={40}
              height={40}
              className="w-full h-full object-cover"
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                target.src = 'https://tvnpgbjypnezoasbhbwx.supabase.co/storage/v1/object/public/icons/wolf-512x512.png';
              }}
            />
          </div>
          
          <div>
            <h1 className="text-white font-semibold text-lg">
              {getDisplayName()}
            </h1>
            <p className="text-gray-400 text-sm">
              {conversationData?.participants.some(p => p.is_active && p.user_id !== currentUserId) 
                ? 'Active' 
                : 'Offline'}
            </p>
          </div>
        </div>
        
        <button 
          className="text-white hover:text-gray-300 transition-colors" 
          aria-label="More options"
        >
          <MoreVertical className="h-6 w-6" />
        </button>
      </div>

      {/* Messages Area - TikTok Style */}
      <div className="flex-1 overflow-y-auto bg-black">
        {messages.length === 0 ? (
          <div className="flex items-center justify-center py-20">
            <div className="text-center">
              <div className="w-20 h-20 bg-gray-800 rounded-full flex items-center justify-center mb-4 mx-auto">
                <span className="text-3xl">💬</span>
              </div>
              <p className="text-white text-lg mb-2">No messages yet</p>
              <p className="text-gray-400 text-sm">
                Start the conversation with {getDisplayName()}!
              </p>
            </div>
          </div>
        ) : (
          <div className="p-4 space-y-3">
            {messages.map((message, index) => {
              const isFromCurrentUser = message.sender_id === currentUserId;
              const showAvatar = !isFromCurrentUser && 
                (index === 0 || messages[index - 1]?.sender_id !== message.sender_id);
              
              // Skip deleted messages unless they have a placeholder
              if (message.is_deleted && !message.deleted_at) return null;
              
              return (
                <div
                  key={message.id}
                  className={`flex gap-2 ${isFromCurrentUser ? 'justify-end' : 'justify-start'}`}
                >
                  {/* Avatar for other user messages */}
                  {!isFromCurrentUser && (
                    <div className="w-8 h-8 flex-shrink-0">
                      {showAvatar && (
                        <div className="w-8 h-8 rounded-full overflow-hidden bg-gray-800">
                          <Image
                            src={message.sender?.avatar_url || 
                                 message.sender?.profile_image_url || 
                                 'https://tvnpgbjypnezoasbhbwx.supabase.co/storage/v1/object/public/icons/wolf-512x512.png'}
                            alt={message.sender?.display_name || 'User'}
                            width={32}
                            height={32}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              const target = e.target as HTMLImageElement;
                              target.src = 'https://tvnpgbjypnezoasbhbwx.supabase.co/storage/v1/object/public/icons/wolf-512x512.png';
                            }}
                          />
                        </div>
                      )}
                    </div>
                  )}
                  
                  <div className={`max-w-[70%] ${isFromCurrentUser ? 'ml-12' : 'mr-12'}`}>
                    {message.is_deleted ? (
                      <div className="px-4 py-2 rounded-2xl bg-gray-900 text-gray-500 italic">
                        This message was deleted
                      </div>
                    ) : (
                      <>
                        <div
                          className={`px-4 py-2 rounded-2xl ${
                            isFromCurrentUser
                              ? 'bg-gradient-to-r from-pink-500 to-red-500 text-white rounded-br-md shadow-md'
                              : 'bg-gray-800 text-white rounded-bl-md'
                          }`}
                        >
                          {/* Reply indicator if replying to another message */}
                          {message.reply_to_id && (
                            <div className="text-xs opacity-70 mb-1 pb-1 border-b border-white/20">
                              Replying to a message
                            </div>
                          )}
                          
                          {/* Message content */}
                          <p className="text-sm break-words whitespace-pre-wrap">
                            {message.content}
                          </p>
                          
                          {/* Media preview if present */}
                          {message.media_url && message.media_type?.startsWith('image') && (
                            <div className="mt-2">
                              <Image
                                src={message.media_url}
                                alt="Shared image"
                                width={200}
                                height={200}
                                className="rounded-lg max-w-full h-auto"
                              />
                            </div>
                          )}
                          
                          {/* Edited indicator */}
                          {message.is_edited && (
                            <span className="text-xs opacity-70 ml-2">(edited)</span>
                          )}
                        </div>
                        
                        {/* Timestamp */}
                        <p className={`text-xs mt-1 px-2 ${
                          isFromCurrentUser ? 'text-right text-gray-400' : 'text-left text-gray-500'
                        }`}>
                          {message.created_at ? formatTime(message.created_at) : ''}
                        </p>
                      </>
                    )}
                  </div>
                </div>
              );
            })}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Input Area - TikTok Style */}
      <div className="border-t border-gray-900 bg-black p-4">
        {/* Quick Emoji Reactions */}
        <div className="flex gap-1 py-2 mb-2">
          {['😀', '😂', '😍', '👍', '🔥', '🎉'].map((emoji) => (
            <button
              key={emoji}
              onClick={() => setNewMessage(prev => prev + emoji)}
              className="text-2xl hover:scale-125 active:scale-110 transition-transform duration-200 p-2 min-w-[40px]"
              aria-label={`Add ${emoji} emoji`}
            >
              {emoji}
            </button>
          ))}
        </div>
        
        {/* Message Input */}
        <div className="flex items-end gap-3">
          <div className="flex-1 relative">
            <input
              ref={inputRef}
              type="text"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="Type a message..."
              className="w-full bg-gray-900 border border-gray-800 rounded-full px-4 py-3 pr-12 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent transition-all"
              disabled={sending}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSendMessage();
                }
              }}
            />
            
            {/* Send Button */}
            <button
              onClick={handleSendMessage}
              disabled={!newMessage.trim() || sending}
              className="absolute right-2 bottom-2 p-2 bg-gradient-to-r from-pink-500 to-red-500 hover:from-pink-600 hover:to-red-600 disabled:from-gray-600 disabled:to-gray-600 disabled:cursor-not-allowed rounded-full transition-all duration-200 transform hover:scale-105 active:scale-95 shadow-lg"
              aria-label="Send message"
            >
              {sending ? (
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white" />
              ) : (
                <Send className="h-5 w-5 text-white" />
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}