'use client';

import { useState, useEffect, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { ArrowLeft, Send, MoreVertical } from 'lucide-react';
import Image from 'next/image';

interface Message {
  id: string;
  sender_id: string;
  content: string;
  created_at: string;
  message_type: string;
  media_url?: string;
  media_type?: string;
  media_thumbnail_url?: string;
  attachments?: any[];
  is_read?: boolean;
  status?: string;
  reply_to_id?: string;
}

interface OtherUser {
  id: string;
  auth_id: string;
  display_name: string;
}

export default function TikTokStyleMessagesPage() {
  const params = useParams();
  const router = useRouter();
  const { currentUser } = useAuth();
  const recipientUserId = params.userId as string;
  
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [otherUser, setOtherUser] = useState<OtherUser | null>(null);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [currentUserDbId, setCurrentUserDbId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!currentUser || !recipientUserId) return;
    loadConversation();
  }, [currentUser, recipientUserId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const loadConversation = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch(`/api/messages/conversation/${recipientUserId}`);
      
      if (response.ok) {
        const data = await response.json();
        setMessages(data.messages || []);
        setOtherUser(data.otherUser);
        setConversationId(data.conversationId);
        setCurrentUserDbId(data.currentUserDbId);
      } else {
        const errorData = await response.json().catch(() => ({}));
        const errorMessage = errorData.error || `Failed to load conversation (${response.status})`;
        setError(errorMessage);
        console.error('Failed to load conversation:', response.status, errorData);
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Network error occurred';
      setError(errorMessage);
      console.error('Error loading conversation:', error);
    } finally {
      setLoading(false);
    }
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !conversationId || sending) return;

    try {
      setSending(true);
      
      // Create message API call using RPC
      const response = await fetch('/api/messages/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          conversationId,
          content: newMessage.trim(),
        }),
      });

      if (response.ok) {
        const data = await response.json();
        // Add message to local state immediately
        const newMsg: Message = {
          id: data.messageId || Date.now().toString(),
          sender_id: currentUserDbId || '',
          content: newMessage.trim(),
          created_at: new Date().toISOString(),
          message_type: 'text'
        };
        setMessages(prev => [...prev, newMsg]);
        setNewMessage('');
      }
    } catch (error) {
      console.error('Error sending message:', error);
    } finally {
      setSending(false);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const getDisplayName = () => {
    return otherUser?.display_name || 'Wolf Pack Member';
  };

  const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  if (loading) {
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
              onClick={loadConversation}
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
      {/* TikTok-Style Header */}
      <div className="flex items-center justify-between p-4 bg-black border-b border-gray-900">
        <div className="flex items-center gap-3">
          <button 
            onClick={() => router.back()}
            className="text-white hover:text-gray-300 transition-colors"
          >
            <ArrowLeft className="h-6 w-6" />
          </button>
          
          <div className="w-10 h-10 rounded-full overflow-hidden bg-gray-800">
            <Image
              src="/icons/wolf-icon.png"
              alt={getDisplayName()}
              width={40}
              height={40}
              className="w-full h-full object-cover"
            />
          </div>
          
          <div>
            <h1 className="text-white font-semibold text-lg">
              {getDisplayName()}
            </h1>
            <p className="text-gray-400 text-sm">Active</p>
          </div>
        </div>
        
        <button className="text-white hover:text-gray-300 transition-colors">
          <MoreVertical className="h-6 w-6" />
        </button>
      </div>

      {/* Messages Area - TikTok Style */}
      <div className="flex-1 overflow-y-auto bg-black">
        {messages.length === 0 ? (
          <div className="flex-1 flex items-center justify-center py-20">
            <div className="text-center">
              <div className="w-20 h-20 bg-gray-800 rounded-full flex items-center justify-center mb-4 mx-auto">
                <span className="text-3xl">💬</span>
              </div>
              <p className="text-white text-lg mb-2">No messages yet</p>
              <p className="text-gray-400 text-sm">Start the conversation with {getDisplayName()}!</p>
            </div>
          </div>
        ) : (
          <div className="p-4 space-y-3">
            {messages.map((message, index) => {
              const isFromCurrentUser = message.sender_id === currentUserDbId;
              const showAvatar = !isFromCurrentUser && (index === 0 || messages[index - 1]?.sender_id !== message.sender_id);
              
              return (
                <div
                  key={message.id}
                  className={`flex gap-2 ${isFromCurrentUser ? 'justify-end' : 'justify-start'}`}
                >
                  {/* Avatar for other user messages */}
                  {!isFromCurrentUser && (
                    <div className="w-8 h-8 rounded-full overflow-hidden bg-gray-800 flex-shrink-0">
                      {showAvatar ? (
                        <Image
                          src="/icons/wolf-icon.png"
                          alt={getDisplayName()}
                          width={32}
                          height={32}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-8 h-8"></div>
                      )}
                    </div>
                  )}
                  
                  <div className={`max-w-xs ${isFromCurrentUser ? 'ml-12' : 'mr-12'}`}>
                    <div
                      className={`px-4 py-2 rounded-2xl ${
                        isFromCurrentUser
                          ? 'bg-gradient-to-r from-pink-500 to-red-500 text-white rounded-br-md shadow-md'
                          : 'bg-gray-800 text-white rounded-bl-md'
                      }`}
                    >
                      <p className="text-sm break-words">{message.content}</p>
                    </div>
                    <p className={`text-xs mt-1 px-2 ${
                      isFromCurrentUser ? 'text-right text-gray-400' : 'text-left text-gray-500'
                    }`}>
                      {formatTime(message.created_at)}
                    </p>
                  </div>
                </div>
              );
            })}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* TikTok-Style Message Input */}
      <div className="bg-black border-t border-gray-900 p-4">
        {/* Quick Emoji Reactions - Horizontally Scrollable */}
        <div className="mb-3 overflow-x-auto scrollbar-hide">
          <div className="flex gap-3 px-2 min-w-max">
            {['❤️', '😂', '😍', '👏', '🔥', '💯', '🐺', '🎉', '😊', '😭', '🤣', '😘', '🥰', '😎', '🤩', '🥳', '🤗', '😤', '😡', '🤯'].map((emoji) => (
              <button
                key={emoji}
                onClick={() => setNewMessage(prev => prev + emoji)}
                className="text-2xl hover:scale-125 active:scale-110 transition-transform duration-200 p-2 min-w-[40px]"
              >
                {emoji}
              </button>
            ))}
          </div>
        </div>
        
        {/* Input Area */}
        <div className="flex items-end gap-3">
          <div className="flex-1 relative">
            <input
              type="text"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="Add comment..."
              className="w-full bg-gray-900 border border-gray-800 rounded-full px-4 py-3 pr-12 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent transition-all"
              disabled={sending}
              onKeyPress={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  sendMessage();
                }
              }}
            />
          </div>
          
          <button
            onClick={sendMessage}
            disabled={!newMessage.trim() || sending}
            className="p-3 bg-gradient-to-r from-pink-500 to-red-500 hover:from-pink-600 hover:to-red-600 disabled:from-gray-600 disabled:to-gray-600 disabled:cursor-not-allowed rounded-full transition-all duration-200 transform hover:scale-105 active:scale-95 flex-shrink-0 shadow-lg"
          >
            {sending ? (
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
            ) : (
              <Send className="h-5 w-5 text-white" />
            )}
          </button>
        </div>
      </div>
    </div>
  );
}