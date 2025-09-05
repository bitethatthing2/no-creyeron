'use client';

import { useState, useRef } from 'react';
import { Send } from 'lucide-react';

interface ChatInputProps {
  onSendMessage: (message: string) => Promise<void>;
  disabled?: boolean;
  placeholder?: string;
}

export function ChatInput({ 
  onSendMessage, 
  disabled = false, 
  placeholder = "Type a message..." 
}: ChatInputProps) {
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleSend = async () => {
    if (!message.trim() || sending || disabled) return;

    const messageText = message.trim();
    setMessage('');
    setSending(true);

    try {
      await onSendMessage(messageText);
      inputRef.current?.focus();
    } catch (error) {
      console.error('Failed to send message:', error);
      setMessage(messageText); // Restore message on error
    } finally {
      setSending(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="border-t border-gray-900 bg-black p-4">
      {/* Quick Emoji Reactions */}
      <div className="flex gap-1 py-2 mb-2">
        {['😀', '😂', '😍', '👍', '🔥', '🎉'].map((emoji) => (
          <button
            key={emoji}
            onClick={() => setMessage(prev => prev + emoji)}
            className="text-2xl hover:scale-125 active:scale-110 transition-transform duration-200 p-2 min-w-[40px]"
            aria-label={`Add ${emoji} emoji`}
            disabled={disabled}
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
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder={placeholder}
            className="w-full bg-gray-900 border border-gray-800 rounded-full px-4 py-3 pr-12 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent transition-all"
            disabled={sending || disabled}
            onKeyDown={handleKeyDown}
          />
          
          {/* Send Button */}
          <button
            onClick={handleSend}
            disabled={!message.trim() || sending || disabled}
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
  );
}

export default ChatInput;